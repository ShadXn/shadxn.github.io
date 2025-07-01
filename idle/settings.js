// settings.js
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    if (key === undefined || key === "undefined") {
        console.warn("⚠️ localStorage.setItem called with undefined key!", value);
        console.trace();  // Show call stack in dev console
    }
    return originalSetItem.apply(this, arguments);
};

function hardResetGame() {
  if (!confirm("Are you sure you want to reset all progress?")) return;

  console.log("All localStorage keys:", Object.keys(localStorage));

  // Clear all related idle game data from localStorage
  // Clear localStorage
  localStorage.removeItem("idle_gold");
  localStorage.removeItem("idle_workers");
  localStorage.removeItem("idle_assignments");
  localStorage.removeItem("idle_resources");

  // Clear in-memory values
  if (typeof resources === "object") {
    for (const key in resources) {
      delete resources[key];
    }
  }

  if (typeof assignments === "object") {
    for (const key in assignments) {
      delete assignments[key];
    }
  }

  if (typeof tasks === "object") {
    for (const key in tasks) {
      delete tasks[key];
    }
  }

  if (typeof gearData === "object") {
    for (const key in gearData) {
      delete gearData[key];
    }
  }

  if (typeof toolData === "object") {
    for (const key in toolData) {
      delete toolData[key];
    }
  }

  if (typeof workers !== "undefined") {
    workers = 0;
  }

  if (typeof goldDisplay === "object") {
    goldDisplay.textContent = 0;
  }

  if (typeof workerDisplay === "object") {
    workerDisplay.textContent = 0;
  }

  if (typeof idleDisplay === "object") {
    idleDisplay.textContent = 0;
  }

  // Force UI to refresh if needed (optional)
  updateResourceDisplay(resources);
  updateWorkerDisplay();

  // location.reload();  // Refresh the page to reload clean state
}