let jobs = {};  // Make this accessible globally

function loadJobsAndStartGame() {
  fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
      jobs = data.jobs;
      window.startGame();  // explicitly access global function
    })
    .catch(error => {
      console.error("Failed to load game_data.json:", error);
    });
}

// Call loader once DOM is ready
document.addEventListener("DOMContentLoaded", loadJobsAndStartGame);
