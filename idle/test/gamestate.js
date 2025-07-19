// gamestate.js — loading, saving, and resetting

window.GameState = {
  workers: 0,
  assignments: {},
  toolsInUse: {},
  jobTimers: {}, // Track job timers
  resources: JSON.parse(localStorage.getItem("idle_resources") || "{}"),
  workersKey: "idle_workers",
  assignmentsKey: "idle_assignments",
  jobCompletionKey: "job_completion_count",
  jobCompletionCount: JSON.parse(localStorage.getItem("job_completion_count") || '{}'),


  loadProgress() {
    this.workers = parseInt(localStorage.getItem(this.workersKey)) || 0;
    this.assignments = JSON.parse(localStorage.getItem(this.assignmentsKey) || '{}');
    this.jobCompletionCount = JSON.parse(localStorage.getItem(this.jobCompletionKey) || '{}');
    this.jobTimers = {}; // Reset job timers
    if (typeof this.resources.gold !== "number") {
      this.resources.gold = this.workers === 0 ? 10 : 0;
    }
  },

  saveProgress() {
    localStorage.setItem(this.workersKey, this.workers);
    localStorage.setItem(this.assignmentsKey, JSON.stringify(this.assignments));
    localStorage.setItem("idle_resources", JSON.stringify(this.resources));
    localStorage.setItem(this.jobCompletionKey, JSON.stringify(this.jobCompletionCount));
  },

  getIdleWorkers() {
    return this.workers - Object.values(this.assignments).reduce((a, b) => a + b, 0);
  },

  incrementJobCount(jobId) {
    if (!this.jobCompletionCount[jobId]) {
      this.jobCompletionCount[jobId] = 0;
    }
    this.jobCompletionCount[jobId]++;
    localStorage.setItem(this.jobCompletionKey, JSON.stringify(this.jobCompletionCount));
  }


};

window.resetProgress = function() {
  localStorage.setItem("resetting", "true");
  location.reload();
};


GameState.getTotalJobCompletions = function() {
  return Object.values(this.jobCompletionCount || {}).reduce((sum, val) => sum + val, 0);
};