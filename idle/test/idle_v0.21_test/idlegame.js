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
        GameState.loadProgress();  // This handles loading all state
        tasks.forEach(task => { if (!(task.id in assignments)) assignments[task.id] = 0; });

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
            recipe: document.getElementById("recipe-display")
        });

        updateUI();
        CraftingUI.showCraftingSection(buildCraftables(gearData, toolData), GameState.resources, GameState.toolsInUse);
        populateJobs(jobs);
        setInterval(() => applyJobTick(GameState.assignments, tasks, jobs, GameState.resources, GameState.toolsInUse), 1000);
    }

    // GameState object to manage game state

    GameState.getIdleWorkers = function () {
    return GameState.workers - Object.values(GameState.assignments).reduce((a, b) => a + b, 0);
    };

    function updateUI() {
        goldDisplay.textContent = GameState.resources.gold;
        workerDisplay.textContent = GameState.workers;
        idleDisplay.textContent = GameState.getIdleWorkers();
        costDisplay.textContent = workerCost;
        buyBtn.disabled = GameState.resources.gold < workerCost;
        tasks.forEach(task => {
            const countSpan = document.getElementById(`count-${task.id}`);
            if (countSpan) countSpan.textContent = GameState.assignments[task.id];
        });
    }

    GameState.saveProgress = function() {
        localStorage.setItem("idle_gold", GameState.resources.gold);
        localStorage.setItem(GameState.workersKey, GameState.workers);
        localStorage.setItem(GameState.assignmentsKey, JSON.stringify(GameState.assignments));
        localStorage.setItem("idle_resources", JSON.stringify(GameState.resources));
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
            minusBtn.onclick = () => { if (GameState.assignments[jobId] > 0) { GameState.assignments[jobId]--; updateUI(); GameState.saveProgress(); } };
            plusBtn.onclick = () => { if (GameState.getIdleWorkers() > 0) {
                GameState.assignments[jobId] = (GameState.assignments[jobId] || 0) + 1;
                updateUI();
                GameState.saveProgress();
            } };

            card.appendChild(header);
            card.appendChild(details);
            card.appendChild(controls);
            taskList.appendChild(card);
        });
    }
})();