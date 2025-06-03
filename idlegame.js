(function () {
    let gameData = {};
    let jobs = {};

    fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
        gameData = data;
        jobs = gameData.jobs;
        populateJobs(jobs);
    })
    .catch(error => console.error('Error loading game data:', error));

    const goldKey = 'idle_gold';
    const workersKey = 'idle_workers';
    const assignmentsKey = 'idle_assignments';

    const tasks = [
        { id: 'fishing', name: '🎣 Fishing' },
        { id: 'mining', name: '⛏️ Mining' },
        { id: 'woodcutting', name: '🪓 Woodcutting' },
        { id: 'cooking', name: '🍳 Cooking' },
        { id: 'thieving', name: '🕵️ Thieving' }
    ];


    // Load saved state or initialize
    let workers = parseInt(localStorage.getItem(workersKey)) || 0;
    let gold = parseInt(localStorage.getItem(goldKey));
    if (isNaN(gold)) gold = workers === 0 ? 100 : 0;

    let assignments = JSON.parse(localStorage.getItem(assignmentsKey)) || {};
    tasks.forEach(task => { if (!(task.id in assignments)) assignments[task.id] = 0; });

    let workerCost = 10 * Math.pow(2, workers);

    // DOM Elements
    const goldDisplay = document.getElementById('gold-count');
    const workerDisplay = document.getElementById('worker-count');
    const idleDisplay = document.getElementById('idle-count');
    const costDisplay = document.getElementById('worker-cost');
    const buyBtn = document.getElementById('buy-worker');
    const taskList = document.getElementById('task-list');

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

        Object.entries(jobs).forEach(([jobName, jobData]) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'd-flex align-items-center gap-2';

            const label = document.createElement('span');
            label.textContent = `${jobName} (${jobData.gp_reward || 0} gp)`;

            const minusBtn = document.createElement('button');
            minusBtn.className = 'btn btn-sm btn-outline-danger';
            minusBtn.textContent = '−';
            minusBtn.onclick = () => removeWorkerFromJob(jobName);

            const plusBtn = document.createElement('button');
            plusBtn.className = 'btn btn-sm btn-outline-success';
            plusBtn.textContent = '+';
            plusBtn.onclick = () => assignWorkerToJob(jobName);

            taskItem.append(label, minusBtn, plusBtn);
            taskList.appendChild(taskItem);
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

    function applyJobTick() {
        for (const task of tasks) {
            const taskId = task.id;
            const assigned = assignments[taskId] || 0;
            if (assigned <= 0) continue;

            const job = jobs[taskId];
            if (!job) continue;

            // Simulate each worker individually
            for (let i = 0; i < assigned; i++) {
            // Check food cost
            if (job.food_cost && (resources["cooked_fish"] || 0) < job.food_cost) continue;
            if (job.food_cost) resources["cooked_fish"] -= job.food_cost;

            // Check required_resources like raw fish for cooking
            let hasRequired = true;
            if (job.required_resources) {
                for (const [res, amt] of Object.entries(job.required_resources)) {
                if ((resources[res] || 0) < amt) {
                    hasRequired = false;
                    break;
                }
                }
                if (!hasRequired) continue;
                for (const [res, amt] of Object.entries(job.required_resources)) {
                resources[res] -= amt;
                }
            }

            // Handle "produces"
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

            // Handle gp_reward (fighting tiers)
            if (job.gp_reward) {
                gold += job.gp_reward;
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
        const container = document.getElementById("resource-display");
        container.innerHTML = "";

        for (const [key, value] of Object.entries(resources)) {
            const card = document.createElement("div");
            card.className = "col";
            card.innerHTML = `
            <div class="card p-2 bg-white border shadow-sm">
                <div class="fw-semibold">${key.replace(/_/g, ' ')}</div>
                <div>${value}</div>
            </div>
            `;
            container.appendChild(card);
        }
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