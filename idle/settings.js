// settings.js
function hardResetGame() {
  if (!confirm("Are you sure you want to reset all progress?")) return;

  console.log("All localStorage keys:", Object.keys(localStorage));

  const keysToClear = [
    "idle_assignments",
    "idle_resources",
    "idle_workers",
    "undefined"  // this key seems unintentional, but clear it anyway
  ];
  keysToClear.forEach(key => localStorage.removeItem(key));
  location.reload();  // Refresh the page to reload clean state
}