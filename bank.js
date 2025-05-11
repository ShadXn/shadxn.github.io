fetch('bank.json')
  .then(response => response.json())
  .then(data => {
    const list = document.getElementById('casket-list');
    const casketNames = [
      "Reward casket (easy)",
      "Reward casket (medium)",
      "Reward casket (hard)",
      "Reward casket (elite)",
      "Reward casket (master)"
    ];
    data
      .filter(item => casketNames.includes(item.item_name))
      .forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.item_name}: ${item.item_quantity} (ID: ${item.item_id})`;
        list.appendChild(li);
      });
  })
  .catch(error => {
    console.error('Error fetching JSON:', error);
  });
