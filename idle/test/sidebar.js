let wrapper, sidebar, toggleBtn, toggleIcon;

document.addEventListener("DOMContentLoaded", () => {
  wrapper = document.getElementById("sidebar-wrapper");
  sidebar = document.getElementById("sidebar");
  toggleBtn = document.getElementById("sidebar-visibility-toggle");
  toggleIcon = document.getElementById("sidebar-toggle-icon");

  const form = document.getElementById("sidebar-settings-form");

  applySidebarPreferences();  // Loads and applies everything

  form.addEventListener("change", () => {
    const preferences = getSidebarPreferences();
    applySidebarPreferences(preferences);  // Apply changes immediately
    localStorage.setItem("sidebar_preferences", JSON.stringify(preferences));
    renderSidebarContent();
  });

  document.getElementById("sidebar-visibility-toggle").addEventListener("click", () => {
    const wrapper = document.getElementById("sidebar-wrapper");
    wrapper.classList.toggle("collapsed");
    const prefs = getSavedPreferences();
    prefs.sidebar_collapsed = wrapper.classList.contains("collapsed");
    localStorage.setItem("sidebar_preferences", JSON.stringify(prefs));
    updateToggleIcon();
  });

  renderSidebarContent();
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
    sidebar_collapsed: wrapper?.classList.contains("collapsed") ?? false,
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
  const viewer = document.getElementById("sidebar-viewer");
  const prefs = getSavedPreferences();
  const resources = JSON.parse(localStorage.getItem("idle_resources") || "{}");
  viewer.innerHTML = "";

  const appendSection = (title, keys) => {
    const section = document.createElement("div");
    section.innerHTML = `<strong>${title}</strong>`;
    keys.forEach(key => {
      const value = resources[key] || 0;
      const item = document.createElement("div");
      item.textContent = `${key.replace(/_/g, ' ')}: ${value}`;
      section.appendChild(item);
    });
    viewer.appendChild(section);
  };

  if (prefs.show_resources) appendSection("Resources", ["logs", "ore", "fish", "cooked_fish", "gold", "ingot"]);
  if (prefs.show_recipes) appendSection("Recipes", Object.keys(resources).filter(k => k.startsWith("recipe_")));
  if (prefs.show_tools) appendSection("Tools", Object.keys(resources).filter(k => /_pickaxe|_axe|_rod|_hammer|_gloves|_boots/.test(k)));
  if (prefs.show_gear) appendSection("Weapons & Armor", Object.keys(resources).filter(k => /_sword|_armor|_shield/.test(k)));
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