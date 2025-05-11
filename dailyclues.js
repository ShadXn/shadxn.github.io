document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("daily-clue-container");
  
    const startDate = new Date("2025-05-02");
    const targetClues = 2350;
    const currentClues = 633;
    const dailyGoal = 50;
  
    const totalDays = Math.ceil((targetClues - currentClues) / dailyGoal);
    let clueCounter = currentClues;
  
    for (let i = 0; i < totalDays; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
  
      const dateStr = day.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
  
      const targetCluesToday = clueCounter + dailyGoal;
      const card = document.createElement("div");
      card.className = "card mb-3 shadow-sm";
  
      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${dateStr}</h5>
          <p class="card-text mb-1">Daily Goal: ${dailyGoal} clues</p>
          <p class="card-text mb-1">Target Clue Count: ${targetCluesToday}</p>
          <p class="card-text text-muted small">Progress: ${clueCounter}/${targetClues}</p>
        </div>
      `;
  
      container.appendChild(card);
      clueCounter += dailyGoal;
    }
  });  