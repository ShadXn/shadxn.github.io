const now = new Date();
const cacheKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
const url = `daily_clue_progression.json?v=${cacheKey}`; // changes every hour

fetch(url)
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('daily-clue-container');
    const summaryContainer = document.getElementById('daily-clue-summary');

    container.innerHTML = '';
    summaryContainer.innerHTML = '';

    // Find latest completed entry
    let latestCompletedTotal = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].status) {
        latestCompletedTotal = data[i].total_clues;
        break;
      }
    }

    const totalDisplay = document.createElement('div');
    totalDisplay.className = 'alert alert-info fw-bold text-center';
    totalDisplay.textContent = `Total Clues Completed: ${latestCompletedTotal} / 2350`;

    summaryContainer.appendChild(totalDisplay);

    data.forEach(entry => {
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
  })
  .catch(err => {
    console.error('Failed to load daily_clue_progression.json', err);
  });