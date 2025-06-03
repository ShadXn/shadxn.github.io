(function () {
  const goldKey = 'idle_gold';
  const workersKey = 'idle_workers';

  let workers = parseInt(localStorage.getItem(workersKey));
  if (isNaN(workers)) workers = 0;

  let gold = parseInt(localStorage.getItem(goldKey));
  if (isNaN(gold)) gold = (workers === 0) ? 100 : 0;

  let workerCost = 10 * Math.pow(2, workers);

  const goldDisplay = document.getElementById('gold-count');
  const workerDisplay = document.getElementById('worker-count');
  const costDisplay = document.getElementById('worker-cost');
  const buyButton = document.getElementById('buy-worker');

  function updateUI() {
    goldDisplay.textContent = gold;
    workerDisplay.textContent = workers;
    costDisplay.textContent = workerCost;
  }

  function saveProgress() {
    localStorage.setItem(goldKey, gold);
    localStorage.setItem(workersKey, workers);
  }

  buyButton.addEventListener('click', () => {
    if (gold >= workerCost) {
      gold -= workerCost;
      workers += 1;
      workerCost = 10 * Math.pow(2, workers);
      updateUI();
      saveProgress();
    }
  });

  // Passive gold income
  setInterval(() => {
    gold += workers;
    updateUI();
    saveProgress();
  }, 1000);

  updateUI();
})();