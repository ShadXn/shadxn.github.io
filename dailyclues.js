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

  let runningTotal = startingClueCount.easy + startingClueCount.medium + startingClueCount.hard;

  clueData.forEach(entry => {
    if (!showCompleted && entry.status) return;

    const doneToday = entry.done_easy + entry.done_medium + entry.done_hard;
    runningTotal += doneToday;
    const remaining = 2350 - runningTotal;

    const card = document.createElement('div');
    card.className = 'col';

    const cardInner = document.createElement('div');
    cardInner.className = `card shadow-sm border ${entry.status ? 'border-success' : 'border-warning'}`;

    cardInner.innerHTML = `
    <div class="card-body position-relative">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h5 class="card-title mb-0">${entry.date}</h5>
        <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#details-${entry.counter}">
          Show Clue Types
        </button>
      </div>
  
      <div class="d-flex justify-content-between">
        <p class="card-text mb-1"><strong>Target:</strong> ${entry.target} clues</p>
        <p class="card-text mb-1"><strong>Done Today:</strong> ${doneToday}</p>
      </div>

      <div class="collapse mb-2" id="details-${entry.counter}">
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge bg-light text-dark">Easy: ${entry.done_easy}</span>
          <span class="badge bg-light text-dark">Medium: ${entry.done_medium}</span>
          <span class="badge bg-light text-dark">Hard: ${entry.done_hard}</span>
        </div>
      </div>
  
      <hr class="my-2">
      
      <div class="d-flex justify-content-between">
        <p class="card-text mb-1"><strong>Total Done:</strong> ${runningTotal}</p>
        <p class="card-text mb-1"><strong>Left:</strong> ${remaining}</p>
      </div>
  
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