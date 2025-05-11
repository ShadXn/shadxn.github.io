fetch('bank.txt')
  .then(response => response.text())
  .then(text => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t');
    const casketNames = [
      "Reward casket (easy)",
      "Reward casket (medium)",
      "Reward casket (hard)",
      "Reward casket (elite)",
      "Reward casket (master)"
    ];

    const list = document.getElementById('casket-list');

    lines.slice(1).forEach(line => {
      const parts = line.split('\t');
      const item = {
        item_id: parts[0],
        item_name: parts[1],
        item_quantity: parts[2]
      };

      if (casketNames.includes(item.item_name)) {
        const li = document.createElement('li');
        li.textContent = `${item.item_name}: ${item.item_quantity} (ID: ${item.item_id})`;
        list.appendChild(li);
      }
    });
  })
  .catch(err => {
    console.error("Failed to load bank.txt", err);
  });