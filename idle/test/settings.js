// settings.js
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    if (key === undefined || key === "undefined") {
        console.warn("⚠️ localStorage.setItem called with undefined key!", value);
        console.trace();  // Show call stack in dev console
    }
    return originalSetItem.apply(this, arguments);
};

document.addEventListener("DOMContentLoaded", () => {
  const isTestVersion = window.location.pathname.includes("/idle/test/");

  const titleElement = document.getElementById("game-title");
  const versionButton = document.getElementById("version-button");

  if (isTestVersion) {
    titleElement.textContent = "Idle Worker - Test Version 0.21";
    versionButton.textContent = "Try Official Version 0.21";
    versionButton.href = "https://shadxn.github.io/idle/";
  } else {
    titleElement.textContent = "Idle Worker - Version 0.21";
    versionButton.textContent = "Try Test Version 0.21";
    versionButton.href = "https://shadxn.github.io/idle/test/";
  }
});

// Clean up localStorage by removing unused keys
function cleanLocalStorage(whitelist) {
  const allKeys = Object.keys(localStorage);
  const keysToRemove = allKeys.filter(key => !whitelist.includes(key));

  keysToRemove.forEach(key => {
    console.log(`🧹 Removing unused localStorage key: ${key}`);
    localStorage.removeItem(key);
  });
}

function hardResetGame() {
  if (!confirm("Are you sure you want to reset all progress?")) return;

  console.log("All localStorage keys:", Object.keys(localStorage));

  localStorage.removeItem("idle_workers");
  localStorage.removeItem("idle_assignments");
  localStorage.removeItem("idle_resources");

  // 🔁 Also reset the in-memory game state
  if (window.GameState) {
    GameState.workers = 0;
    GameState.assignments = {};
    GameState.resources = {};
    GameState.toolsInUse = {};
  }

  localStorage.setItem("resetting", "true");
  location.reload();
}