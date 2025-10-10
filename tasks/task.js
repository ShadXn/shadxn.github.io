// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentItemId = null;
        this.editingItem = null;
        this.draggedItem = null;
        this.dropIndicator = null;
        this.showMainNumbers = true;
        this.showIndentNumbers = true;
        this.hideCompletedSteps = false;
        this.hideCompletedTasks = false;
        this.hideCompletedCategories = false;
        
        // Statistics control settings
        this.countCategoriesProgress = true;
        this.countTasksProgress = true;
        this.countStepsProgress = true;
        this.showCategoriesStats = true;
        this.showTasksStats = true;
        this.showStepsStats = true;
        
        // Auto-scroll variables
        this.autoScrollInterval = null;
        this.currentMouseY = null;
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.render();
        this.checkFirstTimeUser();
    }

    // Export/Import functionality
    exportAsJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            tasks: this.tasks,
            settings: this.settings
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `tasks_export_${new Date().toISOString().split('T')[0]}.json`);
    }

    exportAsCSV() {
        let csv = 'Type,Title,Description,Link,Parent,Completed,Reward,Created\n';
        
        const addItemToCSV = (item, parentTitle = '') => {
            const title = (item.title || '').replace(/"/g, '""');
            const description = (item.description || '').replace(/"/g, '""');
            const link = (item.link || '').replace(/"/g, '""');
            const reward = (item.reward || '').replace(/"/g, '""');
            const created = item.createdAt || '';
            
            csv += `"${item.type}","${title}","${description}","${link}","${parentTitle}","${item.completed || false}","${reward}","${created}"\n`;
            
            if (item.children) {
                item.children.forEach(child => addItemToCSV(child, title));
            }
        };
        
        this.tasks.forEach(task => addItemToCSV(task));
        
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadFile(blob, `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    }

    exportAsText() {
        let text = `Task Export - ${new Date().toLocaleDateString()}\n`;
        text += '='.repeat(50) + '\n\n';
        
        const addItemToText = (item, indent = 0) => {
            const prefix = '  '.repeat(indent);
            const status = item.completed ? '✓' : '○';
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
        this.downloadFile(blob, `tasks_export_${new Date().toISOString().split('T')[0]}.txt`);
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import functionality
    importFromText(text) {
        try {
            // Try JSON first
            const data = JSON.parse(text);
            if (data.tasks && Array.isArray(data.tasks)) {
                this.importFromJSON(data);
                return;
            }
        } catch (e) {
            // Not JSON, try other formats
        }

        // Try CSV
        if (text.includes('Type,Title,Description') || text.includes('"Type","Title","Description"')) {
            this.importFromCSV(text);
            return;
        }

        // Try structured text
        this.importFromStructuredText(text);
    }

    importFromJSON(data) {
        if (confirm('This will replace all current tasks. Continue?')) {
            this.tasks = data.tasks || [];
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
            }
            this.saveToStorage();
            this.render();
            this.closeImportModal();
            alert('Data imported successfully!');
        }
    }

    importFromCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').toLowerCase());
        
        if (!headers.includes('type') || !headers.includes('title')) {
            alert('CSV must have at least Type and Title columns');
            return;
        }

        if (confirm('This will replace all current tasks. Continue?')) {
            const tasks = [];
            const itemMap = new Map();

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length < headers.length) continue;

                const item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index] || '';
                });

                // Convert and clean up the item
                const cleanItem = {
                    id: this.generateId(),
                    type: item.type || 'task',
                    title: item.title || 'Untitled',
                    description: item.description || '',
                    link: item.link || '',
                    completed: item.completed === 'true' || item.completed === true,
                    createdAt: item.created || new Date().toISOString(),
                    children: []
                };

                if (cleanItem.type === 'task' && item.reward) {
                    cleanItem.reward = item.reward;
                }

                itemMap.set(cleanItem.title, cleanItem);

                // If no parent, add to root
                if (!item.parent || item.parent === '') {
                    tasks.push(cleanItem);
                } else {
                    // Add to parent later
                    cleanItem.parentTitle = item.parent;
                }
            }

            // Process parent relationships
            itemMap.forEach(item => {
                if (item.parentTitle) {
                    const parent = itemMap.get(item.parentTitle);
                    if (parent) {
                        parent.children.push(item);
                    } else {
                        tasks.push(item); // Orphaned item goes to root
                    }
                }
            });

            this.tasks = tasks;
            this.saveToStorage();
            this.render();
            this.closeImportModal();
            alert('CSV imported successfully!');
        }
    }

    importFromStructuredText(text) {
        if (confirm('This will replace all current tasks. Continue?')) {
            const lines = text.split('\n').filter(line => line.trim());
            const tasks = [];
            const stack = [{ children: tasks, level: -1 }];

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('=') || trimmed.includes('Task Export')) continue;

                // Skip lines that are clearly descriptions, rewards, or links (indented without status/icons)
                if (trimmed.startsWith('💰 Reward:') || trimmed.startsWith('🔗 Link:')) continue;
                
                // Only process lines that have status indicators (✓ or ○) and type icons
                if (!trimmed.match(/^[✓○]\s*[📁🎯📝]/)) continue;

                const level = (line.length - line.trimStart().length) / 2;
                const completed = trimmed.includes('✓');
                
                // Extract type icon and title
                let title = trimmed.replace(/^[✓○]\s*/, '').replace(/^[📁🎯📝]\s*/, '');
                let type = 'task';
                
                if (trimmed.includes('📁')) type = 'category';
                else if (trimmed.includes('📝')) type = 'step';

                const item = {
                    id: this.generateId(),
                    type,
                    title: title.trim(),
                    description: '',
                    completed,
                    createdAt: new Date().toISOString(),
                    children: []
                };

                // Find the correct parent based on indentation
                while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                    stack.pop();
                }

                stack[stack.length - 1].children.push(item);
                stack.push({ ...item, level });
            }

            this.tasks = tasks;
            this.saveToStorage();
            this.render();
            this.closeImportModal();
            alert('Text imported successfully!');
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    importFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            
            if (file.name.endsWith('.json')) {
                try {
                    const data = JSON.parse(content);
                    this.importFromJSON(data);
                } catch (error) {
                    alert('Invalid JSON file');
                }
            } else if (file.name.endsWith('.csv')) {
                this.importFromCSV(content);
            } else if (file.name.endsWith('.txt')) {
                this.importFromStructuredText(content);
            } else if (file.name.endsWith('.xlsx')) {
                alert('Excel files are not yet supported. Please convert to CSV first.');
            }
        };
        
        reader.readAsText(file);
    }

    // Import template from URL
    async importTemplate(templateFile) {
        const confirmMessage = `This will replace all your current tasks with the template. Your current data will be lost unless you export it first.\n\nDo you want to continue?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(templateFile);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Import the template data
            this.tasks = data.tasks || [];
            if (data.settings) {
                Object.assign(this.settings, data.settings);
                this.applySettings();
            }
            
            this.saveToStorage();
            this.render();
            this.closeSettings();
            
            // Show success message with template info
            const templateName = templateFile.includes('std_grid') ? 'Standard Grid Master Tasks' : 'My Grid Master Tasklist';
            alert(`✅ Template "${templateName}" imported successfully!\n\nYou can now customize these tasks to fit your needs.`);
            
        } catch (error) {
            console.error('Error importing template:', error);
            alert(`❌ Failed to import template: ${error.message}\n\nPlease try again or check your internet connection.`);
        }
    }

    // Welcome Modal Methods
    showWelcomeModal() {
        document.getElementById('welcome-modal').classList.remove('hidden');
    }

    closeWelcomeModal() {
        document.getElementById('welcome-modal').classList.add('hidden');
        // Mark that user has seen the welcome modal
        localStorage.setItem('task-manager-welcomed', 'true');
    }

    async importTemplateFromWelcome(templateFile) {
        try {
            const response = await fetch(templateFile);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Import the template data
            this.tasks = data.tasks || [];
            if (data.settings) {
                Object.assign(this.settings, data.settings);
                this.applySettings();
            }
            
            this.saveToStorage();
            this.render();
            this.closeWelcomeModal();
            
            // Show success message
            const templateName = templateFile.includes('std_grid') ? 'Standard Grid Master Tasks' : 'My Grid Master Tasklist';
            alert(`🎉 Welcome! Your "${templateName}" template has been loaded.\n\nYou can now start completing tasks and customize them to fit your needs!`);
            
        } catch (error) {
            console.error('Error importing template:', error);
            alert(`❌ Failed to load template: ${error.message}\n\nPlease try again or start from scratch.`);
        }
    }

    startFromScratch() {
        this.closeWelcomeModal();
        // Show a helpful message about getting started
        alert(`✨ Perfect! You're ready to create your own tasks.\n\nUse the buttons at the top to:\n• Add Category - for organizing tasks\n• Add Task - for main objectives with rewards\n• Add Step - for simple action items\n\nTip: Start with a category to group related tasks!`);
    }

    // Check if user should see welcome modal
    checkFirstTimeUser() {
        const hasSeenWelcome = localStorage.getItem('task-manager-welcomed');
        const hasTasks = this.tasks && this.tasks.length > 0;
        
        if (!hasSeenWelcome && !hasTasks) {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                this.showWelcomeModal();
            }, 500);
        }
    }

    // Event Binding
    bindEvents() {
        // Modal events
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.closeSettings());
        document.getElementById('add-category-btn').addEventListener('click', () => this.openModal('category'));
        document.getElementById('add-task-btn').addEventListener('click', () => this.openModal('task'));
        document.getElementById('add-step-btn').addEventListener('click', () => this.openModal('step'));
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());

        // Import/Export events
        document.getElementById('import-btn').addEventListener('click', () => this.openImportModal('import-file'));

        // Template import buttons
        document.getElementById('template-std-grid-btn').addEventListener('click', () => this.importTemplate('std_grid_master.json'));
        document.getElementById('template-my-grid-btn').addEventListener('click', () => this.importTemplate('my_grid_master.json'));

        // Welcome modal events
        document.getElementById('close-welcome').addEventListener('click', () => this.closeWelcomeModal());
        document.getElementById('welcome-template-std').addEventListener('click', () => this.importTemplateFromWelcome('std_grid_master.json'));
        document.getElementById('welcome-template-my').addEventListener('click', () => this.importTemplateFromWelcome('my_grid_master.json'));
        document.getElementById('welcome-create-own').addEventListener('click', () => this.startFromScratch());
        document.getElementById('close-import-modal').addEventListener('click', () => this.closeImportModal());
        
        // Export buttons in settings
        document.getElementById('export-json-btn').addEventListener('click', () => this.exportAsJSON());
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportAsCSV());
        document.getElementById('export-txt-btn').addEventListener('click', () => this.exportAsText());

        // Settings toggles
        document.getElementById('show-main-numbers').addEventListener('change', (e) => this.toggleMainNumbers(e.target.checked));
        document.getElementById('show-indent-numbers').addEventListener('change', (e) => this.toggleIndentNumbers(e.target.checked));
        document.getElementById('hide-completed-steps').addEventListener('change', (e) => this.toggleHideCompletedSteps(e.target.checked));
        document.getElementById('hide-completed-tasks').addEventListener('change', (e) => this.toggleHideCompletedTasks(e.target.checked));
        document.getElementById('hide-completed-categories').addEventListener('change', (e) => this.toggleHideCompletedCategories(e.target.checked));
        
        // Statistics control toggles
        document.getElementById('count-categories-progress').addEventListener('change', (e) => this.toggleCountCategoriesProgress(e.target.checked));
        document.getElementById('count-tasks-progress').addEventListener('change', (e) => this.toggleCountTasksProgress(e.target.checked));
        document.getElementById('count-steps-progress').addEventListener('change', (e) => this.toggleCountStepsProgress(e.target.checked));
        document.getElementById('show-categories-stats').addEventListener('change', (e) => this.toggleShowCategoriesStats(e.target.checked));
        document.getElementById('show-tasks-stats').addEventListener('change', (e) => this.toggleShowTasksStats(e.target.checked));
        document.getElementById('show-steps-stats').addEventListener('change', (e) => this.toggleShowStepsStats(e.target.checked));
        
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('task-form').addEventListener('submit', (e) => this.handleSubmit(e));

        // Image handling
        document.getElementById('image').addEventListener('change', (e) => this.handleImageSelect(e));
        document.getElementById('remove-image').addEventListener('click', () => this.removeImage());

        // Context menu
        document.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        document.addEventListener('click', () => this.hideContextMenu());

        // Context menu actions
        document.getElementById('edit-item').addEventListener('click', () => this.editItem());
        document.getElementById('delete-item').addEventListener('click', () => this.deleteItem());
        document.getElementById('add-substep').addEventListener('click', () => this.addSubStep());
        document.getElementById('toggle-complete').addEventListener('click', () => this.toggleComplete());
        document.getElementById('indent-item').addEventListener('click', () => this.indentItem());
        document.getElementById('outdent-item').addEventListener('click', () => this.outdentItem());

        // Close modal on outside click (with better detection)
        document.getElementById('modal').addEventListener('mousedown', (e) => {
            if (e.target.id === 'modal') {
                // Store the target when mouse is pressed down
                this.modalClickTarget = e.target;
            }
        });
        
        document.getElementById('modal').addEventListener('mouseup', (e) => {
            // Only close if both mousedown and mouseup happened on the modal backdrop
            if (e.target.id === 'modal' && this.modalClickTarget && this.modalClickTarget.id === 'modal') {
                this.closeModal();
            }
            this.modalClickTarget = null;
        });

        // Close settings modal on outside click
        document.getElementById('settings-modal').addEventListener('mousedown', (e) => {
            if (e.target.id === 'settings-modal') {
                this.settingsClickTarget = e.target;
            }
        });
        
        document.getElementById('settings-modal').addEventListener('mouseup', (e) => {
            if (e.target.id === 'settings-modal' && this.settingsClickTarget && this.settingsClickTarget.id === 'settings-modal') {
                this.closeSettings();
            }
            this.settingsClickTarget = null;
        });
    }

    // Modal Management
    openModal(type, item = null) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const rewardGroup = document.getElementById('reward-group');
        const form = document.getElementById('task-form');

        this.editingItem = item;
        
        if (type === 'task') {
            title.textContent = item ? 'Edit Task' : 'Add Task';
            rewardGroup.style.display = 'block';
        } else if (type === 'category') {
            title.textContent = item ? 'Edit Category' : 'Add Category';
            rewardGroup.style.display = 'none';
        } else {
            title.textContent = item ? 'Edit Step' : 'Add Step';
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
        document.getElementById('title').focus();
    }

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('task-form').reset();
        this.hideImagePreview();
        this.editingItem = null;
    }

    // Form Handling
    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const title = formData.get('title').trim();
        const description = formData.get('description').trim();
        const reward = formData.get('reward').trim();
        const link = formData.get('link').trim();
        
        if (!title) return;

        // Determine item type
        let itemType = 'step';
        if (reward) {
            itemType = 'task';
        } else if (document.getElementById('modal-title').textContent.includes('Category')) {
            itemType = 'category';
        }

        const itemData = {
            id: this.editingItem ? this.editingItem.id : this.generateId(),
            title,
            description,
            reward,
            link,
            completed: this.editingItem ? this.editingItem.completed : false,
            type: itemType,
            indentLevel: this.editingItem ? this.editingItem.indentLevel : 0,
            parentId: this.editingItem ? this.editingItem.parentId : null,
            image: this.editingItem ? this.editingItem.image : null,
            subItems: this.editingItem ? this.editingItem.subItems : [],
            collapsed: this.editingItem ? this.editingItem.collapsed : false,
            order: this.editingItem ? this.editingItem.order : this.tasks.length
        };

        // Handle image
        const previewImg = document.getElementById('preview-img');
        if (previewImg.src && previewImg.src !== window.location.href) {
            itemData.image = previewImg.src;
        } else if (!previewImg.src || previewImg.src === window.location.href) {
            // If no image or removed, set to null
            itemData.image = null;
        }

        if (this.editingItem) {
            this.updateItem(itemData);
        } else {
            this.addItem(itemData);
        }

        this.closeModal();
        this.saveToStorage();
        this.render();
    }

    // Image Handling
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
        const img = document.getElementById('preview-img');
        
        img.src = '';
        preview.classList.add('hidden');
    }

    removeImage() {
        this.hideImagePreview();
        document.getElementById('image').value = '';
        
        // If we're editing an item, remove the image from the item
        if (this.editingItem) {
            this.editingItem.image = null;
        }
    }

    // Item Management
    addItem(item) {
        this.tasks.push(item);
    }

    updateItem(updatedItem) {
        const index = this.tasks.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updatedItem };
        }
    }

    deleteItem() {
        if (this.currentItemId) {
            this.tasks = this.tasks.filter(item => item.id !== this.currentItemId);
            this.saveToStorage();
            this.render();
        }
        this.hideContextMenu();
    }

    editItem() {
        if (this.currentItemId) {
            const item = this.tasks.find(item => item.id === this.currentItemId);
            if (item) {
                this.openModal(item.type, item);
            }
        }
        this.hideContextMenu();
    }

    addSubStep() {
        if (this.currentItemId) {
            const parentItem = this.tasks.find(item => item.id === this.currentItemId);
            if (parentItem) {
                const subStep = {
                    id: this.generateId(),
                    title: 'New Sub-step',
                    description: '',
                    type: 'step',
                    completed: false,
                    parentId: this.currentItemId,
                    indentLevel: parentItem.indentLevel + 1,
                    order: this.tasks.length,
                    subItems: [],
                    collapsed: false
                };
                
                this.tasks.push(subStep);
                parentItem.subItems.push(subStep.id);
                this.saveToStorage();
                this.render();
            }
        }
        this.hideContextMenu();
    }

    toggleComplete() {
        if (this.currentItemId) {
            const item = this.tasks.find(item => item.id === this.currentItemId);
            if (item) {
                item.completed = !item.completed;
                this.saveToStorage();
                this.render();
            }
        }
        this.hideContextMenu();
    }

    indentItem() {
        if (this.currentItemId) {
            const item = this.tasks.find(item => item.id === this.currentItemId);
            if (item && item.indentLevel < 5) {
                // Find all children of this item
                const children = this.findAllChildren(item);
                
                // Indent the parent
                item.indentLevel++;
                
                // Indent all children maintaining their relative levels
                children.forEach(child => {
                    if (child.indentLevel < 5) {
                        child.indentLevel++;
                    }
                });
                
                this.saveToStorage();
                this.render();
            }
        }
        this.hideContextMenu();
    }

    outdentItem() {
        if (this.currentItemId) {
            const item = this.tasks.find(item => item.id === this.currentItemId);
            if (item && item.indentLevel > 0) {
                // Find all children of this item
                const children = this.findAllChildren(item);
                
                // Outdent the parent
                item.indentLevel--;
                
                // Outdent all children maintaining their relative levels
                children.forEach(child => {
                    if (child.indentLevel > 0) {
                        child.indentLevel--;
                    }
                });
                
                this.saveToStorage();
                this.render();
            }
        }
        this.hideContextMenu();
    }

    // Context Menu
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

    // Drag and Drop
    setupDragAndDrop(element, item) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            this.draggedItem = item;
            element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            this.startAutoScroll();
        });

        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
            this.draggedItem = null;
            this.hideDropIndicator();
            this.clearDropZones();
            this.stopAutoScroll();
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this.draggedItem && this.draggedItem.id !== item.id) {
                const rect = element.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                const dragY = e.clientY;
                
                // Determine drop position and indentation
                if (dragY < midY - 10) {
                    // Drop above
                    this.showDropIndicator(element, 'above', item.indentLevel);
                } else if (dragY > midY + 10) {
                    // Drop below
                    this.showDropIndicator(element, 'below', item.indentLevel);
                } else {
                    // Drop on (indent) - only if valid
                    if (this.canIndent(this.draggedItem, item)) {
                        this.showDropIndicator(element, 'on', item.indentLevel + 1);
                    } else {
                        this.showDropIndicator(element, 'below', item.indentLevel);
                    }
                }
            }
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.draggedItem && this.draggedItem.id !== item.id) {
                const rect = element.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                const dragY = e.clientY;
                
                let position, newIndentLevel;
                
                if (dragY < midY - 10) {
                    position = 'above';
                    newIndentLevel = item.indentLevel;
                } else if (dragY > midY + 10) {
                    position = 'below';
                    newIndentLevel = item.indentLevel;
                } else {
                    // Drop on (indent) - check if valid
                    if (this.canIndent(this.draggedItem, item)) {
                        position = 'on';
                        newIndentLevel = Math.min(item.indentLevel + 1, 5);
                    } else {
                        position = 'below';
                        newIndentLevel = item.indentLevel;
                    }
                }
                
                this.moveItemWithPosition(this.draggedItem, item, position, newIndentLevel);
                this.saveToStorage();
                this.render();
            }
        });
    }

    showDropIndicator(element, position, indentLevel) {
        this.hideDropIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.id = 'active-drop-indicator';
        
        // Add indentation to the indicator
        if (indentLevel > 0) {
            indicator.style.marginLeft = (indentLevel * 30) + 'px';
        }
        
        if (position === 'above') {
            element.parentNode.insertBefore(indicator, element);
        } else if (position === 'below') {
            element.parentNode.insertBefore(indicator, element.nextSibling);
        } else if (position === 'on') {
            indicator.classList.add('indent-indicator');
            indicator.style.background = '#28a745';
            indicator.textContent = `Drop to indent under "${element.querySelector('.item-title span:last-child').textContent}"`;
            indicator.style.textAlign = 'center';
            indicator.style.padding = '5px';
            indicator.style.fontSize = '0.8rem';
            indicator.style.color = 'white';
            element.parentNode.insertBefore(indicator, element.nextSibling);
        }
    }

    hideDropIndicator() {
        const indicator = document.getElementById('active-drop-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    clearDropZones() {
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => zone.remove());
    }

    // Auto-scroll functionality for drag and drop
    startAutoScroll() {
        this.autoScrollInterval = setInterval(() => {
            if (this.draggedItem && this.currentMouseY) {
                this.handleAutoScroll(this.currentMouseY);
            }
        }, 16); // ~60fps
        
        // Enable scroll wheel during drag
        document.addEventListener('wheel', this.handleDragScroll, { passive: false });
        
        // Track mouse position for auto-scroll
        document.addEventListener('dragover', this.trackMousePosition);
    }
    
    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
        
        // Remove scroll wheel listener
        document.removeEventListener('wheel', this.handleDragScroll);
        document.removeEventListener('dragover', this.trackMousePosition);
        this.currentMouseY = null;
    }
    
    trackMousePosition = (e) => {
        this.currentMouseY = e.clientY;
    }
    
    handleDragScroll = (e) => {
        if (this.draggedItem) {
            e.preventDefault();
            window.scrollBy(0, e.deltaY * 0.5); // Smooth scroll with reduced speed
        }
    }
    
    handleAutoScroll(mouseY) {
        const scrollThreshold = 100; // Distance from edge to start scrolling
        const scrollSpeed = 10;
        const fixedHeaderHeight = 100; // Account for fixed header
        
        const viewportHeight = window.innerHeight;
        const effectiveTop = fixedHeaderHeight;
        const effectiveBottom = viewportHeight - 50;
        
        // Scroll up if mouse is near top (accounting for fixed header)
        if (mouseY < effectiveTop + scrollThreshold) {
            const intensity = Math.max(0, (effectiveTop + scrollThreshold - mouseY) / scrollThreshold);
            window.scrollBy(0, -scrollSpeed * intensity);
        }
        // Scroll down if mouse is near bottom
        else if (mouseY > effectiveBottom - scrollThreshold) {
            const intensity = Math.max(0, (mouseY - (effectiveBottom - scrollThreshold)) / scrollThreshold);
            window.scrollBy(0, scrollSpeed * intensity);
        }
    }

    // Helper method to find all children of an item (recursive)
    findAllChildren(parentItem) {
        const children = [];
        const parentIndex = this.tasks.findIndex(item => item.id === parentItem.id);
        
        // Look for items that come after this parent and have higher indent level
        for (let i = parentIndex + 1; i < this.tasks.length; i++) {
            const currentItem = this.tasks[i];
            
            // If we hit an item at the same or lower level as parent, stop
            // This means we've reached a sibling or higher-level item
            if (currentItem.indentLevel <= parentItem.indentLevel) {
                break;
            }
            
            // This is a child or descendant of the parent
            children.push(currentItem);
        }
        
        return children;
    }

    moveItemWithPosition(draggedItem, targetItem, position, newIndentLevel) {
        // Store original array state for debugging
        const originalTasks = [...this.tasks];
        
        // Find all children of the dragged item BEFORE any modifications
        const children = this.findAllChildren(draggedItem);
        const indentDifference = newIndentLevel - draggedItem.indentLevel;
        
        // Create list of items to move (parent + children)
        const itemsToMove = [draggedItem, ...children];
        const itemIdsToMove = new Set(itemsToMove.map(item => item.id));
        
        // Find target index BEFORE removing items
        const originalTargetIndex = this.tasks.findIndex(item => item.id === targetItem.id);
        
        // Remove dragged item and all its children from their current positions
        this.tasks = this.tasks.filter(item => !itemIdsToMove.has(item.id));
        
        // Update the dragged item's indent level
        draggedItem.indentLevel = newIndentLevel;
        
        // Update children's indent levels to maintain relative hierarchy
        children.forEach(child => {
            child.indentLevel = Math.max(0, Math.min(5, child.indentLevel + indentDifference));
        });
        
        // Calculate insertion index based on target position
        let insertIndex;
        const newTargetIndex = this.tasks.findIndex(item => item.id === targetItem.id);
        
        if (position === 'above') {
            insertIndex = newTargetIndex;
        } else if (position === 'below') {
            // When dropping below, we need to insert after the target AND all its children
            const targetChildren = this.findAllChildren(targetItem);
            insertIndex = newTargetIndex + 1 + targetChildren.length;
        } else if (position === 'on') {
            // When dropping on (indenting), insert right after the target
            insertIndex = newTargetIndex + 1;
        }
        
        // Insert parent first, then children in original order
        this.tasks.splice(insertIndex, 0, ...itemsToMove);
        
        // Update orders
        this.tasks.forEach((item, index) => {
            item.order = index;
        });
    }

    // Rendering
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
        
        // Sort tasks by order
        const sortedTasks = [...this.tasks].sort((a, b) => a.order - b.order);
        
        // Create numbering system for all items
        const itemsHTML = this.createNumberedItemsHTML(sortedTasks);
        
        taskList.innerHTML = `<div class="top-drop-zone" id="top-drop-zone"></div>${itemsHTML}`;
        
        // Setup drag and drop for all items
        const visibleTasks = this.getVisibleTasks(sortedTasks);
        visibleTasks.forEach(item => {
            const element = document.querySelector(`[data-id="${item.id}"]`);
            if (element) {
                this.setupDragAndDrop(element, item);
                this.setupItemEvents(element, item);
                this.setupImageClick(element, item);
                this.setupCollapseButton(element, item);
            }
        });
        
        // Setup top drop zone
        this.setupTopDropZone();
        
        // Update number visibility
        this.updateNumberVisibility();
        
        // Update statistics
        this.updateStatistics();
    }

    updateStatistics() {
        // Count all items recursively
        const stats = {
            categories: { total: 0, completed: 0 },
            tasks: { total: 0, completed: 0 },
            steps: { total: 0, completed: 0 },
            progress: { total: 0, completed: 0 }
        };

        const countItems = (items) => {
            items.forEach(item => {
                // Count each type
                if (item.type === 'category') {
                    stats.categories.total++;
                    if (item.completed) {
                        stats.categories.completed++;
                    }
                    
                    // Add to progress if enabled
                    if (this.countCategoriesProgress) {
                        stats.progress.total++;
                        if (item.completed) {
                            stats.progress.completed++;
                        }
                    }
                } else if (item.type === 'task') {
                    stats.tasks.total++;
                    if (item.completed) {
                        stats.tasks.completed++;
                    }
                    
                    // Add to progress if enabled
                    if (this.countTasksProgress) {
                        stats.progress.total++;
                        if (item.completed) {
                            stats.progress.completed++;
                        }
                    }
                } else if (item.type === 'step') {
                    stats.steps.total++;
                    if (item.completed) {
                        stats.steps.completed++;
                    }
                    
                    // Add to progress if enabled
                    if (this.countStepsProgress) {
                        stats.progress.total++;
                        if (item.completed) {
                            stats.progress.completed++;
                        }
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

        // Update statistics bar visibility and content
        const categoriesItem = categoriesCount?.closest('.stat-item');
        const tasksItem = tasksCount?.closest('.stat-item');
        const stepsItem = stepsCount?.closest('.stat-item');

        // Show/hide and update categories
        if (categoriesItem) {
            categoriesItem.style.display = this.showCategoriesStats ? 'flex' : 'none';
        }
        if (categoriesCount) categoriesCount.textContent = `${stats.categories.completed}/${stats.categories.total}`;

        // Show/hide and update tasks
        if (tasksItem) {
            tasksItem.style.display = this.showTasksStats ? 'flex' : 'none';
        }
        if (tasksCount) tasksCount.textContent = `${stats.tasks.completed}/${stats.tasks.total}`;

        // Show/hide and update steps
        if (stepsItem) {
            stepsItem.style.display = this.showStepsStats ? 'flex' : 'none';
        }
        if (stepsCount) stepsCount.textContent = `${stats.steps.completed}/${stats.steps.total}`;

        // Update total (based on progress calculation)
        if (totalCount) totalCount.textContent = `${stats.progress.completed}/${stats.progress.total}`;

        // Calculate and update progress bar
        const progressPercent = stats.progress.total > 0 ? Math.round((stats.progress.completed / stats.progress.total) * 100) : 0;
        
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

    createItemHTML(item, number) {
        const isTask = item.type === 'task';
        const isCategory = item.type === 'category';
        const isStep = item.type === 'step';
        
        let className = 'step-item';
        if (isTask) className = 'task-item';
        if (isCategory) className = 'category-item';
        
        const completedClass = item.completed ? 'completed' : '';
        const indentClass = item.indentLevel > 0 ? `indent-${item.indentLevel}` : '';
        
        // Show number based on item level and settings
        const isMainLevel = item.indentLevel === 0;
        const showNumber = number !== undefined && 
                          ((isMainLevel && this.showMainNumbers) || 
                           (!isMainLevel && this.showIndentNumbers));

        // Check if this item has child items (any type can have children)
        const hasChildren = this.hasChildItems(item);
        const isCollapsed = item.collapsed || false;
        
        return `
            <div class="item-wrapper ${indentClass}">
                ${showNumber ? `<div class="item-number">${number}</div>` : ''}
                <div class="${className} ${completedClass}" data-id="${item.id}">
                    <div class="item-header">
                        <div class="item-title${item.link ? ' has-link' : ''}" ${item.link ? `onclick="window.open('${item.link}', '_blank')"` : ''}>
                            ${hasChildren ? 
                                `<button class="collapse-btn ${isCollapsed ? 'collapsed' : ''}" data-item-id="${item.id}">▼</button>` : 
                                ''
                            }
                            <span class="status-indicator ${item.completed ? 'status-completed' : 'status-pending'}"></span>
                            ${item.title}
                        </div>
                        <div class="item-type-badge">
                            ${isCategory ? `📁 Category` : isTask ? `🎯 Task` : `📝 Step`}
                        </div>
                        <div class="item-controls">
                            <button class="control-btn complete-btn" title="Toggle Complete">
                                ${item.completed ? '↶' : '✓'}
                            </button>
                            <button class="control-btn edit-btn" title="Edit">✎</button>
                            <button class="control-btn delete-btn" title="Delete">🗑</button>
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
                    
                    ${item.subItems && item.subItems.length > 0 ? `
                        <div class="sub-items ${item.collapsed ? 'hidden' : ''}">
                            ${item.subItems.map(subId => {
                                const subItem = this.tasks.find(t => t.id === subId);
                                return subItem ? this.createItemHTML(subItem) : '';
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupItemEvents(element, item) {
        // Complete button
        const completeBtn = element.querySelector('.complete-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                item.completed = !item.completed;
                
                // Check if hiding is active - if so, do full render to apply hiding logic
                const isHidingActive = this.hideCompletedSteps || this.hideCompletedTasks || this.hideCompletedCategories;
                if (isHidingActive) {
                    this.saveToStorage();
                    this.render();
                } else {
                    // No hiding active, just update this item visually to prevent flashing
                    this.updateItemCompletion(element, item);
                    this.saveToStorage();
                    // Update statistics after completion toggle
                    this.updateStatistics();
                }
            });
        }

        // Edit button
        const editBtn = element.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(item.type, item);
            });
        }

        // Delete button
        const deleteBtn = element.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this item?')) {
                    this.tasks = this.tasks.filter(t => t.id !== item.id);
                    this.saveToStorage();
                    this.render();
                }
            });
        }


    }

    // Storage Management
    saveToStorage() {
        try {
            const data = {
                tasks: this.tasks,
                settings: {
                    showMainNumbers: this.showMainNumbers,
                    showIndentNumbers: this.showIndentNumbers,
                    hideCompletedSteps: this.hideCompletedSteps,
                    hideCompletedTasks: this.hideCompletedTasks,
                    hideCompletedCategories: this.hideCompletedCategories,
                    countCategoriesProgress: this.countCategoriesProgress,
                    countTasksProgress: this.countTasksProgress,
                    countStepsProgress: this.countStepsProgress,
                    showCategoriesStats: this.showCategoriesStats,
                    showTasksStats: this.showTasksStats,
                    showStepsStats: this.showStepsStats
                }
            };
            localStorage.setItem('taskManagerData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('taskManagerData');
            if (data) {
                const parsed = JSON.parse(data);
                
                // Support old format (just tasks array) and new format (object with tasks and settings)
                if (Array.isArray(parsed)) {
                    this.tasks = parsed;
                } else {
                    this.tasks = parsed.tasks || [];
                    if (parsed.settings) {
                        this.showMainNumbers = parsed.settings.showMainNumbers !== undefined ? parsed.settings.showMainNumbers : true;
                        this.showIndentNumbers = parsed.settings.showIndentNumbers !== undefined ? parsed.settings.showIndentNumbers : true;
                        this.hideCompletedSteps = parsed.settings.hideCompletedSteps || false;
                        this.hideCompletedTasks = parsed.settings.hideCompletedTasks || false;
                        this.hideCompletedCategories = parsed.settings.hideCompletedCategories || false;
                        
                        // Statistics control settings
                        this.countCategoriesProgress = parsed.settings.countCategoriesProgress !== undefined ? parsed.settings.countCategoriesProgress : true;
                        this.countTasksProgress = parsed.settings.countTasksProgress !== undefined ? parsed.settings.countTasksProgress : true;
                        this.countStepsProgress = parsed.settings.countStepsProgress !== undefined ? parsed.settings.countStepsProgress : true;
                        this.showCategoriesStats = parsed.settings.showCategoriesStats !== undefined ? parsed.settings.showCategoriesStats : true;
                        this.showTasksStats = parsed.settings.showTasksStats !== undefined ? parsed.settings.showTasksStats : true;
                        this.showStepsStats = parsed.settings.showStepsStats !== undefined ? parsed.settings.showStepsStats : true;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.tasks = [];
        }
    }

    // Indentation Rules
    canIndent(draggedItem, targetItem) {
        if (!draggedItem || !targetItem) return false;
        
        // Steps can only be indented under tasks or categories, not other steps
        if (draggedItem.type === 'step' && targetItem.type === 'step') {
            return false;
        }
        
        // All other combinations are allowed
        return true;
    }

    // Top Drop Zone
    setupTopDropZone() {
        const topDropZone = document.getElementById('top-drop-zone');
        if (!topDropZone) return;
        
        topDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this.draggedItem) {
                topDropZone.classList.add('active');
            }
        });
        
        topDropZone.addEventListener('dragleave', (e) => {
            topDropZone.classList.remove('active');
        });
        
        topDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            topDropZone.classList.remove('active');
            
            if (this.draggedItem) {
                this.moveToTop(this.draggedItem);
                this.saveToStorage();
                this.render();
            }
        });
    }
    
    moveToTop(item) {
        // Remove item from current position
        this.tasks = this.tasks.filter(task => task.id !== item.id);
        
        // Reset indent level to 0 when moving to top
        item.indentLevel = 0;
        
        // Insert at the beginning
        this.tasks.unshift(item);
        
        // Update orders
        this.tasks.forEach((task, index) => {
            task.order = index;
        });
    }

    // Image Click Handler
    setupImageClick(element, item) {
        const imageElement = element.querySelector('.item-image img');
        if (imageElement && item.image) {
            imageElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showImageModal(item.image);
            });
        }
    }

    showImageModal(imageSrc) {
        // Create image modal
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <button class="image-modal-close">&times;</button>
                <img src="${imageSrc}" alt="Full size image" />
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        const closeBtn = modal.querySelector('.image-modal-close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Better click outside detection for image modal
        let imageModalClickTarget;
        modal.addEventListener('mousedown', (e) => {
            if (e.target === modal) {
                imageModalClickTarget = e.target;
            }
        });
        
        modal.addEventListener('mouseup', (e) => {
            if (e.target === modal && imageModalClickTarget === modal) {
                document.body.removeChild(modal);
            }
            imageModalClickTarget = null;
        });
        
        // ESC key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // Settings Management
    openSettings() {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('hidden');
        
        // Update toggle states
        document.getElementById('show-main-numbers').checked = this.showMainNumbers;
        document.getElementById('show-indent-numbers').checked = this.showIndentNumbers;
        document.getElementById('hide-completed-steps').checked = this.hideCompletedSteps;
        document.getElementById('hide-completed-tasks').checked = this.hideCompletedTasks;
        document.getElementById('hide-completed-categories').checked = this.hideCompletedCategories;
        
        // Update statistics control toggle states
        document.getElementById('count-categories-progress').checked = this.countCategoriesProgress;
        document.getElementById('count-tasks-progress').checked = this.countTasksProgress;
        document.getElementById('count-steps-progress').checked = this.countStepsProgress;
        document.getElementById('show-categories-stats').checked = this.showCategoriesStats;
        document.getElementById('show-tasks-stats').checked = this.showTasksStats;
        document.getElementById('show-steps-stats').checked = this.showStepsStats;
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    openImportModal(activeTab = 'export') {
        const modal = document.getElementById('import-modal');
        modal.classList.remove('hidden');
        
        // Switch to the specified tab
        this.switchImportTab(activeTab);
        
        // Setup import/export event handlers
        this.setupImportExportHandlers();
    }

    closeImportModal() {
        document.getElementById('import-modal').classList.add('hidden');
        
        // Clear any file inputs or text areas
        // document.getElementById('import-text-area').value = ''; // DISABLED - text import disabled
        document.getElementById('file-input').value = '';
        document.getElementById('file-info').style.display = 'none';
    }

    switchImportTab(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Activate the selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    setupImportExportHandlers() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.removeEventListener('click', this.handleTabClick);
            btn.addEventListener('click', this.handleTabClick.bind(this));
        });

        // Export buttons are handled in main bindEvents since they're in settings now

        // Import text controls - DISABLED
        /*
        document.getElementById('import-text-btn').removeEventListener('click', this.handleTextImport);
        document.getElementById('clear-text-btn').removeEventListener('click', this.clearTextArea);
        
        document.getElementById('import-text-btn').addEventListener('click', () => this.handleTextImport());
        document.getElementById('clear-text-btn').addEventListener('click', () => this.clearTextArea());
        */

        // File upload controls
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('file-input');
        
        // Store bound function to ensure proper removal
        if (!this.boundHandleFileAreaClick) {
            this.boundHandleFileAreaClick = () => fileInput.click();
        }
        
        fileUploadArea.removeEventListener('click', this.boundHandleFileAreaClick);
        fileUploadArea.addEventListener('click', this.boundHandleFileAreaClick);
        
        // Store bound function to ensure proper removal
        if (!this.boundHandleFileSelect) {
            this.boundHandleFileSelect = (e) => this.handleFileSelect(e);
        }
        
        fileInput.removeEventListener('change', this.boundHandleFileSelect);
        fileInput.addEventListener('change', this.boundHandleFileSelect);
        
        // Drag and drop - Store bound functions to ensure proper removal
        if (!this.boundHandleDragOver) {
            this.boundHandleDragOver = (e) => this.handleDragOver(e);
            this.boundHandleDragLeave = (e) => this.handleDragLeave(e);
            this.boundHandleFileDrop = (e) => this.handleFileDrop(e);
        }
        
        fileUploadArea.removeEventListener('dragover', this.boundHandleDragOver);
        fileUploadArea.removeEventListener('dragleave', this.boundHandleDragLeave);
        fileUploadArea.removeEventListener('drop', this.boundHandleFileDrop);
        
        fileUploadArea.addEventListener('dragover', this.boundHandleDragOver);
        fileUploadArea.addEventListener('dragleave', this.boundHandleDragLeave);
        fileUploadArea.addEventListener('drop', this.boundHandleFileDrop);

        // File import controls
        const importFileBtn = document.getElementById('import-file-btn');
        const clearFileBtn = document.getElementById('clear-file-btn');
        
        // Store bound functions to ensure proper removal
        if (!this.boundHandleFileImport) {
            this.boundHandleFileImport = () => this.handleFileImport();
        }
        if (!this.boundClearFile) {
            this.boundClearFile = () => this.clearFile();
        }
        
        importFileBtn.removeEventListener('click', this.boundHandleFileImport);
        clearFileBtn.removeEventListener('click', this.boundClearFile);
        
        importFileBtn.addEventListener('click', this.boundHandleFileImport);
        clearFileBtn.addEventListener('click', this.boundClearFile);
    }

    handleTabClick(e) {
        const tabName = e.target.getAttribute('data-tab');
        this.switchImportTab(tabName);
    }

    // Text import methods - DISABLED
    /*
    handleTextImport() {
        const text = document.getElementById('import-text-area').value.trim();
        if (!text) {
            alert('Please paste some data to import');
            return;
        }
        this.importFromText(text);
    }

    clearTextArea() {
        document.getElementById('import-text-area').value = '';
    }
    */

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.showFileInfo(file);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.file-upload-area').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.file-upload-area').classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = e.target.closest('.file-upload-area');
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.showFileInfo(files[0]);
            document.getElementById('file-input').files = files;
        }
    }

    showFileInfo(file) {
        document.getElementById('file-name').textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        document.getElementById('file-info').style.display = 'block';
        this.selectedFile = file;
    }

    handleFileImport() {
        if (this.selectedFile) {
            this.importFromFile(this.selectedFile);
        } else {
            alert('Please select a file first');
        }
    }

    clearFile() {
        document.getElementById('file-input').value = '';
        document.getElementById('file-info').style.display = 'none';
        this.selectedFile = null;
    }

    toggleMainNumbers(show) {
        this.showMainNumbers = show;
        this.updateNumberVisibility();
        this.render();
    }

    toggleIndentNumbers(show) {
        this.showIndentNumbers = show;
        this.updateNumberVisibility();
        this.render();
    }

    toggleHideCompletedSteps(hide) {
        this.hideCompletedSteps = hide;
        this.saveToStorage();
        this.render();
    }

    toggleHideCompletedTasks(hide) {
        this.hideCompletedTasks = hide;
        this.saveToStorage();
        this.render();
    }

    toggleHideCompletedCategories(hide) {
        this.hideCompletedCategories = hide;
        this.saveToStorage();
        this.render();
    }

    // Statistics control toggle methods
    toggleCountCategoriesProgress(count) {
        this.countCategoriesProgress = count;
        this.saveToStorage();
        this.updateStatistics();
    }

    toggleCountTasksProgress(count) {
        this.countTasksProgress = count;
        this.saveToStorage();
        this.updateStatistics();
    }

    toggleCountStepsProgress(count) {
        this.countStepsProgress = count;
        this.saveToStorage();
        this.updateStatistics();
    }

    toggleShowCategoriesStats(show) {
        this.showCategoriesStats = show;
        this.saveToStorage();
        this.updateStatistics();
    }

    toggleShowTasksStats(show) {
        this.showTasksStats = show;
        this.saveToStorage();
        this.updateStatistics();
    }

    toggleShowStepsStats(show) {
        this.showStepsStats = show;
        this.saveToStorage();
        this.updateStatistics();
    }

    // Check if item and all its children are completed
    isFullyCompleted(item) {
        if (!item.completed) {
            return false;
        }
        
        // If item has children, check all children recursively
        if (item.children && item.children.length > 0) {
            return item.children.every(child => this.isFullyCompleted(child));
        }
        
        return true;
    }

    // Check if item should be hidden based on completion and settings
    shouldHideItem(item) {
        // Only hide if the item type's hiding is enabled
        const hideBasedOnType = 
            (item.type === 'step' && this.hideCompletedSteps) ||
            (item.type === 'task' && this.hideCompletedTasks) ||
            (item.type === 'category' && this.hideCompletedCategories);
        
        if (!hideBasedOnType) {
            return false;
        }
        
        // Only hide if fully completed (item and all children)
        return this.isFullyCompleted(item);
    }

    updateNumberVisibility() {
        const container = document.querySelector('.task-list-container');
        
        // Remove existing classes
        container.classList.remove('hide-main-numbers', 'hide-indent-numbers');
        
        // Add appropriate classes
        if (!this.showMainNumbers) {
            container.classList.add('hide-main-numbers');
        }
        if (!this.showIndentNumbers) {
            container.classList.add('hide-indent-numbers');
        }
    }

    // Create numbered items HTML
    createNumberedItemsHTML(sortedTasks) {
        const counters = {}; // Track counters for each indent level
        const visibleTasks = this.getVisibleTasks(sortedTasks);
        
        return visibleTasks.map((item) => {
            // Initialize counter for this indent level if not exists
            if (counters[item.indentLevel] === undefined) {
                counters[item.indentLevel] = 0;
            }
            
            // Reset deeper level counters when we encounter a higher level
            Object.keys(counters).forEach(level => {
                if (parseInt(level) > item.indentLevel) {
                    counters[level] = 0;
                }
            });
            
            // Increment counter for current level
            counters[item.indentLevel]++;
            
            return this.createItemHTML(item, counters[item.indentLevel]);
        }).join('');
    }

    // Get visible tasks (excluding items hidden by collapsed categories)
    getVisibleTasks(sortedTasks) {
        const visible = [];
        let hideUntilLevel = null;
        let hideCompletedUntilLevel = null;
        
        for (const item of sortedTasks) {
            // If we're hiding items and this item is still at a deeper level, skip it
            if (hideUntilLevel !== null && item.indentLevel > hideUntilLevel) {
                continue;
            }
            
            // If we're hiding completed items and this item is still at a deeper level, skip it
            if (hideCompletedUntilLevel !== null && item.indentLevel > hideCompletedUntilLevel) {
                continue;
            }
            
            // Reset hiding when we reach the same or higher level
            if (hideUntilLevel !== null && item.indentLevel <= hideUntilLevel) {
                hideUntilLevel = null;
            }
            
            // Reset completion hiding when we reach the same or higher level
            if (hideCompletedUntilLevel !== null && item.indentLevel <= hideCompletedUntilLevel) {
                hideCompletedUntilLevel = null;
            }
            
            // Check if this item should be hidden due to completion
            if (this.shouldHideItem(item)) {
                // If this item has children, we need to hide all children too
                if (this.hasChildItems(item)) {
                    hideCompletedUntilLevel = item.indentLevel;
                }
                continue; // Skip adding this item to visible list
            }
            
            // Add this item to visible list
            visible.push(item);
            
            // If this is a collapsed item with children, start hiding subsequent deeper items
            if (item.collapsed && this.hasChildItems(item)) {
                hideUntilLevel = item.indentLevel;
            }
        }
        
        return visible;
    }

    // Check if an item has child items
    hasChildItems(item) {
        const itemIndex = this.tasks.findIndex(task => task.id === item.id);
        if (itemIndex === -1) return false;
        
        // Look for items that come after this item and have higher indent level
        for (let i = itemIndex + 1; i < this.tasks.length; i++) {
            const nextItem = this.tasks[i];
            
            // If we find an item at the same or lower level, stop looking
            if (nextItem.indentLevel <= item.indentLevel) {
                break;
            }
            
            // If we find an item at a higher level, this item has children
            if (nextItem.indentLevel > item.indentLevel) {
                return true;
            }
        }
        
        return false;
    }

    // Collapse Button Setup
    setupCollapseButton(element, item) {
        const collapseBtn = element.querySelector('.collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleItemCollapse(item.id);
            });
        }
    }

    // Toggle item collapse state
    toggleItemCollapse(itemId) {
        const item = this.tasks.find(task => task.id === itemId);
        if (item) {
            item.collapsed = !item.collapsed;
            this.saveToStorage();
            this.render();
        }
    }

    // Update item completion without full re-render
    updateItemCompletion(element, item) {
        const wrapper = element.closest('.item-wrapper');
        const statusIndicator = element.querySelector('.status-indicator');
        const completeBtn = element.querySelector('.complete-btn');
        const titleElement = element.querySelector('.item-title');
        
        if (item.completed) {
            // Mark as completed
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
            // Mark as incomplete
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

    // Utility Functions
    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});