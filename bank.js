fetch('bank.txt')
  .then(response => response.text())
  .then(text => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t');
    const casketTargets = {
      "Reward casket (easy)": { id: "easy-casket", max: 1000 },
      "Reward casket (medium)": { id: "medium-casket", max: 1000 },
      "Reward casket (hard)": { id: "hard-casket", max: 300 },
      "Reward casket (elite)": { id: "elite-casket", max: 50 },
      "Reward casket (master)": { id: "master-casket", max: 0}
    };

    lines.slice(1).forEach(line => {
      const parts = line.split('\t');
      const item = {
        item_id: parts[0],
        item_name: parts[1],
        item_quantity: parts[2]
      };

      const target = casketTargets[item.item_name];
      if (target) {
        // Update table cell with current/target
        const cell = document.getElementById(target.id);
        if (cell) {
          cell.textContent = `${item.item_quantity}/${target.max}`;
        }
      }
    });
  })
  .catch(err => {
    console.error("Failed to load bank.txt", err);
  });

  // After processing caskets...

// Calculate remaining hours
let totalHours = 0;
document.querySelectorAll("table tbody tr").forEach(row => {
  const statusCell = row.cells[3];
  const hourCell = row.cells[0];
  
  if (statusCell && hourCell) {
    const isIncomplete = statusCell.textContent.includes("❌");
    const hours = parseFloat(hourCell.textContent) || 0;
    
    if (isIncomplete && hours > 0) {
      totalHours += hours;
    }
  }
});

document.getElementById("hours-left").textContent = totalHours;

function updateClogTotals() {
  let totalWithClue = 0;
  let totalWithoutClue = 0;

  const rows = document.querySelectorAll("table tbody tr");

  rows.forEach(row => {
    const taskName = row.cells[1]?.textContent || "";
    const clogCell = row.cells[2]; // Clog Items column

    if (!clogCell) return;

    const value = parseInt(clogCell.textContent) || 0;
    const isClue = taskName.toLowerCase().includes("clue");

    totalWithClue += value;
    if (!isClue) totalWithoutClue += value;
  });

  document.getElementById("clogs-no-clue").textContent = totalWithoutClue;
  document.getElementById("clogs-with-clue").textContent = totalWithClue;
}

updateClogTotals();

function updateClogEstimates() {
  let totalClogsWithClues = 0;
  let totalClogsNoClues = 0;
  const clueContribution = 0; // We'll read actual clue values from table

  const clueCasketCellIDs = [
    "easy-casket",
    "medium-casket",
    "hard-casket",
    "elite-casket",
    "master-casket"
  ];

  // Optional: define expected clog slots per clue tier (adjust if needed)
  const clueEstimates = {
    "easy-casket": 70,
    "medium-casket": 55,
    "hard-casket": 15,
    "elite-casket": 5,
    "master-casket": 0
  };

  const rows = document.querySelectorAll("table tbody tr");

  rows.forEach(row => {
    const task = row.cells[1]?.textContent || "";
    const clogCell = row.cells[2];
    if (!clogCell) return;

    const clogCount = parseInt(clogCell.textContent) || 0;
    totalClogsWithClues += clogCount;

    if (!task.toLowerCase().includes("clue")) {
      totalClogsNoClues += clogCount;
    }
  });

  // Add clue slot estimates
  let clueTotal = 0;
  clueCasketCellIDs.forEach(id => {
    if (document.getElementById(id)) {
      clueTotal += clueEstimates[id] || 0;
    }
  });

  const currentLog = parseInt(document.getElementById("clog-current").textContent) || 0;
  const estimatedFinalTotal = currentLog + totalClogsNoClues + clueTotal;

  document.getElementById("clogs-no-clue").textContent = totalClogsNoClues;
  document.getElementById("clogs-with-clue").textContent = totalClogsWithClues + clueTotal;
  document.getElementById("clogs-total").textContent = estimatedFinalTotal;
}

updateClogEstimates();