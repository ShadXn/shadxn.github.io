// gamestate.js — loading, saving, and resetting
window.GameState = {

  // LocalStorage keys
  ownedWorkersKey: "idle_workers_owned",
  assignmentsKey: "idle_assignments",
  jobCompletionKey: "job_completion_count",
  workerDataKey: "idle_worker_data",
  resourcesKey: "idle_resources",

  // Core data from game_data.json
  baseData: {},
  resources: {},
  recipes: {},
  misc: {},
  gear: {},
  tools: {},
  jobs: {},
  workerTemplate: {},
  skills: {},
  toolParts: [],
  gearParts: [],
  tiers: {},

  // Runtime state
  ownedWorkers: [],
  workerData: {},
  assignments: {},
  toolsInUse: {},
  jobTimers: {},
  jobCompletionCount: {},

  loadProgress() {
    this.resources = JSON.parse(localStorage.getItem(this.resourcesKey) || "{}");
    this.ownedWorkers = JSON.parse(localStorage.getItem(this.ownedWorkersKey) || "[]");
    this.assignments = JSON.parse(localStorage.getItem(this.assignmentsKey) || '{}');
    this.jobCompletionCount = JSON.parse(localStorage.getItem(this.jobCompletionKey) || '{}');
    this.workerData = JSON.parse(localStorage.getItem(this.workerDataKey) || "{}");
    this.jobTimers = {};

    // Load base data from game_data.json
    const template = structuredClone(this.workerTemplate || {});
    console.log("show template:", template);

    // MIGRATION from old version v0.21 and v0.20 using 'idle_workers'
    const legacyWorkerCount = parseInt(localStorage.getItem("idle_workers") || "0");
    if (legacyWorkerCount > 0 && this.ownedWorkers.length === 0) {
      console.warn("Migrating old workers to the new worker system...");
      localStorage.removeItem(this.assignmentsKey);
      this.assignments = {};

      for (let i = 0; i < legacyWorkerCount; i++) {
        const workerId = this.getNextWorkerId();
        const name = `Worker ${i + 1}`;
        const newWorker = this.createNewWorker(workerId, name);

        this.ownedWorkers.push(workerId);
        this.workerData[workerId] = newWorker;
      }

      localStorage.removeItem("idle_workers");
      showToast?.(`Migrated ${this.ownedWorkers.length} old workers to the new worker system. Happy working!`, 12000);
      this.saveProgress();
    }


    // First-time player: Give 1 starter worker
    if (this.ownedWorkers.length === 0) {
      const firstWorkerId = this.getNextWorkerId();  // 'worker_1'
      const template = structuredClone(this.workerTemplate || {});

      this.workerData[firstWorkerId] = {
        ...template,
        id: firstWorkerId,
        name: "Worker 1",
        owned: true,
      };

      this.ownedWorkers.push(firstWorkerId);
      this.resources.gold = 0;

      console.log("🧑‍🌾 Starter worker granted:", firstWorkerId);
      this.saveProgress();
    }


    // Ensure all owned workers are initialized using template
    for (const workerId of this.ownedWorkers) {
      const current = this.workerData[workerId] || {};
      this.workerData[workerId] = {
        ...structuredClone(template),
        ...current,
        id: workerId,
        name: current.name || workerId,
        owned: true,
      };
    }


    console.log("Loaded workers:", this.ownedWorkers);

    // Rebuild jobTimers to ensure workerprogress bars work after refresh of the app
    this.jobTimers = {};
    for (const workerId of this.ownedWorkers) {
        const worker = this.workerData[workerId];
        if (worker?.jobId && !this.jobTimers[worker.jobId]) {
          this.jobTimers[worker.jobId] = { firstWorker: workerId };
        }
    }
  },

  saveProgress() {
    localStorage.setItem(this.ownedWorkersKey, JSON.stringify(this.ownedWorkers));
    localStorage.setItem(this.assignmentsKey, JSON.stringify(this.assignments));
    localStorage.setItem(this.resourcesKey, JSON.stringify(this.resources));
    localStorage.setItem(this.jobCompletionKey, JSON.stringify(this.jobCompletionCount));
    localStorage.setItem(this.workerDataKey, JSON.stringify(this.workerData));
  },

  getIdleWorkers() {
    const assignedCount = Object.values(this.assignments).reduce((a, b) => a + b, 0);
    return this.ownedWorkers.length - assignedCount;
  },

  // Increment job completion count for a specific job and save it to localStorage
  incrementJobCount(jobId) {
    if (!this.jobCompletionCount[jobId]) {
      this.jobCompletionCount[jobId] = 0;
    }
    this.jobCompletionCount[jobId]++;
    localStorage.setItem(this.jobCompletionKey, JSON.stringify(this.jobCompletionCount));
  },

  getTotalJobCompletions(){
    return Object.values(this.jobCompletionCount || {}).reduce((sum, val) => sum + val, 0);
  },

  getNextWorkerId() {
    return `worker_${this.ownedWorkers.length + 1}`;
  },

  getNextWorkerCost() {
    const baseCost = this.workerTemplate?.cost || 100;
    return baseCost * Math.pow(2, this.ownedWorkers.length);
  },

  getAllUnownedWorkers() {
    return Object.keys(this.workerTemplate).filter(id => !this.ownedWorkers.includes(id));
  },

  // Create new worker from template
  createNewWorker(workerId, name) {
    return {
      ...structuredClone(this.workerTemplate || {}),
      id: workerId,
      name: name || `Worker ${workerId.split('_')[1]}`,
      owned: true,
    };
  },

  countEquippedItems(itemKey) {
    let count = 0;
    for (const worker of Object.values(this.workerData)) {
      const equippedItems = [
        ...(Object.values(worker.gear || {})),
        ...(Object.values(worker.tools || {}))
      ];
      equippedItems.forEach(equipped => {
        if (equipped === itemKey) count++;
      });
    }
    return count;
  }
};

window.resetProgress = function() {
  localStorage.setItem("resetting", "true");
  location.reload();
};