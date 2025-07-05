// display.js — shared logic for inventory/resource display

window.updateResourceDisplay = function(resources, toolsInUse = {}) {
  Object.entries(updateResourceDisplay._elements).forEach(([key, element]) => {
    const value = resources[key] || 0;
    const inUse = toolsInUse[key] || 0;
    const showInUse = inUse > 0 ? ` (${inUse})` : "";
    element.innerHTML = `${value}${showInUse}`;
  });
};

window.prebuildItemDisplay = function(itemKeys, containers) {
  updateResourceDisplay._elements = {};

  itemKeys.forEach(key => {
    const card = document.createElement("div");
    card.className = "";
    card.id = `item-card-${key}`;

    const innerCard = document.createElement("div");
    innerCard.className = "card bg-white border shadow-sm d-flex align-items-center";

    const img = document.createElement("img");
    let iconKey = key.startsWith("recipe_") ? key : key;
    img.src = `assets/icons/${iconKey}_icon.png`;
    img.alt = key;
    img.width = 24;
    img.height = 24;

    const text = document.createElement("div");
    text.id = `item-count-${key}`;
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

    if (key.startsWith("recipe_")) containers.recipe.appendChild(card);
    else if (/sword|armor|shield/.test(key)) containers.gear.appendChild(card);
    else if (/pickaxe|axe|rod|hammer|gloves|cape|boots/.test(key)) containers.tool.appendChild(card);
    else if (key !== "gold") containers.default.appendChild(card);

    updateResourceDisplay._elements[key] = text;
    updateResourceDisplay._elements[`${key}_sidebar`] = text.cloneNode(true);
  });
};