const now = new Date();
const cacheKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
const url = `daily_clue_progression.json?v=${cacheKey}`; // changes hourly

let showCompleted = false;
let showBreakdown = false;
const toggleBtn = document.getElementById('toggle-completed-btn');
const breakdownBtn = document.getElementById('toggle-breakdown-btn');
const container = document.getElementById('daily-clue-container');
const summaryContainer = document.getElementById('daily-clue-summary');

let clueData = [];
const startingClueCount = {
  easy: 200,
  medium: 150,
  hard: 120,
  elite: 50
};

const clueTargets = {
  easy: 1000,
  medium: 1000,
  hard: 300,
  elite: 50
};
const totalTargetClues = clueTargets.easy + clueTargets.medium + clueTargets.hard + clueTargets.elite;

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    showCompleted = !showCompleted;
    toggleBtn.textContent = showCompleted ? 'Hide Completed Days' : 'Show Completed Days';
    renderCards();
  });
}

if (breakdownBtn) {
  breakdownBtn.addEventListener('click', () => {
    showBreakdown = !showBreakdown;
    breakdownBtn.textContent = showBreakdown ? 'Hide More Info' : 'Show More Info';
    renderCards();
  });
}

fetch(url)
  .then(response => response.json())
  .then(data => {
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

  clueData.forEach(entry => {
    if (entry.status) {
      completed.easy += entry.done_easy;
      completed.medium += entry.done_medium;
      completed.hard += entry.done_hard;
    }
  });

  const totalCluesDone = startingClueCount.easy + startingClueCount.medium + startingClueCount.hard + completed.easy + completed.medium + completed.hard;
  const cluesLeft = totalTargetClues - totalCluesDone;

  const summaryRow = document.createElement('div');
  summaryRow.className = 'alert alert-info text-center';
  summaryRow.innerHTML = `
    <div class="fw-bold">Total Clues Completed: ${totalCluesDone} / ${totalTargetClues}</div>
    <div class="small">(${startingClueCount.easy + completed.easy} Easy | ${startingClueCount.medium + completed.medium} Medium | ${startingClueCount.hard + completed.hard} Hard)</div>
    <hr>
    <div class="fw-bold">Total Clues Left: ${cluesLeft}</div>
    <div class="small">(${clueTargets.easy - (startingClueCount.easy + completed.easy)} Easy | ${clueTargets.medium - (startingClueCount.medium + completed.medium)} Medium | ${clueTargets.hard - (startingClueCount.hard + completed.hard)} Hard)</div>
  `;

  summaryContainer.appendChild(summaryRow);

  let runningTotal = startingClueCount.easy + startingClueCount.medium + startingClueCount.hard;

  clueData.forEach(entry => {
    const doneToday = entry.done_easy + entry.done_medium + entry.done_hard;

    const tempRunningTotal = runningTotal + doneToday;
    const remaining = totalTargetClues - tempRunningTotal;

    if (!showCompleted && entry.status) return;

    runningTotal += doneToday;

    const card = document.createElement('div');
    card.className = 'col';

    const cardInner = document.createElement('div');
    cardInner.className = `card shadow-sm border ${entry.status ? 'border-success' : 'border-warning'}`;

    cardInner.innerHTML = `
      <div class="card-body position-relative">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="card-title mb-0">${entry.date}</h5>
          <span class="badge ${entry.status ? 'bg-success' : 'bg-secondary'}">
            ${entry.status ? 'Completed' : 'Incomplete'}
          </span>
        </div>

        <div class="d-flex justify-content-between">
          <p class="card-text mb-1"><strong>Target:</strong> ${entry.target} clues</p>
          <p class="card-text mb-1"><strong>Done Today:</strong> ${doneToday}</p>
        </div>

        ${showBreakdown ? `
        <hr class="my-2">
        <div class="d-flex gap-2 flex-wrap mb-2">
          <span class="badge bg-light text-dark">Easy: ${entry.done_easy}</span>
          <span class="badge bg-light text-dark">Medium: ${entry.done_medium}</span>
          <span class="badge bg-light text-dark">Hard: ${entry.done_hard}</span>
        </div>
        ` : ''}

        <hr class="my-2">

        <div class="d-flex justify-content-between">
          <p class="card-text mb-1"><strong>Total Done:</strong> ${runningTotal}</p>
          <p class="card-text mb-1"><strong>Total Left:</strong> ${remaining}</p>
        </div>

        ${showBreakdown ? `<hr class="my-2"><p class="card-text mb-1">Day Counter: ${entry.counter}</p>` : ''}
      </div>
    `;

    card.appendChild(cardInner);
    container.appendChild(card);
  });
}