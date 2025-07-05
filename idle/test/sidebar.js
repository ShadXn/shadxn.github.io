let wrapper, sidebar, toggleBtn, toggleIcon;

document.addEventListener("DOMContentLoaded", () => {
  wrapper = document.getElementById("sidebar-wrapper");
  sidebar = document.getElementById("sidebar");
  toggleBtn = document.getElementById("sidebar-visibility-toggle");
  toggleIcon = document.getElementById("sidebar-toggle-icon");

  const form = document.getElementById("sidebar-settings-form");
  const allItemKeys = Object.keys(localStorage.getItem("idle_resources") || {});

  applySidebarPreferences();  // Loads and applies everything

  // ✅ Single listener handles everything (checkboxes + position)
  form.addEventListener("change", () => {
    const preferences = getSidebarPreferences();
    localStorage.setItem("sidebar_preferences", JSON.stringify(preferences));
    applySidebarPreferences(preferences);
    renderSidebarContent();
  });

  toggleBtn.addEventListener("click", () => {
    wrapper.classList.toggle("collapsed");
    const prefs = getSavedPreferences();
    prefs.sidebar_collapsed = wrapper.classList.contains("collapsed");
    localStorage.setItem("sidebar_preferences", JSON.stringify(prefs));
    updateToggleIcon();
  });

  renderSidebarContent();
  buildSidebarItemDisplay(allItemKeys);
});

// Get sidebar preferences from the form
function getSidebarPreferences() {
  const form = document.getElementById("sidebar-settings-form");
  const wrapper = document.getElementById("sidebar-wrapper");

  return {
    show_resources: form.show_resources?.checked ?? true,
    show_recipes: form.show_recipes?.checked ?? true,
    show_tools: form.show_tools?.checked ?? true,
    show_gear: form.show_gear?.checked ?? true,
    show_sidebar: form.show_sidebar?.checked ?? true,
    sidebar_position: form.sidebar_position?.value || "right",
    sidebar_collapsed: (!form.show_sidebar?.checked) || (wrapper?.classList.contains("collapsed") ?? false),
  };
}

// Get saved preferences from localStorage or default values
function applySidebarPreferences(prefs = getSavedPreferences()) {
  const form = document.getElementById("sidebar-settings-form");
  const wrapper = document.getElementById("sidebar-wrapper");
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebar-visibility-toggle");

  // Set form fields
  if (form) {
    for (const key in prefs) {
      if (form.elements[key]) {
        if (form.elements[key].type === "checkbox") {
          form.elements[key].checked = prefs[key];
        } else {
          form.elements[key].value = prefs[key];
        }
      }
    }
  }

  // Visibility
  wrapper.classList.toggle("d-none", !prefs.show_sidebar);
  toggleBtn.classList.toggle("d-none", !prefs.show_sidebar);

  // Position
  wrapper.classList.remove("sidebar-left", "sidebar-right");
  sidebar.classList.remove("sidebar-left", "sidebar-right");
  toggleBtn.classList.remove("sidebar-left", "sidebar-right");

  wrapper.classList.add(`sidebar-${prefs.sidebar_position}`);
  sidebar.classList.add(`sidebar-${prefs.sidebar_position}`);
  toggleBtn.classList.add(`sidebar-${prefs.sidebar_position}`);

  // Collapse state
  wrapper.classList.toggle("collapsed", prefs.sidebar_collapsed);

  updateToggleIcon();
}

// Render sidebar content based on preferences
function renderSidebarContent() {
  const prefs = getSavedPreferences();
  const resources = JSON.parse(localStorage.getItem("idle_resources") || "{}");

  // Clear all sidebar sections first
  ["sidebar-resource-display", "sidebar-gear-display", "sidebar-tool-display", "sidebar-recipe-display"]
    .forEach(id => document.getElementById(id).innerHTML = "");

  const keys = Object.keys(resources);

  const filteredKeys = keys.filter(key => {
    if (key === "gold") return false;
    if (!prefs.show_resources && !key.startsWith("recipe_") && !/_pickaxe|_axe|_rod|_hammer|_gloves|_cape|_boots|_sword|_armor|_shield/.test(key)) {
      return false;
    }
    if (!prefs.show_recipes && key.startsWith("recipe_")) return false;
    if (!prefs.show_tools && /_pickaxe|_axe|_rod|_hammer|_gloves|_cape|_boots/.test(key)) return false;
    if (!prefs.show_gear && /_sword|_armor|_shield/.test(key)) return false;
    return true;
  });

  buildSidebarItemDisplay(filteredKeys);
}

