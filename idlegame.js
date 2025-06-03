(function () {
  const goldKey = 'idle_gold';
  const workersKey = 'idle_workers';
  const assignmentsKey = 'idle_assignments';

  const tasks = [
    { id: 'fishing', name: '🎣 Fishing', rate: 5 },
    { id: 'mining', name: '⛏️ Mining', rate: 8 },
    { id: 'woodcutting', name: '🪓 Woodcutting', rate: 4 },
    { id: 'cooking', name: '🍳 Cooking', rate: 3 },
    { id: 'thieving', name: '🕵️ Thieving', rate: 6 }
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
  setInterval(() => {
    tasks.forEach(task => {
      gold += assignments[task.id] * task.rate;
    });
    updateUI();
    saveProgress();
  }, 1000);

  updateUI();
})();