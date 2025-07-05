// display.js — shared logic for inventory/resource display
window.GearParts = window.GearParts || [];
window.ToolParts = window.ToolParts || [];

window.updateResourceDisplay = function(resources, toolsInUse = {}) {
  Object.entries(updateResourceDisplay._elements).forEach(([key, element]) => {
    const value = resources[key] || 0;
    const inUse = toolsInUse[key] || 0;
    

    const displayValue = inUse > 0 ? `${value} (${inUse})` : `${value}`;
    
    if (inUse > 0) {
        console.log(`Item in use: ${key} → ${inUse}`);
    }


    if (updateResourceDisplay._lastValues[key] !== displayValue) {
      element.innerHTML = displayValue;
      updateResourceDisplay._lastValues[key] = displayValue;
    }
  });

  const goldEl = document.getElementById("gold-count");
  if (goldEl) {
    const goldValue = resources.gold || 0;
    if (updateResourceDisplay._lastValues.gold !== goldValue) {
      goldEl.textContent = goldValue;
      updateResourceDisplay._lastValues.gold = goldValue;
    }
  }
};

window.updateResourceDisplay._elements = {};
window.updateResourceDisplay._lastValues = {};

window.prebuildItemDisplay = function(itemKeys, containers, isSidebar = false) {
  updateResourceDisplay._elements = {};
  updateResourceDisplay._lastValues = {};

  itemKeys.forEach(key => {
    const createCard = (key, container) => {
      const card = document.createElement("div");
      card.className = isSidebar ? "sidebar-item-card" : "";
      card.id = `item-card-${key}${isSidebar ? "-sidebar" : ""}`;

      const innerCard = document.createElement("div");
      innerCard.className = "card bg-white border shadow-sm d-flex align-items-center";

      const img = document.createElement("img");
      let iconKey = key.startsWith("recipe_") ? key : key;
      img.src = `assets/icons/${iconKey}_icon.png`;
      img.alt = key;
      img.width = 24;
      img.height = 24;

      const text = document.createElement("div");
      text.id = `item-count-${key}${isSidebar ? "-sidebar" : ""}`;
      text.innerHTML = "0";

      img.onerror = () => {
        img.remove();
        const fallback = document.createElement("div");
        fallback.className = "fallback-text";
        fallback.textContent = key.replace(/_/g, ' ');
        innerCard.insertBefore(fallback, text);
      };

      innerCard.appendChild(img);
      innerCard.appendChild(text);
      card.appendChild(innerCard);
      container.appendChild(card);

      const trackingKey = isSidebar ? `${key}_sidebar` : key;
      updateResourceDisplay._elements[trackingKey] = text;
      updateResourceDisplay._lastValues[trackingKey] = null;
    };

    // Determine the container based on the key
    if (key.startsWith("recipe_")) {
      createCard(key, containers.recipe);
    } else if (window.GearParts.some(part => key.endsWith(`_${part}`))) {
      createCard(key, containers.gear);
    } else if (window.ToolParts.some(part => key.endsWith(`_${part}`))) {
      createCard(key, containers.tool);
    } else if (key !== "gold") {
      createCard(key, containers.default);
    }
  });
};


window.showToast = function(message, duration = 2500) {
  const toast = document.getElementById("game-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.opacity = 1;

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.opacity = 0;
  }, duration);
};