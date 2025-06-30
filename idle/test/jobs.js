let jobs = {};  // Make this accessible globally

function loadJobsAndStartGame() {
  fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
      jobs = data.jobs;
      startGame();  // Call this once when data is ready
    })
    .catch(error => {
      console.error("Failed to load game_data.json:", error);
    });
}

function startGame() {
  // Kick off the actual game logic
  initializeGame();           // your game setup (probably in idlegame.js)
  updateUI();                 // refresh everything
  setInterval(applyJobTick, 1000);
}

// Call loader once DOM is ready
document.addEventListener("DOMContentLoaded", loadJobsAndStartGame);