function buildSidebarItemDisplay(itemKeys) {
  const resources = JSON.parse(localStorage.getItem("idle_resources") || "{}");

  const containers = {
    default: document.getElementById("sidebar-section-resources"),
    gear: document.getElementById("sidebar-section-gear"),
    tool: document.getElementById("sidebar-section-tools"),
    recipe: document.getElementById("sidebar-section-recipes"),
  };

  // Clear any previous content
  Object.values(containers).forEach(container => container.innerHTML = "");

  // Section titles
  const sectionTitles = {
    default: "Resources",
    gear: "Weapons & Armor",
    tool: "Tools",
    recipe: "Recipes",
  };

  const addedSections = new Set();

  itemKeys.forEach(key => {
    const value = resources[key];
    if (!value) return; // Skip 0 or undefined

    let sectionKey = "default";
    if (key.startsWith("recipe_")) sectionKey = "recipe";
    else if (/sword|armor|shield/.test(key)) sectionKey = "gear";
    else if (/pickaxe|axe|rod|hammer|gloves|cape|boots/.test(key)) sectionKey = "tool";

    const container = containers[sectionKey];

    // Add section title once
    if (!addedSections.has(sectionKey)) {
      const title = document.createElement("h6");
      title.className = "sidebar-section-title";
      title.textContent = sectionTitles[sectionKey];
      container.appendChild(title);
      addedSections.add(sectionKey);
    }

    // Create card
    const card = document.createElement("div");
    card.className = "sidebar-item-card";
    card.id = `sidebar-item-card-${key}`;

    const innerCard = document.createElement("div");
    innerCard.className = "card bg-white border shadow-sm d-flex align-items-center";

    const img = document.createElement("img");
    let iconKey = key;
    if (key.startsWith("recipe_")) {
      const parts = key.split("_");
      const tier = parts[1];
      iconKey = `recipe_${tier}`;
    }

    img.src = `assets/icons/${iconKey}_icon.png`;
    img.alt = key;
    img.width = 24;
    img.height = 24;

    const text = document.createElement("div");
    text.id = `sidebar-item-count-${key}`;
    text.innerHTML = value;

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

    updateResourceDisplay._elements[key + "_sidebar"] = text;
  });
}

// Get saved preferences from localStorage or return default values
function updateToggleIcon() {
  const icon = document.getElementById("sidebar-toggle-icon");
  const wrapper = document.getElementById("sidebar-wrapper");
  const isCollapsed = wrapper.classList.contains("collapsed");
  const isLeft = wrapper.classList.contains("sidebar-left");

  icon.className = isCollapsed
    ? (isLeft ? "bi bi-chevron-right" : "bi bi-chevron-left")
    : (isLeft ? "bi bi-chevron-left" : "bi bi-chevron-right");
}


// Save sidebar preferences to localStorage
function saveSidebarPreferences() {
  const preferences = getSidebarPreferences();
  localStorage.setItem("sidebar_preferences", JSON.stringify(preferences));
}

function getSavedPreferences() {
  const defaultPrefs = {
    show_resources: true,
    show_recipes: true,
    show_tools: true,
    show_gear: true,
    show_sidebar: true,
    sidebar_position: "right",
    sidebar_collapsed: false,
  };

  const saved = JSON.parse(localStorage.getItem("sidebar_preferences") || "{}");
  return { ...defaultPrefs, ...saved };
}


// Get saved preferences or return default values
function resetSidebarPreferences() {
  localStorage.removeItem("sidebar_preferences");
  applySidebarPreferences();  // Reapply defaults
  renderSidebarContent();
}