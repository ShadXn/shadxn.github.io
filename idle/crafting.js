// crafting.js — logic for building and attempting crafts

window.buildCraftables = function(gearData, toolData, miscData = {}) {
  const craftables = [];

  for (const tier in gearData) {
    for (const part in gearData[tier]) {
      craftables.push({
        name: `${tier} ${part}`,
        cost: gearData[tier][part].cost,
        type: "gear"
      });
    }
  }

  for (const tier in toolData) {
    for (const part in toolData[tier]) {
      craftables.push({
        name: `${tier} ${part}`,
        cost: toolData[tier][part].cost,
        type: "tool"
      });
    }
  }

  for (const key in miscData) {
    craftables.push({
      name: key,
      cost: miscData[key].cost,
      type: "misc"
    });
  }

  return craftables;
};

window.CraftingUI = {
  showCraftingSection(items, resources, toolsInUse = {}) {
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
      button.onclick = () => this.attemptCraft(item, resources, toolsInUse);

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

  },

  attemptCraft(item, resources, toolsInUse = {}) {
    const normalize = str => str.toLowerCase().replace(/ /g, '_');

    for (const [res, amt] of Object.entries(item.cost)) {
      const resKey = normalize(res);
      const inUse = toolsInUse[resKey] || 0;
      const available = (resources[resKey] || 0) - inUse;
      if (available < amt) {
        alert(`Not enough available ${res} to craft ${item.name}.\nIn use: ${inUse}, Available: ${available}`);
        return;
      }
    }

    for (const [res, amt] of Object.entries(item.cost)) {
      const resKey = normalize(res);
      resources[resKey] -= amt;
    }

    const itemKey = normalize(item.name);
    resources[itemKey] = (resources[itemKey] || 0) + 1;

    // 🏆 Show win popup if it's the victory trophy
    if (itemKey === "victory_trophy") {
      showWinPopup(); // 👈 Call this function
    }

    updateResourceDisplay(resources, toolsInUse);
    GameState.saveProgress();
  }
};

// gamestate.js — loading, saving, and resetting

window.saveProgress = function(resources = {}, workers = 0, assignments = {}) {
  localStorage.setItem("idle_resources", JSON.stringify(resources));
  localStorage.setItem("idle_workers", workers);
  localStorage.setItem("idle_assignments", JSON.stringify(assignments));
};

window.loadProgress = function() {
  return {
    resources: JSON.parse(localStorage.getItem("idle_resources") || "{}"),
    workers: parseInt(localStorage.getItem("idle_workers")) || 0,
    assignments: JSON.parse(localStorage.getItem("idle_assignments") || "{}")
  };
};

window.resetProgress = function() {
  localStorage.setItem("resetting", "true");
  location.reload();
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