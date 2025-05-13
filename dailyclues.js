const now = new Date();
const cacheKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
const url = `daily_clue_progression.json?v=${cacheKey}`; // changes hourly

let showCompleted = false;
const toggleBtn = document.getElementById('toggle-completed-btn');
const container = document.getElementById('daily-clue-container');
const summaryContainer = document.getElementById('daily-clue-summary');

let clueData = [];
const startingClueCount = {
  easy: 0,
  medium: 0,
  hard: 450
};

// Toggle show/hide completed days
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    showCompleted = !showCompleted;
    toggleBtn.textContent = showCompleted ? 'Hide Completed Days' : 'Show Completed Days';
    renderCards();
  });
}

fetch(url)
  .then(response => response.json())
  .then(data => {
    // Ensure each entry has the new clue fields
    clueData = data.map(entry => ({
      ...entry,
      done_easy: entry.done_easy || 0,
      done_medium: entry.done_medium || 0,
      done_hard: entry.done_hard || 0
    }));
    renderCards();
  })
  .catch(err => {
    console.error('Failed to load daily_clue_progression.json', err);
  });

function renderCards() {
  container.innerHTML = '';
  summaryContainer.innerHTML = '';

  let completed = { easy: 0, medium: 0, hard: 0 };

  // Sum clues from completed entries
  clueData.forEach(entry => {
    if (entry.status) {
      completed.easy += entry.done_easy;
      completed.medium += entry.done_medium;
      completed.hard += entry.done_hard;
    }
  });

  const totalCluesDone = startingClueCount.easy + startingClueCount.medium + startingClueCount.hard + completed.easy + completed.medium + completed.hard;
  const cluesLeft = 2350 - totalCluesDone;

  const totalDisplay = document.createElement('div');
  totalDisplay.className = 'alert alert-info fw-bold text-center';
  totalDisplay.textContent = `Total Clues Completed: ${totalCluesDone} / 2350 | Clues Left: ${cluesLeft}`;
  summaryContainer.appendChild(totalDisplay);

  clueData.forEach(entry => {
    if (!showCompleted && entry.status) return;

    const card = document.createElement('div');
    card.className = 'col';

    const cardInner = document.createElement('div');
    cardInner.className = `card shadow-sm border ${entry.status ? 'border-success' : 'border-warning'}`;

    const doneToday = entry.done_easy + entry.done_medium + entry.done_hard;

    cardInner.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${entry.date}</h5>
        <p class="card-text mb-1">Target: ${entry.target} clues</p>
        <p class="card-text mb-1">Done Today: ${doneToday}</p>
        <p class="card-text mb-1">Easy: ${entry.done_easy} | Medium: ${entry.done_medium} | Hard: ${entry.done_hard}</p>
        <p class="card-text mb-1">Counter: ${entry.counter}</p>
        <span class="badge ${entry.status ? 'bg-success' : 'bg-secondary'}">
          ${entry.status ? 'Completed' : 'Incomplete'}
        </span>
      </div>
    `;

    card.appendChild(cardInner);
    container.appendChild(card);
  });
}