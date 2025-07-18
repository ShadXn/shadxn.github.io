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
  elite: 50,
  master: 2
};

const clueTargets = {
  easy: 1000,
  medium: 1000,
  hard: 300,
  elite: 50,
  master: 0
};
const totalTargetClues = clueTargets.easy + clueTargets.medium + clueTargets.hard + clueTargets.elite + clueTargets.master;

const clueDurations = {
  easy: 5,     // minutes
  medium: 8,   // minutes
  hard: 20     // minutes
};

const extraDurations = {
  lms: 7,         // minutes per LMS point (example)
  chompy: 0.35     // minutes per Chompy bird kill
};

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
      done_hard: entry.done_hard || 0,
      done_elite: entry.done_elite || 0,
      done_master: entry.done_master || 0
    }));

    // Get LMS and Chompy values from HTML safely
    const lmsProgressRaw = document.getElementById("lms-progress")?.textContent || "0/0";
    const chompyProgressRaw = document.getElementById("chompy-progress")?.textContent || "0/0";

    const [lmsCurrent, lmsTotal] = lmsProgressRaw.split("/").map(x => parseInt(x) || 0);
    const [chompyCurrent, chompyTotal] = chompyProgressRaw.split("/").map(x => parseInt(x) || 0);

    const lmsHours = ((lmsTotal - lmsCurrent) * extraDurations.lms) / 60;
    const chompyHours = ((chompyTotal - chompyCurrent) * extraDurations.chompy) / 60;

    const lmsCell = document.getElementById("lms-hours");
    const chompyCell = document.getElementById("chompy-hours");

    if (lmsCell) lmsCell.textContent = lmsHours > 0 ? Math.round(lmsHours) : "";
    if (chompyCell) chompyCell.textContent = chompyHours > 0 ? Math.round(chompyHours) : "";


    renderCards();

    // ✅ Update total hours after everything is rendered
    if (typeof updateTotalHours === 'function') {
      updateTotalHours();
    }
  })
  .catch(err => {
    console.error('Failed to load daily_clue_progression.json', err);
  });

function renderCards() {
  container.innerHTML = '';
  summaryContainer.innerHTML = '';

  let completed = { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };

  clueData.forEach(entry => {
    if (entry.status) {
      completed.easy += entry.done_easy;
      completed.medium += entry.done_medium;
      completed.hard += entry.done_hard;
      completed.elite += entry.done_elite;
      completed.master += entry.done_master;
    }
  });

  const totalCluesDone = startingClueCount.easy + startingClueCount.medium + startingClueCount.hard + startingClueCount.elite + startingClueCount.master +
    completed.easy + completed.medium + completed.hard + completed.elite + completed.master;
  const cluesLeft = totalTargetClues - totalCluesDone;

  const summaryRow = document.createElement('div');
  summaryRow.className = 'alert alert-info text-center';
  summaryRow.innerHTML = `
    <div class="row text-center">
      <div class="col-md-6 border-end">
        <div class="fw-bold">Total Clues Completed: ${totalCluesDone} / ${totalTargetClues}</div>
        <div class="small">(${startingClueCount.easy + completed.easy} Easy | ${startingClueCount.medium + completed.medium} Medium | ${startingClueCount.hard + completed.hard} Hard | ${startingClueCount.elite + completed.elite} Elite | ${startingClueCount.master + completed.master} Master)</div>
      </div>
      <div class="col-md-6">
        <div class="fw-bold">Total Clues Left: ${cluesLeft}</div>
        <div class="small">(${clueTargets.easy - (startingClueCount.easy + completed.easy)} Easy | ${clueTargets.medium - (startingClueCount.medium + completed.medium)} Medium | ${clueTargets.hard - (startingClueCount.hard + completed.hard)} Hard | ${clueTargets.elite - (startingClueCount.elite + completed.elite)} Elite | ${clueTargets.master - (startingClueCount.master + completed.master)} Master)</div>
      </div>
    </div>
  `;

  summaryContainer.appendChild(summaryRow);

    // Update clue caskets and hours
    document.getElementById("easy-casket").textContent = `${startingClueCount.easy + completed.easy}/1000`;
    document.getElementById("medium-casket").textContent = `${startingClueCount.medium + completed.medium}/1000`;
    document.getElementById("hard-casket").textContent = `${startingClueCount.hard + completed.hard}/300`;
    document.getElementById("elite-casket").textContent = `${startingClueCount.elite + completed.elite}/50`;
    document.getElementById("master-casket").textContent = `${startingClueCount.master + completed.master}/0`;

    const easyHours = Math.round((clueTargets.easy - (startingClueCount.easy + completed.easy)) * clueDurations.easy / 60);
    document.getElementById("easy-casket-hours").textContent = easyHours > 0 ? easyHours : "";

    const mediumHours = Math.round((clueTargets.medium - (startingClueCount.medium + completed.medium)) * clueDurations.medium / 60);
    document.getElementById("medium-casket-hours").textContent = mediumHours > 0 ? mediumHours : "";

    const hardHours = Math.round((clueTargets.hard - (startingClueCount.hard + completed.hard)) * clueDurations.hard / 60);
    document.getElementById("hard-casket-hours").textContent = hardHours > 0 ? hardHours : "";

  
  let runningTotal = startingClueCount.easy + startingClueCount.medium + startingClueCount.hard + startingClueCount.elite + startingClueCount.master;

  clueData.forEach(entry => {
    const doneToday = entry.done_easy + entry.done_medium + entry.done_hard + entry.done_elite + entry.done_master;
  
    // Use target value **only** if no progress made that day
    const countToday = (doneToday > 0 || entry.status) ? doneToday : entry.target || 0;
  
    runningTotal += countToday;
    const remaining = totalTargetClues - runningTotal;
  
    // Only skip rendering
    if (!showCompleted && entry.status) return;

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
          <span class="badge bg-light text-dark">Elite: ${entry.done_elite}</span>
          <span class="badge bg-light text-dark">Master: ${entry.done_master}</span>
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