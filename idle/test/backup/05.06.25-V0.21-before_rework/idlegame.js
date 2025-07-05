(function () {
    if (localStorage.getItem("resetting") === "true") {
        localStorage.removeItem("resetting");

        // Prevent loading old values
        localStorage.removeItem("idle_gold");
        localStorage.removeItem("idle_resources");
        localStorage.removeItem("idle_workers");
        localStorage.removeItem("idle_assignments");
    }

    let gameData = {};
    let jobs = {};
    let tasks = [];
    let gearData = {};
    let toolData = {};
    let goldDisplay, workerDisplay, idleDisplay, costDisplay, buyBtn, taskList;
    
    const availableIcons = new Set([
        "fish", "logs", "ore", "ingot", "cooked_fish", "gold", "recipe", 
        "bronze_sword", "bronze_armor", "bronze_shield",
        "bronze_axe", "bronze_pickaxe", "bronze_rod", "bronze_hammer", "bronze_boots", "bronze_gloves",

        // Add other resource keys you’ve created icons for
    ]);

    // Collect all item keys from gearData and toolData
    const allItemKeys = new Set();


    fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
        console.log("Loaded gameData:", data);  // <== debugging line
        gameData = data;
        jobs = gameData.jobs;
        gearData = gameData.gear || {};
        toolData = gameData.tools || {};

        if (!jobs || !gearData || !toolData) {
            console.error("Missing expected sections in game_data.json");
            return;
        }

        // Collect all resource, tool, gear keys
        Object.keys(data.resources).forEach(k => allItemKeys.add(k));

        for (const tier in data.tools) {
            for (const part in data.tools[tier]) {
                allItemKeys.add(`${tier}_${part}`); // e.g. bronze_pickaxe
            }
        }

        for (const tier in data.gear) {
            for (const part in data.gear[tier]) {
                allItemKeys.add(`${tier}_${part}`); // e.g. bronze_sword
            }
        }

        // Expand recipe keys from structured recipe definitions
        const recipeData = data.recipes || {};
        const tierOrder = ["bronze", "iron", "steel", "black", "mithril", "adamant", "rune", "dragon", "god", "victory"];

        tierOrder.forEach(tier => {
            if (recipeData[tier]) {
                const recipeKey = `recipe_${tier}`;
                allItemKeys.add(recipeKey);
                console.log(`✅ Added recipe: ${recipeKey}`);
            }
        });

        populateJobs(jobs);

        // Auto-generate tasks list from job keys (if you want to preserve order, sort here)
        tasks = Object.keys(jobs).map(key => ({
            id: key,
            name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // readable names
            rate: jobs[key].gp_reward || 0
        }));

        initializeGame(); // <-- defer setup until data is ready
    })
    .catch(error => console.error('Error loading game data:', error));

    // Game state variables
    const workersKey = 'idle_workers';
    const assignmentsKey = 'idle_assignments';
    const toolsInUse = {};  // Track how many of each tool is in use

    // Passive resources.gold income loop
    const resources = JSON.parse(localStorage.getItem('idle_resources') || '{}');

    function initializeGame() {
        workers = parseInt(localStorage.getItem(workersKey)) || 0;
        if (typeof resources.gold !== "number") {
            resources.gold = workers === 0 ? 10 : 0;
        }

        assignments = JSON.parse(localStorage.getItem(assignmentsKey)) || {};
        tasks.forEach(task => { if (!(task.id in assignments)) assignments[task.id] = 0; });

        workerCost = 10 * Math.pow(2, workers);

        // DOM references
        goldDisplay = document.getElementById('gold-count');
        workerDisplay = document.getElementById('worker-count');
        idleDisplay = document.getElementById('idle-count');
        costDisplay = document.getElementById('worker-cost');
        buyBtn = document.getElementById('buy-worker');
        taskList = document.getElementById('task-list');

        // ✅ Hook Buy button inside this scope
        buyBtn.addEventListener('click', () => {
            if (resources.gold >= workerCost) {
                resources.gold -= workerCost;
                workers++;
                workerCost = 10 * Math.pow(2, workers);
                updateUI();
                saveProgress();
            }
        });
        
        // ✅ Prebuild item display for resources, gear, and tools
        prebuildItemDisplay(allItemKeys);

        updateUI();
        const craftables = buildCraftables(gearData, toolData);
        // ✅ Crafting section setup (gear, tools, upgrades)
        showCraftingSection(craftables, resources);
    }

    function getIdleWorkers() {
        return workers - Object.values(assignments).reduce((a, b) => a + b, 0);
    }

    function updateUI() {
        goldDisplay.textContent = resources.gold;
        workerDisplay.textContent = workers;
        idleDisplay.textContent = getIdleWorkers();
        costDisplay.textContent = workerCost;

        buyBtn.disabled = resources.gold < workerCost;

        tasks.forEach(task => {
            const countSpan = document.getElementById(`count-${task.id}`);
            if (countSpan) countSpan.textContent = assignments[task.id];
        });
    }

    function saveProgress() {
        localStorage.setItem("idle_gold", resources.gold);
        localStorage.setItem(workersKey, workers);
        localStorage.setItem(assignmentsKey, JSON.stringify(assignments));
    }

    function buildCraftables(gearData, toolData) {
        const craftables = [];

        // Add gear
        for (const tier in gearData) {
            for (const part in gearData[tier]) {
                const item = gearData[tier][part];
                craftables.push({
                    name: `${tier} ${part}`,       // e.g. "bronze sword"
                    cost: item.cost,
                    type: 'gear'
                });
            }
        }

        // ✅ Add tools with the same nested structure
        for (const tier in toolData) {
            for (const part in toolData[tier]) {
                const item = toolData[tier][part];
                craftables.push({
                    name: `${tier} ${part}`,        // e.g. "iron pickaxe"
                    cost: item.cost,
                    type: 'tool'
                });
            }
        }

        return craftables;
    }

    function populateJobs(jobs) {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = ''; // Clear old tasks

        Object.entries(jobs).forEach(([jobId, job]) => {
            const jobName = jobId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

            const card = document.createElement('div');
            card.className = 'card border shadow-sm p-2';

            const header = document.createElement('div');
            header.className = 'd-flex justify-content-between align-items-center';
            header.innerHTML = `
                <strong>${jobName}</strong>
                <span class="text-muted">${job.gp_reward || 0} gp/sec</span>
            `;

            // 📦 Build "Requires" section
            const requiresParts = [];

            if (job.required_resources) {
                const res = Object.entries(job.required_resources)
                    .map(([r, a]) => `${r}: ${a}`)
                    .join(', ');
                requiresParts.push(res);
            }

            if (job.required_gear && job.required_gear !== "none") {
                requiresParts.push(`Armor: ${job.required_gear}`);
            }

            if (job.food_cost) {
                requiresParts.push(`Food: ${job.food_cost}`);
            }

            const requires = requiresParts.length > 0 ? requiresParts.join(', ') : 'None';

            // 🎁 Build "Produces" section
            const producesParts = [];

            if (job.produces) {
                Object.entries(job.produces).forEach(([r, v]) => {
                    if (typeof v === 'object' && v.chance) {
                        producesParts.push(`${r} (chance ${v.chance * 100}%)`);
                    } else {
                        producesParts.push(`${r}: ${v}`);
                    }
                });
            }

            if (job.gp_reward) {
                producesParts.push(`gp: ${job.gp_reward}`);
            }

            const produces = producesParts.length > 0 ? producesParts.join(', ') : 'None';

            const details = document.createElement('div');
            details.className = 'small text-muted mt-1';
            details.innerHTML = `
                <div>🎯 Requires: ${requires}</div>
                <div>🎁 Produces: ${produces}</div>
            `;

            const controls = document.createElement('div');
            controls.className = 'd-flex align-items-center gap-2 mt-2';
            controls.innerHTML = `
                <button class="btn btn-sm btn-danger">−</button>
                <span id="count-${jobId}" class="fw-bold">0</span>
                <button class="btn btn-sm btn-success">+</button>
            `;

            const [minusBtn, plusBtn] = controls.querySelectorAll('button');
            minusBtn.onclick = () => {
                if (assignments[jobId] > 0) {
                    assignments[jobId]--;
                    updateUI();
                    saveProgress();
                }
            };
            plusBtn.onclick = () => {
                if (getIdleWorkers() > 0) {
                    assignments[jobId] = (assignments[jobId] || 0) + 1;
                    updateUI();
                    saveProgress();
                }
            };

            card.appendChild(header);
            card.appendChild(details);
            card.appendChild(controls);
            taskList.appendChild(card);
        });
    }

    function prebuildItemDisplay(itemKeys) {
        const containers = {
            default: document.getElementById("resource-display"),
            gear: document.getElementById("gear-display"),
            tool: document.getElementById("tool-display"),
            recipe: document.getElementById("recipe-display")
        };

        updateResourceDisplay._initialized = true;
        updateResourceDisplay._elements = {};

        itemKeys.forEach(key => {
            const card = document.createElement("div");
            card.className = "";
            card.id = `item-card-${key}`;

            const innerCard = document.createElement("div");
            innerCard.className = "card bg-white border shadow-sm d-flex align-items-center";

            // Icon or fallback
            const img = document.createElement("img");

            // Load icons based on key
            let iconKey = key;
            if (key.startsWith("recipe_")) {
                const parts = key.split("_");
                const tier = parts[1];
                iconKey = `recipe_${tier}`;
            }

            img.src = `assets/icons/${iconKey}_icon.png`;
            img.alt = key;
            img.width = 24;
            img.height = 24;

            img.onerror = () => {
                img.remove();
                const fallback = document.createElement("div");
                fallback.className = "fallback-text";
                fallback.textContent = key.replace(/_/g, ' ');
                innerCard.insertBefore(fallback, text);
            };

            innerCard.appendChild(img);

            // Amount text
            const text = document.createElement("div");
            text.id = `item-count-${key}`;
            text.innerHTML = "0";
            innerCard.appendChild(text);

            card.appendChild(innerCard);

            // Append to correct section
            if (key.startsWith("recipe_")) {
                containers.recipe.appendChild(card);
            } else if (/sword|armor|shield/.test(key)) {
                containers.gear.appendChild(card);
            } else if (/pickaxe|axe|rod|hammer|gloves|cape|boots/.test(key)) {
                containers.tool.appendChild(card);
            } else if (key !== "gold") {
                containers.default.appendChild(card);
            }

            // ✅ Store reference for future updates
            updateResourceDisplay._elements[key] = text;
        });
    }

    // Generate task UI
    tasks.forEach(task => {
        const row = document.createElement('div');
        row.className = 'd-flex justify-content-between align-items-center border p-2 rounded';

        row.innerHTML = `
        <div><strong>${task.name}</strong> — ${task.rate} gp/sec</div>
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-danger" id="minus-${task.id}">−</button>
            <span id="count-${task.id}" class="fw-bold">${assignments[task.id]}</span>
            <button class="btn btn-sm btn-success" id="plus-${task.id}">+</button>
        </div>
        `;

        taskList.appendChild(row);

        // Add listeners
        document.getElementById(`plus-${task.id}`).addEventListener('click', () => {
        if (getIdleWorkers() > 0) {
            assignments[task.id]++;
            updateUI();
            saveProgress();
        }
        });

        document.getElementById(`minus-${task.id}`).addEventListener('click', () => {
        if (assignments[task.id] > 0) {
            assignments[task.id]--;
            updateUI();
            saveProgress();
        }
        });
    });

    function getBestToolForJob(jobId, resources) {
        const toolPriority = {
            mining: [["god_pickaxe", "dragon_pickaxe", "rune_pickaxe", "adamant_pickaxe", "mithril_pickaxe", "black_pickaxe", "steel_pickaxe", "iron_pickaxe", "bronze_pickaxe"]],
            fishing: [["god_rod", "dragon_rod", "rune_rod", "adamant_rod", "mithril_rod", "black_rod", "steel_rod", "iron_rod", "bronze_rod"]],
            woodcutting: [["god_axe", "dragon_axe", "rune_axe", "adamant_axe", "mithril_axe", "black_axe", "steel_axe", "iron_axe", "bronze_axe"]],
            smithing: [["god_hammer", "dragon_hammer", "rune_hammer", "adamant_hammer", "mithril_hammer", "black_hammer", "steel_hammer", "iron_hammer", "bronze_hammer"]],
            cooking: [["god_gloves", "dragon_gloves", "rune_gloves", "adamant_gloves", "mithril_gloves", "black_gloves", "steel_gloves", "iron_gloves", "bronze_gloves"]],
            thieving: [["god_boots", "dragon_boots", "rune_boots", "adamant_boots", "mithril_boots", "black_boots", "steel_boots", "iron_boots", "bronze_boots"]],
            fighting_tier_1: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_2: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_3: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_4: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_5: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_6: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_7: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_8: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_9: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_10: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ],
            fighting_tier_11: [
                ["god_sword", "dragon_sword", "rune_sword", "adamant_sword", "mithril_sword", "black_sword", "steel_sword", "iron_sword", "bronze_sword"],
                ["god_armor", "dragon_armor", "rune_armor", "adamant_armor", "mithril_armor", "black_armor", "steel_armor", "iron_armor", "bronze_armor"],
                ["god_shield", "dragon_shield", "rune_shield", "adamant_shield", "mithril_shield", "black_shield", "steel_shield", "iron_shield", "bronze_shield"]
            ]
        };
        return toolPriority[jobId] || [];
    }

    // Assign tools based on job requirements
    function assignTools(jobId, count, resources) {
        const toolSets = getBestToolForJob(jobId, resources);  // Now an array of arrays
        const assignedToolSets = [];

        for (let i = 0; i < count; i++) {
            const toolsForThisWorker = [];

            for (const slotOptions of toolSets) {
                let foundTool = null;
                for (const tool of slotOptions) {
                    const available = (resources[tool] || 0) - (toolsInUse[tool] || 0);
                    if (available > 0) {
                        toolsInUse[tool] = (toolsInUse[tool] || 0) + 1;
                        foundTool = tool;
                        break;
                    }
                }
                toolsForThisWorker.push(foundTool);  // Can be null if nothing found
            }

            assignedToolSets.push(toolsForThisWorker);
        }

        return assignedToolSets;
    }

    // Apply job tick every second
    function applyJobTick() {
        Object.keys(toolsInUse).forEach(tool => toolsInUse[tool] = 0);
        for (const task of tasks) {
            const taskId = task.id;
            const assigned = assignments[taskId] || 0;
            if (assigned <= 0) continue;

            const job = jobs[taskId];
            if (!job) continue;

            // Only assign tools once we know we have assigned workers
            const toolSetsUsed = assignTools(taskId, assigned, resources);

            for (let i = 0; i < assigned; i++) {
                // Check food cost
                if (job.food_cost && (resources["cooked_fish"] || 0) < job.food_cost) continue;

                // Check required resources
                let hasRequired = true;
                if (job.required_resources) {
                    for (const [res, amt] of Object.entries(job.required_resources)) {
                        if ((resources[res] || 0) < amt) {
                            hasRequired = false;
                            break;
                        }
                    }
                    if (!hasRequired) continue;
                }

                // Deduct food and required resources
                if (job.food_cost) resources["cooked_fish"] -= job.food_cost;
                if (job.required_resources) {
                    for (const [res, amt] of Object.entries(job.required_resources)) {
                        resources[res] -= amt;
                    }
                }

                // Use tool and calculate multipliers
                const toolSet = toolSetsUsed[i];
                const equippedCount = toolSet.filter(t => t !== null).length;
                const speedMultiplier = equippedCount > 0 ? 0.75 : 1.0;      // Unused for now, could be used for cooldown later
                const rewardMultiplier = 1.0 + equippedCount * 0.1;  // 10% per equipped item

                // Handle produces
                if (job.produces) {
                    for (const [res, value] of Object.entries(job.produces)) {
                        if (typeof value === "object" && value.chance) {
                            if (Math.random() < value.chance) {
                                resources[res] = (resources[res] || 0) + 1;
                            }
                        } else {
                            resources[res] = (resources[res] || 0) + value;
                        }
                    }
                }

                // Handle gp reward with multiplier
                if (job.gp_reward) {
                    resources.gold += job.gp_reward;
                }
            }
        }

        updateResourceDisplay(resources);
        updateUI();
        saveProgress();
        localStorage.setItem('idle_resources', JSON.stringify(resources));
    }
    setInterval(applyJobTick, 1000);

    // Update resource count display
    function updateResourceDisplay(resources) {
        Object.entries(updateResourceDisplay._elements).forEach(([key, element]) => {
            const value = resources[key] || 0;
            const inUse = toolsInUse[key] || 0;
            const showInUse = inUse > 0 ? ` (${inUse})` : "";
            element.innerHTML = `${value}${showInUse}`;
        });
    }

    // Show crafting section with gear and tools
    function showCraftingSection(items = [], resources = {}) {
        const gearContainer = document.getElementById("gear-craft");
        const toolContainer = document.getElementById("tools-craft");

        if (!gearContainer || !toolContainer) {
            console.warn("Missing crafting containers");
            return;
        }

        gearContainer.innerHTML = "";
        toolContainer.innerHTML = "";

        items.forEach(item => {
            const button = document.createElement("button");
            button.className = "btn btn-sm btn-outline-secondary";
            button.innerHTML = `
                ${item.name}<br>
                <small>
                    ${Object.entries(item.cost).map(([r, a]) => `${r}: ${a}`).join("<br>")}
                    ${item.used_for ? `<br>used for: ${item.used_for}` : ''}
                </small>
            `;
            button.onclick = () => attemptCraft(item, resources);

            if (item.type === 'gear') gearContainer.appendChild(button);
            else if (item.type === 'tool') toolContainer.appendChild(button);
        });
    }

    function normalizeItemKey(name) {
        return name.toLowerCase().replace(/ /g, '_');  // "bronze sword" => "bronze_sword"
    }

    function attemptCraft(item, resources) {
        for (const [res, amt] of Object.entries(item.cost)) {
            const resKey = normalizeItemKey(res);
            const inUse = toolsInUse[resKey] || 0;
            const available = (resources[resKey] || 0) - inUse;

            if (available < amt) {
                alert(`Not enough available ${res} to craft ${item.name}.\nIn use: ${inUse}, Available: ${available}`);
                return;
            }
        }

        // Deduct and grant item
        for (const [res, amt] of Object.entries(item.cost)) {
            resources[res] -= amt;
        }
        const itemKey = normalizeItemKey(item.name);
        resources[itemKey] = (resources[itemKey] || 0) + 1;

        updateResourceDisplay(resources);
        saveProgress();
    }

})();