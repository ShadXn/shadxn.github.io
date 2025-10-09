// My Task Manager - View Only Version
class MyTaskManager {
    constructor() {
        this.tasks = [];
        this.showMainNumbers = true;
        this.showIndentNumbers = true;
        this.hideCompletedSteps = false;
        this.hideCompletedTasks = false;
        this.hideCompletedCategories = false;
        
        // View-only specific properties
        this.completionStates = {}; // Store user completion states by item ID
        this.autoReloadInterval = null;
        this.lastFetchTime = null;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.loadCompletionStates();
        this.bindEvents();
        this.startAutoReload();
        this.loadTasksFromJSON();
    }

    // View-only event binding
    bindEvents() {
        // Import Info toggle button
        document.getElementById('import-info-btn').addEventListener('click', () => this.toggleImportInfo());
        
        // Export button
        document.getElementById('export-btn').addEventListener('click', () => this.openExportModal());

        // Export modal
        document.getElementById('close-export-modal').addEventListener('click', () => this.closeExportModal());
        document.querySelectorAll('.export-format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleExportFormat(e.target.closest('.export-format-btn').dataset.format));
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.closeSettings());

        // Settings toggles
        document.getElementById('show-main-numbers').addEventListener('change', (e) => this.toggleMainNumbers(e.target.checked));
        document.getElementById('show-indent-numbers').addEventListener('change', (e) => this.toggleIndentNumbers(e.target.checked));
        document.getElementById('hide-completed-steps').addEventListener('change', (e) => this.toggleHideCompletedSteps(e.target.checked));
        document.getElementById('hide-completed-tasks').addEventListener('change', (e) => this.toggleHideCompletedTasks(e.target.checked));
        document.getElementById('hide-completed-categories').addEventListener('change', (e) => this.toggleHideCompletedCategories(e.target.checked));

        // Image modal
        document.getElementById('close-image-modal').addEventListener('click', () => this.closeImageModal());

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });
    }

    // Auto-load from mytask.json
    async loadTasksFromJSON() {
        try {
            const response = await fetch('mytask.json');
            
            if (response.ok) {
                const jsonData = await response.json();
                
                // Track last modified for change detection
                this.lastModified = response.headers.get('Last-Modified') || new Date().toISOString();
                
                this.importJsonData(jsonData);
                this.updateStatus(`Loaded ${this.tasks.length} tasks from mytask.json`, true);
                this.lastFetchTime = Date.now();
                this.updateLastModified();
                
                // Auto-hide success message after 60 seconds
                this.scheduleStatusHide();
            } else {
                console.error('Fetch failed with status:', response.status, response.statusText);
                this.updateStatus(`mytask.json not found (${response.status}: ${response.statusText})`, false);
            }
        } catch (error) {
            console.error('Error loading mytask.json:', error);
            console.error('Error stack:', error.stack);
            console.error('Error name:', error.name);
            this.updateStatus(`Error: ${error.message}`, false);
            
            // Show empty state if loading fails
            this.tasks = [];
            this.render();
        }
    }

    startAutoReload() {
        // Check for file changes every 30 seconds (less aggressive)
        this.autoReloadInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000);
    }

    // Only reload if file has actually changed
    async checkForUpdates() {
        try {
            const response = await fetch('mytask.json', { method: 'HEAD' });
            if (response.ok) {
                const lastModified = response.headers.get('Last-Modified');
                if (lastModified && lastModified !== this.lastModified) {
                    console.log('File changed, reloading...');
                    this.loadTasksFromJSON();
                }
            }
        } catch (error) {
            // Silently fail - don't spam console with errors
        }
    }

    stopAutoReload() {
        if (this.autoReloadInterval) {
            clearInterval(this.autoReloadInterval);
            this.autoReloadInterval = null;
        }
    }

    importJsonData(jsonData) {
        try {
            // Support both old format (array) and new format (object with tasks)
            let newTasks = [];
            if (Array.isArray(jsonData)) {
                newTasks = jsonData;
            } else if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
                newTasks = jsonData.tasks;
                // Also load settings if available
                if (jsonData.settings) {
                    this.showMainNumbers = jsonData.settings.showMainNumbers !== undefined ? jsonData.settings.showMainNumbers : true;
                    this.showIndentNumbers = jsonData.settings.showIndentNumbers !== undefined ? jsonData.settings.showIndentNumbers : true;
                    this.hideCompletedSteps = jsonData.settings.hideCompletedSteps || false;
                    this.hideCompletedTasks = jsonData.settings.hideCompletedTasks || false;
                    this.hideCompletedCategories = jsonData.settings.hideCompletedCategories || false;
                }
            } else {
                throw new Error('Invalid JSON format. Expected array or object with tasks property.');
            }

            // Convert flat structure to hierarchical if needed
            newTasks = this.convertFlatToHierarchical(newTasks);

            // Apply user completion states to the new tasks
            this.applyCompletionStates(newTasks);
            
            this.tasks = newTasks;
            this.updateTaskCount();
            this.render();
        } catch (error) {
            console.error('Error in importJsonData:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    // Convert flat task structure with indentLevel to hierarchical structure with children
    convertFlatToHierarchical(flatTasks) {
        if (!Array.isArray(flatTasks) || flatTasks.length === 0) return [];
        
        // Check if conversion is needed (items with indentLevel suggest flat structure)
        const needsConversion = flatTasks.some(task => task.indentLevel !== undefined);
        
        if (!needsConversion) {
            // Already hierarchical, just ensure children property exists
            return flatTasks.map(task => ({
                ...task,
                children: task.children || []
            }));
        }
        
        // Sort by order first
        const sortedTasks = [...flatTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Group by indent level
        const hierarchy = [];
        let stack = [];
        
        sortedTasks.forEach(task => {
            const level = task.indentLevel || 0;
            const item = {
                ...task,
                children: [] // Initialize empty children array, ignore subItems
            };
            
            // Remove old properties that aren't needed
            delete item.subItems;
            delete item.parentId;
            
            // Adjust stack to current level
            while (stack.length > level) {
                stack.pop();
            }
            
            if (level === 0) {
                hierarchy.push(item);
                stack = [item];
            } else {
                const parent = stack[stack.length - 1];
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(item);
                }
                stack.push(item);
            }
        });
        
        return hierarchy;
    }

    // Apply saved completion states to tasks
    applyCompletionStates(items) {
        for (const item of items) {
            if (this.completionStates[item.id] !== undefined) {
                item.completed = this.completionStates[item.id];
            }
            if (item.children && item.children.length > 0) {
                this.applyCompletionStates(item.children);
            }
        }
    }

    // Save completion state when user marks item complete
    saveCompletionState(itemId, completed) {
        this.completionStates[itemId] = completed;
        try {
            localStorage.setItem('mytask_completion_states', JSON.stringify(this.completionStates));
        } catch (error) {
            console.error('Failed to save completion states:', error);
        }
    }

    // Load completion states from localStorage
    loadCompletionStates() {
        try {
            const saved = localStorage.getItem('mytask_completion_states');
            if (saved) {
                this.completionStates = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load completion states:', error);
            this.completionStates = {};
        }
    }

    // Export current state (keeping hierarchical format like original)
    exportTasks() {
        // Apply completion states to tasks before export
        const tasksWithCompletion = this.applyCompletionStates(this.tasks);
        
        const data = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            tasks: tasksWithCompletion,
            settings: {
                showMainNumbers: this.showMainNumbers,
                showIndentNumbers: this.showIndentNumbers,
                hideCompletedSteps: this.hideCompletedSteps,
                hideCompletedTasks: this.hideCompletedTasks,
                hideCompletedCategories: this.hideCompletedCategories
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mytasks_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Apply completion states to hierarchical tasks
    applyCompletionStates(tasks) {
        return tasks.map(task => {
            const taskWithCompletion = {
                ...task,
                completed: this.completionStates[task.id] || task.completed || false
            };
            
            if (task.children) {
                taskWithCompletion.children = this.applyCompletionStates(task.children);
            }
            
            return taskWithCompletion;
        });
    }

    // Export Modal Methods
    openExportModal() {
        document.getElementById('export-modal').classList.remove('hidden');
    }

    closeExportModal() {
        document.getElementById('export-modal').classList.add('hidden');
    }

    handleExportFormat(format) {
        this.closeExportModal();
        
        switch(format) {
            case 'json':
                this.exportTasks();
                break;
            case 'csv':
                this.exportAsCSV();
                break;
            case 'txt':
                this.exportAsText();
                break;
        }
    }

    // Export as CSV
    exportAsCSV() {
        let csv = 'Type,Title,Description,Link,Parent,Completed,Reward,Created\n';
        
        const addItemToCSV = (item, parentTitle = '') => {
            const title = (item.title || '').replace(/"/g, '""');
            const description = (item.description || '').replace(/"/g, '""');
            const link = (item.link || '').replace(/"/g, '""');
            const reward = (item.reward || '').replace(/"/g, '""');
            const created = item.createdAt || '';
            const completed = this.completionStates[item.id] || item.completed || false;
            
            csv += `"${item.type}","${title}","${description}","${link}","${parentTitle}","${completed}","${reward}","${created}"\n`;
            
            if (item.children) {
                item.children.forEach(child => addItemToCSV(child, title));
            }
        };
        
        this.tasks.forEach(task => addItemToCSV(task));
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mytasks_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Export as plain text
    exportAsText() {
        let text = `Task Export - ${new Date().toLocaleDateString()}\n`;
        text += '='.repeat(50) + '\n\n';
        
        const addItemToText = (item, indent = 0) => {
            const prefix = '  '.repeat(indent);
            const status = this.completionStates[item.id] || item.completed ? '✓' : '○';
            const typeIcon = item.type === 'category' ? '📁' : item.type === 'task' ? '🎯' : '📝';
            
            text += `${prefix}${status} ${typeIcon} ${item.title}\n`;
            
            if (item.description) {
                text += `${prefix}    ${item.description}\n`;
            }
            
            if (item.reward && item.type === 'task') {
                text += `${prefix}    💰 Reward: ${item.reward}\n`;
            }
            
            if (item.link) {
                text += `${prefix}    🔗 Link: ${item.link}\n`;
            }
            
            if (item.children) {
                item.children.forEach(child => addItemToText(child, indent + 1));
            }
            
            text += '\n';
        };
        
        this.tasks.forEach(task => addItemToText(task));
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mytasks_export_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Convert hierarchical structure back to flat format for export compatibility
    convertHierarchicalToFlat(hierarchicalTasks) {
        const flatTasks = [];
        let order = 0;
        
        const flattenRecursive = (items, level = 0, parentId = null) => {
            items.forEach(item => {
                const flatItem = {
                    ...item,
                    indentLevel: level,
                    parentId: parentId,
                    subItems: [], // Empty for compatibility
                    order: order++
                };
                
                // Remove children property for flat format
                delete flatItem.children;
                
                flatTasks.push(flatItem);
                
                // Recursively flatten children
                if (item.children && item.children.length > 0) {
                    flattenRecursive(item.children, level + 1, item.id);
                }
            });
        };
        
        flattenRecursive(hierarchicalTasks);
        return flatTasks;
    }

    updateStatus(message, isLoaded) {
        const statusText = document.getElementById('status-text');
        const indicator = document.getElementById('status-indicator');
        
        statusText.textContent = message;
        if (isLoaded) {
            indicator.classList.add('loaded');
        } else {
            indicator.classList.remove('loaded');
        }
    }

    scheduleStatusHide() {
        // Clear any existing timeout
        if (this.statusHideTimeout) {
            clearTimeout(this.statusHideTimeout);
        }
        
        // Hide status bar after 60 seconds for successful loads
        this.statusHideTimeout = setTimeout(() => {
            const statusBar = document.querySelector('.status-bar');
            statusBar.classList.add('hidden');
            this.statusHideTimeout = null;
        }, 60000);
    }

    updateTaskCount() {
        const count = this.countAllItems(this.tasks);
        const countElement = document.getElementById('task-count');
        countElement.textContent = `${count} items`;
        countElement.style.display = count > 0 ? 'inline-block' : 'none';
    }

    countAllItems(items) {
        let count = 0;
        for (const item of items) {
            count++;
            if (item.children && item.children.length > 0) {
                count += this.countAllItems(item.children);
            }
        }
        return count;
    }

    updateLastModified() {
        if (this.lastModified) {
            const date = new Date(this.lastModified);
            document.getElementById('last-updated').textContent = `Last updated: ${date.toLocaleString()}`;
            document.getElementById('last-updated').style.display = 'block';
        }
    }

    // Settings management
    loadSettings() {
        try {
            const settings = localStorage.getItem('myTaskManagerSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.showMainNumbers = parsed.showMainNumbers !== undefined ? parsed.showMainNumbers : true;
                this.showIndentNumbers = parsed.showIndentNumbers !== undefined ? parsed.showIndentNumbers : true;
                this.hideCompletedSteps = parsed.hideCompletedSteps || false;
                this.hideCompletedTasks = parsed.hideCompletedTasks || false;
                this.hideCompletedCategories = parsed.hideCompletedCategories || false;
                this.autoReloadEnabled = parsed.autoReloadEnabled || false;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                showMainNumbers: this.showMainNumbers,
                showIndentNumbers: this.showIndentNumbers,
                hideCompletedSteps: this.hideCompletedSteps,
                hideCompletedTasks: this.hideCompletedTasks,
                hideCompletedCategories: this.hideCompletedCategories,
                autoReloadEnabled: this.autoReloadEnabled
            };
            localStorage.setItem('myTaskManagerSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    // Toggle methods
    toggleMainNumbers(show) {
        this.showMainNumbers = show;
        this.updateNumberVisibility();
        this.saveSettings();
        this.render();
    }

    toggleIndentNumbers(show) {
        this.showIndentNumbers = show;
        this.updateNumberVisibility();
        this.saveSettings();
        this.render();
    }

    toggleHideCompletedSteps(hide) {
        this.hideCompletedSteps = hide;
        this.saveSettings();
        this.render();
    }

    toggleHideCompletedTasks(hide) {
        this.hideCompletedTasks = hide;
        this.saveSettings();
        this.render();
    }

    toggleHideCompletedCategories(hide) {
        this.hideCompletedCategories = hide;
        this.saveSettings();
        this.render();
    }

    updateNumberVisibility() {
        const container = document.querySelector('.task-list-container');
        container.classList.remove('hide-main-numbers', 'hide-indent-numbers');
        
        if (!this.showMainNumbers) {
            container.classList.add('hide-main-numbers');
        }
        if (!this.showIndentNumbers) {
            container.classList.add('hide-indent-numbers');
        }
    }

    // Toggle Import Info status bar
    toggleImportInfo() {
        const statusBar = document.getElementById('status-bar');
        const importInfoBtn = document.getElementById('import-info-btn');
        
        if (statusBar.classList.contains('hidden')) {
            statusBar.classList.remove('hidden');
            importInfoBtn.textContent = '🔽 Import Info';
        } else {
            statusBar.classList.add('hidden');
            importInfoBtn.textContent = 'ℹ️ Import Info';
        }
    }

    // Modal management
    openSettings() {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('hidden');
        
        // Update toggle states
        document.getElementById('show-main-numbers').checked = this.showMainNumbers;
        document.getElementById('show-indent-numbers').checked = this.showIndentNumbers;
        document.getElementById('hide-completed-steps').checked = this.hideCompletedSteps;
        document.getElementById('hide-completed-tasks').checked = this.hideCompletedTasks;
        document.getElementById('hide-completed-categories').checked = this.hideCompletedCategories;
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    openModal(type, item = null) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const rewardGroup = document.getElementById('reward-group');
        const form = document.getElementById('task-form');

        this.editingItem = item;
        
        if (type === 'task') {
            title.textContent = 'Edit Task';
            rewardGroup.style.display = 'block';
        } else if (type === 'category') {
            title.textContent = 'Edit Category';
            rewardGroup.style.display = 'none';
        } else {
            title.textContent = 'Edit Step';
            rewardGroup.style.display = 'none';
        }

        if (item) {
            document.getElementById('title').value = item.title;
            document.getElementById('description').value = item.description || '';
            document.getElementById('reward').value = item.reward || '';
            document.getElementById('link').value = item.link || '';
            
            if (item.image) {
                this.showImagePreview(item.image);
            }
        } else {
            form.reset();
            this.hideImagePreview();
        }

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
        this.editingItem = null;
        this.hideImagePreview();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (!this.editingItem) return;
        
        const formData = new FormData(e.target);
        const title = formData.get('title').trim();
        const description = formData.get('description').trim();
        const reward = formData.get('reward').trim();
        const link = formData.get('link').trim();
        
        if (!title) return;

        // Update the item
        this.editingItem.title = title;
        this.editingItem.description = description;
        this.editingItem.reward = reward;
        this.editingItem.link = link;

        // Handle image
        const previewImg = document.getElementById('preview-img');
        if (previewImg.src && previewImg.src !== window.location.href) {
            this.editingItem.image = previewImg.src;
        } else if (!previewImg.src || previewImg.src === window.location.href) {
            this.editingItem.image = null;
        }

        this.closeModal();
        this.render();
    }

    // Image handling
    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    showImagePreview(src) {
        const preview = document.getElementById('image-preview');
        const img = document.getElementById('preview-img');
        img.src = src;
        preview.classList.remove('hidden');
    }

    hideImagePreview() {
        const preview = document.getElementById('image-preview');
        preview.classList.add('hidden');
        document.getElementById('preview-img').src = '';
    }

    removeImage() {
        this.hideImagePreview();
        document.getElementById('image').value = '';
    }

    setupImageClick(element, item) {
        if (item.image) {
            const img = element.querySelector('.item-image img');
            if (img) {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showFullImage(item.image);
                });
            }
        }
    }

    showFullImage(src) {
        const modal = document.getElementById('image-modal');
        const img = document.getElementById('modal-image');
        img.src = src;
        modal.classList.remove('hidden');
    }

    closeImageModal() {
        document.getElementById('image-modal').classList.add('hidden');
    }

    // Context menu
    handleRightClick(e) {
        const itemElement = e.target.closest('.task-item, .step-item, .category-item');
        if (itemElement) {
            e.preventDefault();
            this.currentItemId = itemElement.dataset.id;
            this.showContextMenu(e.clientX, e.clientY);
        }
    }

    showContextMenu(x, y) {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.classList.remove('hidden');
    }

    hideContextMenu() {
        document.getElementById('context-menu').classList.add('hidden');
    }

    // Context menu actions
    editCurrentItem() {
        const item = this.findItemById(this.currentItemId);
        if (item) {
            this.openModal(item.type, item);
        }
        this.hideContextMenu();
    }

    deleteCurrentItem() {
        if (confirm('Are you sure you want to delete this item?')) {
            this.removeItemById(this.currentItemId);
            this.render();
            this.updateTaskCount();
        }
        this.hideContextMenu();
    }

    toggleCurrentItemComplete() {
        const item = this.findItemById(this.currentItemId);
        if (item) {
            item.completed = !item.completed;
            this.render();
        }
        this.hideContextMenu();
    }

    // Utility methods
    findItemById(id, items = this.tasks) {
        for (const item of items) {
            if (item.id === id) {
                return item;
            }
            if (item.children) {
                const found = this.findItemById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    }

    removeItemById(id, items = this.tasks) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                items.splice(i, 1);
                return true;
            }
            if (items[i].children) {
                if (this.removeItemById(id, items[i].children)) {
                    return true;
                }
            }
        }
        return false;
    }

    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Simplified render method (reusing most of the logic from the main task manager)
    render() {
        const taskList = document.getElementById('task-list');
        const emptyState = document.getElementById('empty-state');
        const container = document.querySelector('.task-list-container');
        
        if (this.tasks.length === 0) {
            taskList.innerHTML = '';
            emptyState.classList.remove('hidden');
            container.classList.remove('completion-hiding-active');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        // Check if any completion hiding is active
        const isHidingActive = this.hideCompletedSteps || this.hideCompletedTasks || this.hideCompletedCategories;
        if (isHidingActive) {
            container.classList.add('completion-hiding-active');
        } else {
            container.classList.remove('completion-hiding-active');
        }
        
        // Sort tasks by order first, then apply visibility filtering
        const sortedTasks = [...this.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Get visible tasks (applies completion hiding and collapse filtering)
        const visibleTasks = this.getVisibleTasks(sortedTasks);
        
        // Create numbering system for visible items only
        const itemsHTML = this.createNumberedItemsHTML(visibleTasks);
        
        taskList.innerHTML = itemsHTML;
        
        // Setup events for all rendered items
        visibleTasks.forEach(item => {
            const element = document.querySelector(`[data-id="${item.id}"]`);
            if (element) {
                this.setupItemEvents(element, item);
                this.setupImageClick(element, item);
            }
        });
        
        this.updateNumberVisibility();
        
        // Update statistics
        this.updateStatistics();
    }

    updateStatistics() {
        // Count all items recursively, using completion states for view-only mode
        const stats = {
            categories: { total: 0, completed: 0 },
            tasks: { total: 0, completed: 0 },
            steps: { total: 0, completed: 0 },
            total: { total: 0, completed: 0 }
        };

        const countItems = (items) => {
            items.forEach(item => {
                // Increment totals
                stats.total.total++;

                // Check completion status (use view-only completion states if available)
                const isCompleted = this.completionStates[item.id] || item.completed || false;

                // Fix: Handle different item types properly
                if (item.type === 'category') {
                    stats.categories.total++;
                    if (isCompleted) {
                        stats.categories.completed++;
                        stats.total.completed++;
                    }
                } else if (item.type === 'task') {
                    stats.tasks.total++;
                    if (isCompleted) {
                        stats.tasks.completed++;
                        stats.total.completed++;
                    }
                } else if (item.type === 'step') {
                    stats.steps.total++;
                    if (isCompleted) {
                        stats.steps.completed++;
                        stats.total.completed++;
                    }
                }

                // Recursively count children
                if (item.children && item.children.length > 0) {
                    countItems(item.children);
                }
            });
        };

        // Count all items
        countItems(this.tasks);

        // Update DOM elements (with null checks)
        const categoriesCount = document.getElementById('categories-count');
        const tasksCount = document.getElementById('tasks-count');
        const stepsCount = document.getElementById('steps-count');
        const totalCount = document.getElementById('total-count');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        if (categoriesCount) categoriesCount.textContent = `${stats.categories.completed}/${stats.categories.total}`;
        if (tasksCount) tasksCount.textContent = `${stats.tasks.completed}/${stats.tasks.total}`;
        if (stepsCount) stepsCount.textContent = `${stats.steps.completed}/${stats.steps.total}`;
        if (totalCount) totalCount.textContent = `${stats.total.completed}/${stats.total.total}`;

        // Calculate and update progress
        const progressPercent = stats.total.total > 0 ? Math.round((stats.total.completed / stats.total.total) * 100) : 0;
        
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
            
            // Update progress bar color based on completion
            if (progressPercent === 100) {
                progressFill.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            } else if (progressPercent >= 75) {
                progressFill.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            } else if (progressPercent >= 50) {
                progressFill.style.background = 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)';
            } else if (progressPercent >= 25) {
                progressFill.style.background = 'linear-gradient(135deg, #fd7e14 0%, #dc3545 100%)';
            } else {
                progressFill.style.background = 'linear-gradient(135deg, #dc3545 0%, #6c757d 100%)';
            }
        }
        
        if (progressText) progressText.textContent = `${progressPercent}%`;
    }

    // Copy the remaining methods from the main task manager
    // (createNumberedItemsHTML, getVisibleTasks, setupItemEvents, etc.)
    // These would be the same as in the main task.js file

    // Setup events for items (simplified for view-only)
    setupItemEvents(element, item) {
        // Complete button only
        const completeBtn = element.querySelector('.complete-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                item.completed = !item.completed;
                this.saveCompletionState(item.id, item.completed);
                
                // Check if hiding is active - if so, do full render to apply hiding logic
                const isHidingActive = this.hideCompletedSteps || this.hideCompletedTasks || this.hideCompletedCategories;
                if (isHidingActive) {
                    this.render();
                } else {
                    // No hiding active, just update this item visually
                    this.updateItemCompletion(element, item);
                    // Update statistics after completion toggle
                    this.updateStatistics();
                }
            });
        }

        // Remove edit and delete buttons from DOM
        const editBtn = element.querySelector('.edit-btn');
        const deleteBtn = element.querySelector('.delete-btn');
        if (editBtn) editBtn.remove();
        if (deleteBtn) deleteBtn.remove();
    }

    // Update item completion without full re-render
    updateItemCompletion(element, item) {
        const statusIndicator = element.querySelector('.status-indicator');
        const completeBtn = element.querySelector('.complete-btn');
        
        if (item.completed) {
            element.classList.add('completed');
            if (statusIndicator) {
                statusIndicator.classList.remove('status-pending');
                statusIndicator.classList.add('status-completed');
            }
            if (completeBtn) {
                completeBtn.innerHTML = '↶';
                completeBtn.title = 'Mark as Incomplete';
            }
        } else {
            element.classList.remove('completed');
            if (statusIndicator) {
                statusIndicator.classList.remove('status-completed');
                statusIndicator.classList.add('status-pending');
            }
            if (completeBtn) {
                completeBtn.innerHTML = '✓';
                completeBtn.title = 'Mark as Complete';
            }
        }
    }

    // Check if item and all its children are completed
    isFullyCompleted(item) {
        if (!item.completed) {
            return false;
        }
        
        if (item.children && item.children.length > 0) {
            return item.children.every(child => this.isFullyCompleted(child));
        }
        
        return true;
    }

    // Check if item should be hidden based on completion and settings
    shouldHideItem(item) {
        const hideBasedOnType = 
            (item.type === 'step' && this.hideCompletedSteps) ||
            (item.type === 'task' && this.hideCompletedTasks) ||
            (item.type === 'category' && this.hideCompletedCategories);
        
        if (!hideBasedOnType) {
            return false;
        }
        
        return this.isFullyCompleted(item);
    }

    // Get visible tasks (handling collapse and completion hiding)
    getVisibleTasks(hierarchicalTasks) {
        // First flatten to get all items with their levels
        const allFlatItems = [];
        hierarchicalTasks.forEach(item => this.flattenItem(item, 0, allFlatItems));
        
        const visible = [];
        let hideUntilLevel = null;
        let hideCompletedUntilLevel = null;
        
        for (const item of allFlatItems) {
            if (hideUntilLevel !== null && item.indentLevel > hideUntilLevel) {
                continue;
            }
            
            if (hideCompletedUntilLevel !== null && item.indentLevel > hideCompletedUntilLevel) {
                continue;
            }
            
            if (hideUntilLevel !== null && item.indentLevel <= hideUntilLevel) {
                hideUntilLevel = null;
            }
            
            if (hideCompletedUntilLevel !== null && item.indentLevel <= hideCompletedUntilLevel) {
                hideCompletedUntilLevel = null;
            }
            
            if (this.shouldHideItem(item)) {
                if (this.hasChildItems(item)) {
                    hideCompletedUntilLevel = item.indentLevel;
                }
                continue;
            }
            
            visible.push(item);
            
            if (item.collapsed && this.hasChildItems(item)) {
                hideUntilLevel = item.indentLevel;
            }
        }
        
        return visible;
    }

    hasChildItems(item) {
        return item.children && item.children.length > 0;
    }

    flattenItem(item, level = 0, result = []) {
        const flatItem = { ...item, indentLevel: level };
        result.push(flatItem);
        
        if (item.children && item.children.length > 0 && !item.collapsed) {
            item.children.forEach(child => {
                this.flattenItem(child, level + 1, result);
            });
        }
        
        return result;
    }

    createNumberedItemsHTML(flatItems) {
        let html = '';
        let mainNumber = 1;
        let indentNumbers = {};
        
        flatItems.forEach(item => {
            const isCategory = item.type === 'category';
            const isTask = item.type === 'task';
            const level = item.indentLevel;
            
            // Numbering logic
            let numberHtml = '';
            if (level === 0) {
                numberHtml = `<div class="item-number">${mainNumber}</div>`;
                mainNumber++;
                indentNumbers = {};
            } else {
                if (!indentNumbers[level]) {
                    indentNumbers[level] = 1;
                }
                numberHtml = `<div class="item-number">${indentNumbers[level]}</div>`;
                indentNumbers[level]++;
            }
            
            const completedClass = item.completed ? 'completed' : '';
            const indentClass = level > 0 ? `indent-${level}` : '';
            
            html += `
                <div class="item-wrapper ${indentClass}">
                    ${numberHtml}
                    <div class="${item.type}-item ${completedClass}" data-id="${item.id}">
                        <div class="item-header">
                            <div class="item-title${item.link ? ' has-link' : ''}" ${item.link ? `onclick="window.open('${item.link}', '_blank')"` : ''}>
                                <span class="status-indicator ${item.completed ? 'status-completed' : 'status-pending'}"></span>
                                ${item.title}
                            </div>
                            <div class="item-type-badge">
                                ${isCategory ? '📁 Category' : isTask ? '🎯 Task' : '📝 Step'}
                            </div>
                            <div class="item-controls">
                                <button class="control-btn complete-btn" title="Toggle Complete">
                                    ${item.completed ? '↶' : '✓'}
                                </button>
                            </div>
                        </div>
                        
                        <div class="item-content">
                            ${item.image ? `
                                <div class="item-image">
                                    <img src="${item.image}" alt="Task image" title="Click to view full size" />
                                </div>
                            ` : ''}
                            <div class="item-text">
                                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                                ${isTask && item.reward ? `<div class="item-reward">🎁 ${item.reward}</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MyTaskManager();
});
