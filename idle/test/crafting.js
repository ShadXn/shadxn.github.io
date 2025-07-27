// crafting.js — logic for building and attempting crafts

window.Crafting = window.Crafting || {};

// Build a list of all craftable items
Crafting.buildCraftables = function () {
  const craftables = [];

  for (const tier in GameState.gear) {
    for (const part in GameState.gear[tier]) {
      craftables.push({
        name: `${tier} ${part}`,
        cost: GameState.gear[tier][part].cost,
        type: 'gear'
      });
    }
  }

  for (const tier in GameState.tools) {
    for (const part in GameState.tools[tier]) {
      craftables.push({
        name: `${tier} ${part}`,
        cost: GameState.tools[tier][part].cost,
        type: 'tool'
      });
    }
  }

  for (const key in GameState.misc) {
    craftables.push({
      name: key,
      cost: GameState.misc[key].cost,
      type: 'misc'
    });
  }

  return craftables;
};

// Show the crafting section with all craftable items
Crafting.showCraftingSection = function () {
  const items = Crafting.buildCraftables();
  const resources = GameState.resources;

  const gearContainer = document.getElementById("gear-craft");
  const toolContainer = document.getElementById("tools-craft");
  const miscContainer = document.getElementById("misc-craft");

  if (!gearContainer || !toolContainer || !miscContainer) return;

  gearContainer.innerHTML = "";
  toolContainer.innerHTML = "";
  miscContainer.innerHTML = "";

  items.forEach(item => {
    const button = document.createElement("button");
    button.className = "btn btn-sm btn-outline-secondary";
    button.innerHTML = `${item.name}<br><small>${Object.entries(item.cost).map(([r, a]) => `${r}: ${a}`).join("<br>")}${item.used_for ? `<br>used for: ${item.used_for}` : ''}</small>`;
    button.onclick = () => Crafting.attemptCraft(item);

    if (item.type === "gear") {
      gearContainer.appendChild(button);
    } else if (item.type === "tool") {
      toolContainer.appendChild(button);
    } else if (item.type === "misc") {
      miscContainer.appendChild(button);
    } else {
      console.warn("Unknown crafting type:", item);
    }
  });
};

// Attempt to craft an item
Crafting.attemptCraft = function (item) {
  const normalize = str => str.toLowerCase().replace(/ /g, '_');
  const resources = GameState.resources;
  const itemKey = normalize(item.name);

  // Check if we have enough of each required resource
  for (const [res, amt] of Object.entries(item.cost)) {
    const resKey = normalize(res);
    const available = (resources[resKey] || 0);
    const equippedCount = GameState.countEquippedItems(resKey);
    const freeAmount = available;
    if (freeAmount < amt) {
      alert(`Not enough available ${res} to craft ${item.name}.
      Equipped: ${equippedCount}, Available: ${freeAmount}`);
      return;
    }
  }

  // Subtract resources
  for (const [res, amt] of Object.entries(item.cost)) {
    const resKey = normalize(res);
    resources[resKey] -= amt;
  }

  // Add crafted item
  resources[itemKey] = (resources[itemKey] || 0) + 1;

  // Show win popup if it's the victory trophy
  if (itemKey === "victory_trophy") {
    showWinPopup();
  }

  Display.updateResourceDisplay();
  GameState.saveProgress();
};

function showWinPopup() {
  if (window.Swal) {
    Swal.fire({
      title: "🎉 You Won the Game!",
      text: "Congratulations! You crafted the Victory Trophy!",
      icon: "success",
      confirmButtonText: "Awesome!",
      confirmButtonColor: "#28a745"
    });
  } else {
    alert("🎉 You Won the Game!\nCongratulations! You crafted the Victory Trophy!");
  }
}