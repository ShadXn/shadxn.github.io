// Calculate remaining hours
function updateTotalHours() {
  let totalHours = 0;

  document.querySelectorAll("table tbody tr").forEach(row => {
    const cell = row.cells[0];
    if (!cell) return;

    const value = parseFloat(cell.textContent.trim());
    if (!isNaN(value)) {
      totalHours += value;
    }
  });

  const hoursLeftCell = document.getElementById("hours-left");
  if (hoursLeftCell) {
    hoursLeftCell.textContent = Math.round(totalHours);
  }
}

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

  return { totalWithClue, totalWithoutClue };
}

updateClogTotals();

function updateClogEstimates() {
  const { totalWithClue, totalWithoutClue } = updateClogTotals();

  let estimatedClueTotal = 0;

  // Loop through all rows to sum data-estimate on clue rows
  const rows = document.querySelectorAll("table tbody tr");

  rows.forEach(row => {
    const taskName = row.cells[1]?.textContent.toLowerCase() || "";
    const clogCell = row.cells[2];

    if (!clogCell || !taskName.includes("clue")) return;

    const estimate = parseInt(clogCell.getAttribute("data-estimate")) || 0;
    estimatedClueTotal += estimate;
  });

  const currentLog = parseInt(document.getElementById("clog-current").textContent) || 0;

  // ✅ Just add everything up directly
  const estimatedFinalTotal = currentLog + totalWithoutClue + estimatedClueTotal;

  document.getElementById("clogs-total").textContent = estimatedFinalTotal;
}

updateClogEstimates();