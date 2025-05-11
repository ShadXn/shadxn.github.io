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
  const statusCell = row.cells[2];
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
