(function () {
    let gameData = {};
    let jobs = {};
    let tasks = [];

    fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
        gameData = data;
        jobs = gameData.jobs;
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

    const goldKey = 'idle_gold';
    const workersKey = 'idle_workers';
    const assignmentsKey = 'idle_assignments';

    function initializeGame() {
        // Load saved state or initialize
        workers = parseInt(localStorage.getItem(workersKey)) || 0;
        gold = parseInt(localStorage.getItem(goldKey));
        if (isNaN(gold)) gold = workers === 0 ? 100 : 0;

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

        // Add all task UI here (generate buttons)
        // Add buy button listener
        // Add setInterval for job tick
        // Update UI, etc.
    }

    function getIdleWorkers() {
        return workers - Object.values(assignments).reduce((a, b) => a + b, 0);
    }

    function updateUI() {
        goldDisplay.textContent = gold;
        workerDisplay.textContent = workers;
        idleDisplay.textContent = getIdleWorkers();
        costDisplay.textContent = workerCost;

        tasks.forEach(task => {
        const countSpan = document.getElementById(`count-${task.id}`);
        if (countSpan) countSpan.textContent = assignments[task.id];
        });
    }

    function saveProgress() {
        localStorage.setItem(goldKey, gold);
        localStorage.setItem(workersKey, workers);
        localStorage.setItem(assignmentsKey, JSON.stringify(assignments));
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

            const requires = job.required_resources
                ? Object.entries(job.required_resources).map(([r, a]) => `${r}: ${a}`).join(', ')
                : 'None';

            const food = job.food_cost ? `Food: ${job.food_cost}` : '';
            const drops = job.produces
                ? Object.entries(job.produces).map(([r, v]) =>
                    typeof v === 'object' && v.chance ? `${r} (chance ${v.chance * 100}%)` : `${r}: ${v}`
                ).join(', ')
                : 'None';

            const details = document.createElement('div');
            details.className = 'small text-muted mt-1';
            details.innerHTML = `
                <div>🎯 Requires: ${requires}${food ? ', ' + food : ''}</div>
                <div>🎁 Produces: ${drops}</div>
            `;

            const controls = document.createElement('div');
            controls.className = 'd-flex align-items-center gap-2 mt-2';
            controls.innerHTML = `
                <button class="btn btn-sm btn-danger">−</button>
                <span id="count-${jobId}" class="fw-bold">0</span>
                <button class="btn btn-sm btn-success">+</button>
            `;

            // Add logic
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

    buyBtn.addEventListener('click', () => {
        if (gold >= workerCost) {
        gold -= workerCost;
        workers++;
        workerCost = 10 * Math.pow(2, workers);
        updateUI();
        saveProgress();
        }
    });

  // Passive gold income loop
    const resources = JSON.parse(localStorage.getItem('idle_resources') || '{}');

    function getBestToolForJob(jobId, resources) {
        const toolPriority = {
            mining: ["dragon_pickaxe", "runite_pickaxe", "adamant_pickaxe", "mithril_pickaxe", "iron_pickaxe", "bronze_pickaxe"],
            fishing: ["dragon_rod", "runite_rod", "adamant_rod", "mithril_rod", "iron_rod", "bronze_rod"],
            woodcutting: ["dragon_axe", "runite_axe", "adamant_axe", "mithril_axe", "iron_axe", "bronze_axe"],
            // Add more if needed
        };
        return toolPriority[jobId] || [];
    }

    function assignTools(jobId, count, resources) {
        const toolList = getBestToolForJob(jobId, resources);
        const assignedTools = [];

    for (let i = 0; i < count; i++) {
        let found = false;
        for (const tool of toolList) {
        if ((resources[tool] || 0) > 0) {
            assignedTools.push(tool);
            resources[tool]--;
            found = true;
            break;
        }
        }
        if (!found) assignedTools.push(null); // no tool
    }
    return assignedTools;
    }

    function applyJobTick() {
        for (const task of tasks) {
            const taskId = task.id;
            const assigned = assignments[taskId] || 0;
            if (assigned <= 0) continue;

            const job = jobs[taskId];
            if (!job) continue;

            // Only assign tools once we know we have assigned workers
            const toolsUsed = assignTools(taskId, assigned, resources);

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
                const tool = toolsUsed[i];
                const speedMultiplier = tool ? 0.75 : 1.0;      // Unused for now, could be used for cooldown later
                const rewardMultiplier = tool ? 1.25 : 1.0;

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
                    gold += job.gp_reward * rewardMultiplier;
                }
            }
        }

        updateResourceDisplay(resources);
        updateUI();
        saveProgress();
        localStorage.setItem('idle_resources', JSON.stringify(resources));
    }
    setInterval(applyJobTick, 1000);

  
    function updateResourceDisplay(resources) {
        const resourceContainer = document.getElementById("resource-display");
        const gearContainer = document.getElementById("gear-display");
        const toolContainer = document.getElementById("tool-display");
        resourceContainer.innerHTML = "";
        gearContainer.innerHTML = "";
        toolContainer.innerHTML = "";

        Object.entries(resources).forEach(([key, value]) => {
            const card = document.createElement("div");
            card.className = "col";
            card.innerHTML = `
            <div class="card p-2 bg-white border shadow-sm">
                <div class="fw-semibold">${key.replace(/_/g, ' ')}</div>
                <div>${value}</div>
            </div>
            `;

            if (/sword|armor|shield/.test(key)) gearContainer.appendChild(card);
            else if (/pickaxe|axe|rod|gloves/.test(key)) toolContainer.appendChild(card);
            else resourceContainer.appendChild(card);
        });
    }

    function showCraftingOptions(availableItems, playerResources) {
        const container = document.getElementById("crafting-options");
        container.innerHTML = "";

        availableItems.forEach(item => {
            const costList = Object.entries(item.cost).map(
            ([res, amt]) => `${res}: ${amt}`
            ).join("<br>");

            const button = document.createElement("button");
            button.className = "btn btn-sm btn-outline-secondary";
            button.innerHTML = `${item.name}<br><small>${costList}</small>`;
            button.onclick = () => attemptCraft(item, playerResources);
            container.appendChild(button);
        });
    }

    function attemptCraft(item, resources) {
        for (const [res, amt] of Object.entries(item.cost)) {
            if ((resources[res] || 0) < amt) {
            alert(`Not enough ${res} to craft ${item.name}`);
            return;
            }
        }

        // Deduct and grant item
        for (const [res, amt] of Object.entries(item.cost)) {
            resources[res] -= amt;
        }
        resources[item.name] = (resources[item.name] || 0) + 1;
        updateResourceDisplay(resources);
    }

    updateUI();
})();