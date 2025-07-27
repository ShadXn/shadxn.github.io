// sidebar.js - Sidebar to visualize inventory for the player while using the other tabs
// Setup global Display object
window.Sidebar = window.Sidebar || {};
let wrapper, sidebar, toggleBtn, toggleIcon;

document.addEventListener("DOMContentLoaded", () => {
  wrapper = document.getElementById("sidebar-wrapper");
  sidebar = document.getElementById("sidebar");
  toggleBtn = document.getElementById("sidebar-visibility-toggle");
  toggleIcon = document.getElementById("sidebar-toggle-icon");

  const form = document.getElementById("sidebar-settings-form");


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

  // renderSidebarContent();
  Display.updateResourceDisplay();
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

// Add a title to the sidebar section
function addSidebarTitle(container, text) {
  if (!container) return;
  const title = document.createElement("div");
  title.className = "sidebar-section-title";
  title.textContent = text;
  container.appendChild(title);
}

// Render sidebar content based on preferences
function renderSidebarContent() {
  const prefs = getSavedPreferences();
  const resources = GameState.resources;

  const containers = {
    default: document.getElementById("sidebar-section-resources"),
    recipe: document.getElementById("sidebar-section-recipes"),
    gear: document.getElementById("sidebar-section-gear"),
    tool: document.getElementById("sidebar-section-tools"),
  };

  // Clear old content
  Object.values(containers).forEach(container => {
    if (container) container.innerHTML = "";
  });

  const keys = Object.keys(resources);

  const sections = [
    {
      name: "Resources",
      enabled: prefs.show_resources,
      container: containers.default,
      filter: key =>
        !key.startsWith("recipe_") &&
        !/_pickaxe|_axe|_rod|_hammer|_saw|_flint|_gloves|_cape|_boots|_sword|_armor|_shield/.test(key) &&
        key !== "gold",
    },
    {
      name: "Recipes",
      enabled: prefs.show_recipes,
      container: containers.recipe,
      filter: key => key.startsWith("recipe_"),
    },
    {
      name: "Weapons & Armor",
      enabled: prefs.show_gear,
      container: containers.gear,
      filter: key => /_sword|_armor|_shield/.test(key),
    },
    {
      name: "Tools",
      enabled: prefs.show_tools,
      container: containers.tool,
      filter: key => /_pickaxe|_axe|_rod|_hammer|_saw|_flint|_gloves|_cape|_boots/.test(key),
    },
  ];

  for (const section of sections) {
    if (!section.enabled || !section.container) continue;

    const filtered = keys.filter(key => /^[a-z_]+$/i.test(key) && section.filter(key));
    if (filtered.length === 0) continue;

    const grid = Sidebar.ensureSidebarSection(section.container.id, section.name);

    Display.prebuildItemDisplay(filtered, {
      default: grid,
      recipe: grid,
      gear: grid,
      tool: grid,
      misc: grid
    }, true);
  }
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
    show_sidebar: false,
    sidebar_position: "left",
    sidebar_collapsed: true,
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

// Ensures a sidebar section wrapper with title and grid exists, and returns the grid DOM element.
Sidebar.ensureSidebarSection = function(containerId, titleText = "Section") {
  const container = document.getElementById(containerId);
  if (!container) return null;

  let grid = container.querySelector(".item-section");
  if (grid) return grid;

  const wrapper = document.createElement("div");
  wrapper.className = "sidebar-item-wrapper";

  const title = document.createElement("div");
  title.className = "sidebar-section-title px-1";
  title.textContent = titleText;
  wrapper.appendChild(title);

  grid = document.createElement("div");
  grid.className = "item-section";
  wrapper.appendChild(grid);

  container.appendChild(wrapper);
  return grid;
};