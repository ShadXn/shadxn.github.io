function initGame() {

    let jobs = {};

    fetch('game_data.json')
    .then(response => response.json())
    .then(data => {
        jobs = data.jobs;
        initGame();  // only start game loop after jobs are loaded
    });
    // Place your `setInterval`, `applyJobTick()`, `updateUI()` calls here

    setInterval(applyJobTick, 1000);
    updateUI();
}