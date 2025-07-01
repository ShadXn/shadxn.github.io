// settings.js
window.hardResetGame = function () {
  if (!confirm("Are you sure you want to reset all progress?")) return;

  localStorage.clear(); // or selectively clear keys if needed

  // Optionally reload the page to reset all game state
  location.reload();
};