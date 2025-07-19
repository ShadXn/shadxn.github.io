// idlegame.js — main entry point (no modules)
(function () {
    if (localStorage.getItem("resetting") === "true") {
        localStorage.removeItem("resetting");
        localStorage.removeItem("idle_gold");
        localStorage.removeItem("idle_resources");
        localStorage.removeItem("idle_workers");
        localStorage.removeItem("idle_assignments");
    }

    let gameData = {}, jobs = {}, tasks = [], gearData = {}, toolData = {};
    let goldDisplay, workerDisplay, idleDisplay, costDisplay, buyBtn, taskList, workerCost;

    const allItemKeys = new Set();
    const lastState = {
        gold: null,
        workers: null,
        idle: null,
        assignments: {},
    };


    fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
        gameData = data;
        window.gameData = data;
        jobs = gameData.jobs;
        gearData = gameData.gear || {};
        toolData = gameData.tools || {};
        miscData = gameData.miscellaneous || {};
        window.GearParts = gameData.gear_parts || [];
        window.ToolParts = gameData.tools_parts || [];

        Object.keys(data.resources).forEach(k => allItemKeys.add(k));
        for (const tier in data.tools) for (const part in data.tools[tier]) allItemKeys.add(`${tier}_${part}`);
        for (const tier in data.gear) for (const part in data.gear[tier]) allItemKeys.add(`${tier}_${part}`);
        for (const key in data.miscellaneous) {allItemKeys.add(key);}

        const recipeData = data.recipes || {};
        const tierOrder = ["bronze", "iron", "steel", "black", "mithril", "adamant", "rune", "dragon", "god", "victory"];
        tierOrder.forEach(tier => { if (recipeData[tier]) allItemKeys.add(`recipe_${tier}`); });

        tasks = Object.keys(jobs).map(key => ({ id: key, name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), rate: jobs[key].gp_reward || 0 }));
        initializeGame();
    })
    .catch(error => console.error('Error loading game data:', error));

    function initializeGame() {
        // watchdog for bad resource keys
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
        if (key === "idle_resources") {
            try {
            const parsed = JSON.parse(value);
            const badKeys = Object.keys(parsed).filter(k => /^[0-9]+$/.test(k));
            if (badKeys.length > 0) {
                console.warn("⚠️ BAD RESOURCE KEYS DETECTED:", badKeys);
                console.trace(); // Show where it happened
            }
            } catch (e) {
            console.error("Failed to parse idle_resources:", e);
            }
        }
        return originalSetItem.apply(this, arguments);
        };



        GameState.loadProgress();  // This handles loading all state
        
        // Remove any items that were removed from gameData
        cleanupRemovedItems(gameData);
        // Resync GameState.resources after cleaning localStorage
        GameState.resources = JSON.parse(localStorage.getItem("idle_resources") || "{}");

        // Initialize resources if not already set
        tasks.forEach(task => {
        if (!(task.id in GameState.assignments)) GameState.assignments[task.id] = 0;
        });

        workerCost = 10 * Math.pow(2, GameState.workers);

        goldDisplay = document.getElementById('gold-count');
        workerDisplay = document.getElementById('worker-count');
        idleDisplay = document.getElementById('idle-count');
        costDisplay = document.getElementById('worker-cost');
        buyBtn = document.getElementById('buy-worker');
        taskList = document.getElementById('task-list');

        buyBtn.addEventListener('click', () => {
            if (GameState.resources.gold >= workerCost) {
                GameState.resources.gold -= workerCost;
                GameState.workers++;
                workerCost = 10 * Math.pow(2, GameState.workers);
                updateUI();
                GameState.saveProgress();
            }
        });

        prebuildItemDisplay(allItemKeys, {
            default: document.getElementById("resource-display"),
            gear: document.getElementById("gear-display"),
            tool: document.getElementById("tool-display"),
            recipe: document.getElementById("recipe-display"),
            misc: document.getElementById("misc-display")
        });


        CraftingUI.showCraftingSection(buildCraftables(gearData, toolData, miscData), GameState.resources, GameState.toolsInUse);
        renderSidebarContent();
        populateJobs(jobs);
        setInterval(() => {
            applyJobTick(GameState.assignments, tasks, jobs, GameState.resources, GameState.toolsInUse);
            updateResourceDisplay(GameState.resources, GameState.toolsInUse); // Refresh UI
            updateUI(); // Update all displays
            GameState.saveProgress(); // Save updated resources + assignments
        }, 1000);

        const urlParams = new URLSearchParams(window.location.search);
        const debugOverride = urlParams.get("debug") === "1";

        const DEBUG_MODE = debugOverride || (window.location.hostname === "127.0.0.1");
        
        // check window.location.hostname for dev panel
        console.log("Current hostname:", window.location.hostname);

        // Only insert dev panel if dev mode
        if (DEBUG_MODE) {
            // Insert dev panel HTML
            const panel = document.createElement("div");
            panel.id = "dev-panel";
            panel.style = `
                display: none;
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: #fff;
                border: 1px solid #ccc;
                padding: 10px;
                z-index: 9999;
                font-size: 14px;
                font-family: sans-serif;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                border-radius: 6px;
            `;

            panel.innerHTML = `
                <h4 style="margin:0 0 6px;">🧪 Dev Panel</h4>
                <input id="dev-item-key" placeholder="item_key (e.g., logs)" style="margin-bottom:4px; width:140px;"><br>
                <input id="dev-item-amount" type="number" value="1" style="width:80px; margin-right:6px;">
                <button onclick="addItem()">➕ Add</button>
                <button onclick="removeItem()">➖ Remove</button>
                <button onclick="document.getElementById('dev-panel').style.display='none'">❌ Close</button>
            `;

            document.body.appendChild(panel);

            // Tilde (~) toggles dev panel
            document.addEventListener("keydown", (e) => {
                if (e.key === "æ") {
                const devPanel = document.getElementById("dev-panel");
                if (devPanel) {
                    devPanel.style.display = devPanel.style.display === "none" ? "block" : "none";
                }
                }
            });
        }
    }

    // GameState object to manage game state

    GameState.getIdleWorkers = function () {
    return GameState.workers - Object.values(GameState.assignments).reduce((a, b) => a + b, 0);
    };

    function updateUI() {
        const currentGold = GameState.resources.gold;
        const currentWorkers = GameState.workers;
        const currentIdle = GameState.getIdleWorkers();
        const totalJobEl = document.getElementById("total-job-count");

        if (currentGold !== lastState.gold) {
            goldDisplay.textContent = currentGold;
            buyBtn.disabled = currentGold < workerCost;
            lastState.gold = currentGold;
        }

        if (currentWorkers !== lastState.workers) {
            workerDisplay.textContent = currentWorkers;
            costDisplay.textContent = workerCost;
            lastState.workers = currentWorkers;
        }

        if (currentIdle !== lastState.idle) {
            idleDisplay.textContent = currentIdle;
            lastState.idle = currentIdle;
        }

        if (totalJobEl) {
            totalJobEl.textContent = GameState.getTotalJobCompletions();
        }

        tasks.forEach(task => {
            const currentCount = GameState.assignments[task.id] || 0;
            if (lastState.assignments[task.id] !== currentCount) {
            const countSpan = document.getElementById(`count-${task.id}`);
                if (countSpan) countSpan.textContent = currentCount;
                lastState.assignments[task.id] = currentCount;
            }
        });
    }

    GameState.saveProgress = function() {
        localStorage.setItem(GameState.workersKey, GameState.workers);
        localStorage.setItem(GameState.assignmentsKey, JSON.stringify(GameState.assignments));
        localStorage.setItem("idle_resources", JSON.stringify(GameState.resources));
    }

    function buildCraftables(gearData, toolData, miscData) {
        const craftables = [];
        for (const tier in gearData) for (const part in gearData[tier]) craftables.push({ name: `${tier} ${part}`, cost: gearData[tier][part].cost, type: 'gear' });
        for (const tier in toolData) for (const part in toolData[tier]) craftables.push({ name: `${tier} ${part}`, cost: toolData[tier][part].cost, type: 'tool' });
        for (const key in miscData) craftables.push({ name: key, cost: miscData[key].cost, type: 'misc' });
        return craftables;
    }


    function renderItemIcon(key, amount = null) {
        const img = document.createElement("img");
        img.src = `assets/icons/${key}_icon.png`;
        img.alt = key;
        img.title = key;
        img.style.width = "20px";
        img.style.height = "20px";
        img.style.objectFit = "contain";
        img.style.marginRight = "4px";

        const wrapper = document.createElement("span");
        wrapper.className = "d-inline-flex align-items-center me-2";
        wrapper.appendChild(img);

        if (amount !== null) {
            const text = document.createElement("span");
            text.textContent = `x${amount}`;
            text.className = "ms-1";
            wrapper.appendChild(text);
        }

        return wrapper;
    }

    function populateJobs(jobs) {
        const skillingContainer = document.getElementById("skilling-jobs");
        const combatContainer = document.getElementById("combat-jobs");
        skillingContainer.innerHTML = '';
        combatContainer.innerHTML = '';

        Object.entries(jobs).forEach(([jobId, job]) => {
            const jobName = jobId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const card = document.createElement('div');
            card.className = 'card border shadow-sm p-2 job-card';

            // Create header row container
            const headerRow = document.createElement('div');
            headerRow.className = 'd-flex justify-content-between align-items-center mb-1';

            // Left side: job name
            const jobTitle = document.createElement('strong');
            jobTitle.textContent = jobName;

            // Right side: controls
            const controls = document.createElement('div');
            controls.className = 'd-flex align-items-center gap-2';
            controls.innerHTML = `
            <button class="btn btn-sm btn-danger">−</button>
            <span id="count-${jobId}" class="fw-bold">0</span>
            <button class="btn btn-sm btn-success">+</button>
            `;

            const requiresIcons = document.createElement("div");
            requiresIcons.className = "d-flex flex-wrap align-items-center gap-2";

            if (job.required_resources) {
                for (const [key, amount] of Object.entries(job.required_resources)) {
                    requiresIcons.appendChild(renderItemIcon(key, amount));
                }
            }
            if (job.required_gear && job.required_gear !== "none") {
                const parts = job.required_gear.split(",");
                parts.forEach(req => {
                    const key = req.trim(); // e.g., "iron_sword"
                    const icon = renderItemIcon(key, null);
                    icon.title = key.replace(/_/g, ' '); // Tooltip
                    requiresIcons.appendChild(icon);
                });
            }

            if (job.food_cost) {
                requiresIcons.appendChild(renderItemIcon("cooked_fish", job.food_cost));
            }


            const producesIcons = document.createElement("div");
            producesIcons.className = "d-flex flex-wrap align-items-center gap-2";

            if (job.produces) {
                for (const [key, val] of Object.entries(job.produces)) {
                    if (typeof val === "object" && val.chance) {
                        const icon = renderItemIcon(key);
                        icon.title = `Chance: ${Math.round(val.chance * 100)}%`;
                        producesIcons.appendChild(icon);
                    } else {
                        producesIcons.appendChild(renderItemIcon(key, val));
                    }
                }
            }
            if (job.gp_reward) {
                producesIcons.appendChild(renderItemIcon("gold", job.gp_reward));
            }

            card.appendChild(requiresIcons);
            card.appendChild(producesIcons);


            const requires = [];
            const produces = [];


            const details = document.createElement('div');
            details.className = 'small text-muted mt-1';
            details.innerHTML = `<div>Job Time: ${job.job_action_time || 1}s</div>`;

            const requiresLabel = document.createElement("div");
            requiresLabel.innerHTML = `Requires:`;
            details.appendChild(requiresLabel);
            details.appendChild(requiresIcons);

            const producesLabel = document.createElement("div");
            producesLabel.innerHTML = `Produces:`;
            details.appendChild(producesLabel);
            details.appendChild(producesIcons);


            const tracker = document.createElement('div');
            tracker.className = 'small text-muted mt-1';
            tracker.id = `completed-${jobId}`;
            const completed = GameState.jobCompletionCount?.[jobId] || 0;
            tracker.textContent = `Completed: ${completed}`;



            const [minusBtn, plusBtn] = controls.querySelectorAll('button');

            // Attach events
            minusBtn.onclick = () => {
            if (GameState.assignments[jobId] > 0) {
                GameState.assignments[jobId]--;
                updateUI();
                GameState.saveProgress();
            }
            };
            plusBtn.onclick = () => {
            if (GameState.getIdleWorkers() <= 0) {
                showToast("❌ No idle workers available to assign.");
                return;
            }
            if (job.job_type === "combat" && !hasRequiredGear(jobId, GameState.resources)) {
                showToast("❌ You don’t have the required gear to assign a worker to this combat job.");
                return;
            }
            GameState.assignments[jobId] = (GameState.assignments[jobId] || 0) + 1;
            updateUI();
            GameState.saveProgress();
            };

            // Assemble header row
            headerRow.appendChild(jobTitle);
            headerRow.appendChild(controls);
            card.appendChild(headerRow);

            card.appendChild(details);
            card.appendChild(tracker);

            // Progress bar container
            const progressWrapper = document.createElement("div");
            progressWrapper.className = "progress mt-1";
            progressWrapper.style.height = "6px";
            progressWrapper.innerHTML = `<div class="progress-bar bg-success" id="progress-${jobId}" role="progressbar" style="width: 0%"></div>`;
            card.appendChild(progressWrapper);


            // ✅ Append to correct section
            if (job.job_type === "combat") {
                combatContainer.appendChild(card);
            } else {
                skillingContainer.appendChild(card);
            }
        });
    }


    function cleanupRemovedItems(gameData) {
        if (!gameData.removed_items || !Array.isArray(gameData.removed_items)) return;

        const storedResources = JSON.parse(localStorage.getItem("idle_resources") || "{}");
        let cleaned = false;

        gameData.removed_items.forEach(key => {
            if (key in storedResources) {
            delete storedResources[key];
            cleaned = true;
            console.log(`🧹 Removed obsolete item: ${key}`);
            }
        });

        if (cleaned) {
            localStorage.setItem("idle_resources", JSON.stringify(storedResources));
        }
    }

    // Dev tools for adding items
    window.addItem = function () {
        const key = document.getElementById("dev-item-key").value.trim();
        const amount = parseInt(document.getElementById("dev-item-amount").value) || 0;

        if (!key || amount <= 0) return alert("Invalid key or amount");

        GameState.resources[key] = (GameState.resources[key] || 0) + amount;
        updateResourceDisplay(GameState.resources, GameState.toolsInUse);
        GameState.saveProgress();
    };

    window.removeItem = function () {
        const key = document.getElementById("dev-item-key").value.trim();
        const amount = parseInt(document.getElementById("dev-item-amount").value) || 0;

        if (!key || amount <= 0) return alert("Invalid key or amount");

        GameState.resources[key] = Math.max((GameState.resources[key] || 0) - amount, 0);
        updateResourceDisplay(GameState.resources, GameState.toolsInUse);
        GameState.saveProgress();
    };

})();