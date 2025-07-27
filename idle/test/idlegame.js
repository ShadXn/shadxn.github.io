// idlegame.js — main entry point (no modules)
(function () {
    if (localStorage.getItem("resetting") === "true") {
        localStorage.removeItem("resetting");
        localStorage.removeItem("idle_gold");
        localStorage.removeItem("idle_resources");
        localStorage.removeItem("idle_workers");
        localStorage.removeItem("idle_assignments");
        localStorage.removeItem("idle_workers_owned");
        localStorage.removeItem("idle_worker_data");
        localStorage.removeItem("idle_job_completion_count");
    }

    let tasks = [];
    let buyBtn;

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
            // Initialize gameData with the fetched data
            GameState.baseData     = data;
            GameState.jobs         = data.jobs || {};
            GameState.workerTemplate = data.worker_template || {};
            GameState.skills       = data.skills || {};

            // From items
            GameState.resources    = data.items?.resources || {};
            GameState.recipes      = data.items?.recipes || {};
            GameState.misc         = data.items?.miscellaneous || {};
            GameState.gear         = data.items?.gear || {};
            GameState.tools        = data.items?.tools || {};

            // Equipment metadata
            GameState.toolParts    = data.equipment?.tools_parts || [];
            GameState.gearParts    = data.equipment?.gear_parts || [];
            GameState.tiers        = data.tiers || {};
            GameState.limits       = data.limits || {};

            // Initialize jobs
            Object.keys(GameState.resources).forEach(k => allItemKeys.add(k));
            Object.keys(GameState.misc).forEach(k => allItemKeys.add(k));

            // Initialize gear and tools
            for (const tier in GameState.tools) {
                for (const part in GameState.tools[tier]) {
                    allItemKeys.add(`${tier}_${part}`);
                }
            }

            for (const tier in GameState.gear) {
                for (const part in GameState.gear[tier]) {
                    allItemKeys.add(`${tier}_${part}`);
                }
            }

            // Initialize recipes
            Object.keys(GameState.recipes).forEach(key => {
                allItemKeys.add(`recipe_${key}`);
            });

            // Initialize tasks
            tasks = Object.keys(GameState.jobs).map(id => ({
            id,
            name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            rate: GameState.jobs[id].gp_reward || 0
            }));

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
        // cleanupRemovedItems(GameState.baseData);
        // Resync GameState.resources after cleaning localStorage
        // GameState.resources = JSON.parse(localStorage.getItem("idle_owned_workers") || "{}");

        // Initialize resources if not already set
        tasks.forEach(task => {
        if (!(task.id in GameState.assignments)) GameState.assignments[task.id] = 0;
        });

        // Getting references to UI elements
        goldDisplay = document.getElementById('gold-count');
        workerDisplay = document.getElementById('worker-count');
        idleDisplay = document.getElementById('idle-count');
        costDisplay = document.getElementById('worker-cost');
        buyBtn = document.getElementById('buy-worker');
        taskList = document.getElementById('task-list');

        // buy worker button
        buyBtn.addEventListener('click', () => {
            const maxWorkers = GameState.limits?.max_workers || 30;

            if (GameState.ownedWorkers.length >= maxWorkers) {
                showToast("❌ Worker limit reached.");
                return;
            }

            const cost = GameState.getNextWorkerCost();
            if (GameState.resources.gold < cost) {
                showToast("❌ Not enough gold.");
                return;
            }

            // Subtract gold
            GameState.resources.gold -= cost;

            // Create new worker
            const workerId = GameState.getNextWorkerId();
            const workerName = `Worker ${GameState.ownedWorkers.length + 1}`;
            const newWorker = GameState.createNewWorker(workerId, workerName);

            GameState.ownedWorkers.push(workerId);
            GameState.workerData[workerId] = newWorker;

            console.log(`✅ Bought ${workerId} for ${cost} gold`);
            GameState.saveProgress();
            Display.updateUI();
        });


        // Update the UI with initial values
        Display.prebuildItemDisplay(allItemKeys, {
            default: document.getElementById("resource-display"),
            gear: document.getElementById("gear-display"),
            tool: document.getElementById("tool-display"),
            recipe: document.getElementById("recipe-display"),
            misc: document.getElementById("misc-display")
        });


        Crafting.showCraftingSection();
        renderSidebarContent();
        Display.populateJobs();
        // Game loop update jobs and resources and save every 500ms
        setInterval(() => {
            Jobs.applyJobTick(tasks);
            Display.updateResourceDisplay(); // updateResourceDisplay updates the resource counts and tool/gear in use
            Display.updateUI(); // Note: updateUI updates the workers assigned to jobs counter
            GameState.saveProgress(); // Save updated resources + assignments
        }, 500);

        // Hide loading overlay
        const loadingOverlay = document.getElementById("loading-overlay");
        setTimeout(() => {
            requestAnimationFrame(() => {
                loadingOverlay.style.opacity = "0";
                setTimeout(() => loadingOverlay.remove(), 300);
            });
        }, 500); // Wait at least 500ms



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
            <hr style="margin:6px 0;">
            <h5>Quick Add/Remove</h5>
            <div style="display:flex; flex-direction:column; gap:4px; max-height:400px; overflow-y:auto;">
            ${["logs", "ore", "ingot", "gold", "fish", "cooked_fish", "refined_wood", "fire_wood", "recipe_bronze", "recipe_iron", "recipe_steel"].map(key => `
                    <div style="display:flex; align-items:center; gap:6px;">
                    <strong style="width:90px;">${key}</strong>
                    <button onclick="quickAdjust('${key}', 20000)">+20000</button>
                    <button onclick="quickAdjust('${key}', -20000)">−20000</button>
                </div>
            `).join("")}
            </div>

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
    window.quickAdjust = function(key, amount) {
        const keyInput = document.getElementById("dev-item-key");
        const amountInput = document.getElementById("dev-item-amount");

        if (!keyInput || !amountInput) return;

        keyInput.value = key;
        amountInput.value = Math.abs(amount);

        if (amount > 0) {
            addItem();
        } else {
            removeItem();
        }
    };


    window.addItem = function () {
        const key = document.getElementById("dev-item-key").value.trim();
        const amount = parseInt(document.getElementById("dev-item-amount").value) || 0;

        if (!key || amount <= 0) return alert("Invalid key or amount");

        GameState.resources[key] = (GameState.resources[key] || 0) + amount;
        Display.updateResourceDisplay();
        GameState.saveProgress();
    };

    window.removeItem = function () {
        const key = document.getElementById("dev-item-key").value.trim();
        const amount = parseInt(document.getElementById("dev-item-amount").value) || 0;

        if (!key || amount <= 0) return alert("Invalid key or amount");

        GameState.resources[key] = Math.max((GameState.resources[key] || 0) - amount, 0);
        Display.updateResourceDisplay();
        GameState.saveProgress();
    };

})();