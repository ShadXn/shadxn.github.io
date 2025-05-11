const now = new Date();
const cacheKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
const url = `daily_clue_progression.json?v=${cacheKey}`; // changes hourly

let showCompleted = false;
const toggleBtn = document.getElementById('toggle-completed-btn');
const container = document.getElementById('daily-clue-container');
const summaryContainer = document.getElementById('daily-clue-summary');

toggleBtn.addEventListener('click', () => {
  showCompleted = !showCompleted;
  toggleBtn.textContent = showCompleted ? 'Hide Completed' : 'Show Completed';
  renderCards(); // re-render with updated toggle state
});

let clueData = [];

fetch(url)
  .then(response => response.json())
  .then(data => {
    clueData = data;
    renderCards();
  })
  .catch(err => {
    console.error('Failed to load daily_clue_progression.json', err);
  });

function renderCards() {
  container.innerHTML = '';
  summaryContainer.innerHTML = '';

  // Find latest completed entry for total
  let latestCompletedTotal = 0;
  for (let i = clueData.length - 1; i >= 0; i--) {
    if (clueData[i].status) {
      latestCompletedTotal = clueData[i].total_clues;
      break;
    }
  }

  const totalDisplay = document.createElement('div');
  totalDisplay.className = 'alert alert-info fw-bold text-center';
  totalDisplay.textContent = `Total Clues Completed: ${latestCompletedTotal} / 2350`;
  summaryContainer.appendChild(totalDisplay);

  clueData.forEach(entry => {
    if (!showCompleted && entry.status) return;

    const card = document.createElement('div');
    card.className = 'col';

    const cardInner = document.createElement('div');
    cardInner.className = `card shadow-sm border ${entry.status ? 'border-success' : 'border-warning'}`;

    cardInner.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${entry.date}</h5>
        <p class="card-text mb-1">Target: ${entry.target} clues</p>
        <p class="card-text mb-1">Done Today: ${entry.done_today}</p>
        <p class="card-text mb-1">Clues Left: ${entry.clues_left}</p>
        <p class="card-text mb-1">Counter: ${entry.counter}</p>
        <p class="card-text mb-1"><strong>Total Clues Done:</strong> ${entry.total_clues}</p>
        <span class="badge ${entry.status ? 'bg-success' : 'bg-secondary'}">
          ${entry.status ? 'Completed' : 'Incomplete'}
        </span>
      </div>
    `;

    card.appendChild(cardInner);
    container.appendChild(card);
  });
}