// gamestate.js — loading, saving, and resetting

window.GameState = {
  workers: 0,
  assignments: {},
  toolsInUse: {},
  resources: JSON.parse(localStorage.getItem("idle_resources") || "{}"),
  workersKey: "idle_workers",
  assignmentsKey: "idle_assignments",

  loadProgress() {
    this.workers = parseInt(localStorage.getItem(this.workersKey)) || 0;
    this.assignments = JSON.parse(localStorage.getItem(this.assignmentsKey) || '{}');
    if (typeof this.resources.gold !== "number") {
      this.resources.gold = this.workers === 0 ? 10 : 0;
    }
  },

  saveProgress() {
    localStorage.setItem("idle_gold", this.resources.gold);
    localStorage.setItem(this.workersKey, this.workers);
    localStorage.setItem(this.assignmentsKey, JSON.stringify(this.assignments));
    localStorage.setItem("idle_resources", JSON.stringify(this.resources));
  },

  getIdleWorkers() {
    return this.workers - Object.values(this.assignments).reduce((a, b) => a + b, 0);
  }
};

window.resetProgress = function() {
  localStorage.setItem("resetting", "true");
  location.reload();
};