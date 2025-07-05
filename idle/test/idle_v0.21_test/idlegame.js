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
    let goldDisplay, workerDisplay, idleDisplay, costDisplay, buyBtn, taskList;

    const workersKey = 'idle_workers';
    const assignmentsKey = 'idle_assignments';
    const toolsInUse = {};
    const resources = JSON.parse(localStorage.getItem('idle_resources') || '{}');
    const allItemKeys = new Set();

    fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
        gameData = data;
        jobs = gameData.jobs;
        gearData = gameData.gear || {};
        toolData = gameData.tools || {};

        Object.keys(data.resources).forEach(k => allItemKeys.add(k));
        for (const tier in data.tools) for (const part in data.tools[tier]) allItemKeys.add(`${tier}_${part}`);
        for (const tier in data.gear) for (const part in data.gear[tier]) allItemKeys.add(`${tier}_${part}`);

        const recipeData = data.recipes || {};
        const tierOrder = ["bronze", "iron", "steel", "black", "mithril", "adamant", "rune", "dragon", "god", "victory"];
        tierOrder.forEach(tier => { if (recipeData[tier]) allItemKeys.add(`recipe_${tier}`); });

        tasks = Object.keys(jobs).map(key => ({ id: key, name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), rate: jobs[key].gp_reward || 0 }));
        initializeGame();
    })
    .catch(error => console.error('Error loading game data:', error));

    function initializeGame() {
        workers = parseInt(localStorage.getItem(workersKey)) || 0;
        if (typeof resources.gold !== "number") resources.gold = workers === 0 ? 10 : 0;

        assignments = JSON.parse(localStorage.getItem(assignmentsKey) || '{}');
        tasks.forEach(task => { if (!(task.id in assignments)) assignments[task.id] = 0; });

        workerCost = 10 * Math.pow(2, workers);

        goldDisplay = document.getElementById('gold-count');
        workerDisplay = document.getElementById('worker-count');
        idleDisplay = document.getElementById('idle-count');
        costDisplay = document.getElementById('worker-cost');
        buyBtn = document.getElementById('buy-worker');
        taskList = document.getElementById('task-list');

        buyBtn.addEventListener('click', () => {
            if (resources.gold >= workerCost) {
                resources.gold -= workerCost;
                workers++;
                workerCost = 10 * Math.pow(2, workers);
                updateUI();
                saveProgress();
            }
        });

        prebuildItemDisplay(allItemKeys, {
            default: document.getElementById("resource-display"),
            gear: document.getElementById("gear-display"),
            tool: document.getElementById("tool-display"),
            recipe: document.getElementById("recipe-display")
        });

        updateUI();
        showCraftingSection(buildCraftables(gearData, toolData), resources);
        populateJobs(jobs);
        setInterval(() => applyJobTick(assignments, tasks, jobs, resources, toolsInUse), 1000);
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
        localStorage.setItem('idle_resources', JSON.stringify(resources));
    }

    function buildCraftables(gearData, toolData) {
        const craftables = [];
        for (const tier in gearData) for (const part in gearData[tier]) craftables.push({ name: `${tier} ${part}`, cost: gearData[tier][part].cost, type: 'gear' });
        for (const tier in toolData) for (const part in toolData[tier]) craftables.push({ name: `${tier} ${part}`, cost: toolData[tier][part].cost, type: 'tool' });
        return craftables;
    }

    function populateJobs(jobs) {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        Object.entries(jobs).forEach(([jobId, job]) => {
            const jobName = jobId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const card = document.createElement('div');
            card.className = 'card border shadow-sm p-2';
            const header = document.createElement('div');
            header.className = 'd-flex justify-content-between align-items-center';
            header.innerHTML = `<strong>${jobName}</strong><span class="text-muted">${job.gp_reward || 0} gp/sec</span>`;

            const requires = [];
            if (job.required_resources) requires.push(Object.entries(job.required_resources).map(([r, a]) => `${r}: ${a}`).join(', '));
            if (job.required_gear && job.required_gear !== "none") requires.push(`Armor: ${job.required_gear}`);
            if (job.food_cost) requires.push(`Food: ${job.food_cost}`);

            const produces = [];
            if (job.produces) Object.entries(job.produces).forEach(([r, v]) => produces.push(typeof v === 'object' && v.chance ? `${r} (chance ${v.chance * 100}%)` : `${r}: ${v}`));
            if (job.gp_reward) produces.push(`gp: ${job.gp_reward}`);

            const details = document.createElement('div');
            details.className = 'small text-muted mt-1';
            details.innerHTML = `<div>🎯 Requires: ${requires.join(', ') || 'None'}</div><div>🎁 Produces: ${produces.join(', ') || 'None'}</div>`;

            const controls = document.createElement('div');
            controls.className = 'd-flex align-items-center gap-2 mt-2';
            controls.innerHTML = `<button class="btn btn-sm btn-danger">−</button><span id="count-${jobId}" class="fw-bold">0</span><button class="btn btn-sm btn-success">+</button>`;
            const [minusBtn, plusBtn] = controls.querySelectorAll('button');
            minusBtn.onclick = () => { if (assignments[jobId] > 0) { assignments[jobId]--; updateUI(); saveProgress(); } };
            plusBtn.onclick = () => { if (getIdleWorkers() > 0) { assignments[jobId] = (assignments[jobId] || 0) + 1; updateUI(); saveProgress(); } };

            card.appendChild(header);
            card.appendChild(details);
            card.appendChild(controls);
            taskList.appendChild(card);
        });
    }

    function showCraftingSection(items = [], resources = {}) {
        const gearContainer = document.getElementById("gear-craft");
        const toolContainer = document.getElementById("tools-craft");
        if (!gearContainer || !toolContainer) return;
        gearContainer.innerHTML = "";
        toolContainer.innerHTML = "";
        items.forEach(item => {
            const button = document.createElement("button");
            button.className = "btn btn-sm btn-outline-secondary";
            button.innerHTML = `${item.name}<br><small>${Object.entries(item.cost).map(([r, a]) => `${r}: ${a}`).join("<br>")}${item.used_for ? `<br>used for: ${item.used_for}` : ''}</small>`;
            button.onclick = () => attemptCraft(item, resources);
            if (item.type === 'gear') gearContainer.appendChild(button);
            else if (item.type === 'tool') toolContainer.appendChild(button);
        });
    }

    function normalizeItemKey(name) {
        return name.toLowerCase().replace(/ /g, '_');
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
        for (const [res, amt] of Object.entries(item.cost)) resources[res] -= amt;
        const itemKey = normalizeItemKey(item.name);
        resources[itemKey] = (resources[itemKey] || 0) + 1;
        updateResourceDisplay(resources, toolsInUse);
        saveProgress();
    }
})();