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

  // Clear localStorage keys
  const keysToClear = [
    "idle_assignments",
    "idle_resources",
    "idle_workers",
    "idle_gold",
    "undefined"
  ];
  keysToClear.forEach(key => localStorage.removeItem(key));

  // ALSO clear in-memory values if defined
  if (typeof resources === "object") {
    Object.keys(resources).forEach(key => delete resources[key]);
  }
  if (typeof assignments === "object") {
    Object.keys(assignments).forEach(key => delete assignments[key]);
  }
  if (typeof tasks === "object") {
    Object.keys(tasks).forEach(key => delete tasks[key]);
  }
  if (typeof gearData === "object") {
    Object.keys(gearData).forEach(key => delete gearData[key]);
  }
  if (typeof toolData === "object") {
    Object.keys(toolData).forEach(key => delete toolData[key]);
  }
  if (typeof goldDisplay === "object") {
    goldDisplay.textContent = 0;
  }
  if (typeof workers !== "undefined") {
    workers = 0;
  }

  // location.reload();  // Refresh the page to reload clean state
}