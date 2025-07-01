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

  if (typeof resources === "object") {
  Object.keys(resources).forEach(k => delete resources[k]);
  }
  if (typeof goldDisplay === "object") {
    goldDisplay.textContent = 0;
  }

  localStorage.setItem("resetting", "true");
  location.reload();
}