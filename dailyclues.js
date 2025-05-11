fetch('daily_clue_progression.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('daily-clue-container');
    container.innerHTML = '';

    data.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'col';

      const cardInner = document.createElement('div');
      cardInner.className = `card shadow-sm border ${
        entry.status ? 'border-success' : 'border-warning'
      }`;

      cardInner.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${entry.date}</h5>
          <p class="card-text mb-1">Target: ${entry.target} clues</p>
          <p class="card-text mb-1">Done Today: ${entry.done_today}</p>
          <p class="card-text mb-1">Clues Left: ${entry.clues_left}</p>
          <p class="card-text mb-1">Counter: ${entry.counter}</p>
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