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
    versionButton.textContent = "Try Official Version 0.2";
    versionButton.href = "https://shadxn.github.io/idle/";
  } else {
    titleElement.textContent = "Idle Worker - Version 0.2";
    versionButton.textContent = "Try Test Version 0.21";
    versionButton.href = "https://shadxn.github.io/idle/test/";
  }
});

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