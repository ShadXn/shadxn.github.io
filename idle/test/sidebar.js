let sidebar, toggleIcon;

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleIcon = document.getElementById("sidebar-toggle-icon");
  const form = document.getElementById("sidebar-settings-form");
  const positionSelect = document.getElementById("sidebar-position");
  const visibilityBtn = document.getElementById("sidebar-visibility-toggle");

  window.sidebar = sidebar;
  window.toggleIcon = toggleIcon;

  loadSidebarPreferences();
  applySidebarPosition(getSavedSidebarPosition());
  loadSidebarPosition();

  // ⬇️ Restore collapsed state
  const collapsed = localStorage.getItem("sidebar_collapsed") === "true";
  if (collapsed) {
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
  }

  form.addEventListener("change", () => {
    saveSidebarPreferences();
    renderSidebarContent();
    saveSidebarPosition();
  });

  if (positionSelect) {
    positionSelect.addEventListener("change", saveSidebarPosition);
  }

  if (visibilityBtn) {
    visibilityBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      const isCollapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem("sidebar_collapsed", isCollapsed ? "true" : "false");
      updateToggleIcon();
    });
  }

  renderSidebarContent();
});

// Save sidebar position to localStorage
function getSavedSidebarPosition() {
  return localStorage.getItem("sidebar_position") || "right";
}

// Get sidebar preferences from the form
function getSidebarPreferences() {
  const form = document.getElementById("sidebar-settings-form");
  return {
    show_resources: form.show_resources.checked,
    show_recipes: form.show_recipes.checked,
    show_tools: form.show_tools.checked,
    show_gear: form.show_gear.checked,
    show_jobs: form.show_jobs.checked,
    show_crafting_tools: form.show_crafting_tools.checked,
    show_crafting_gear: form.show_crafting_gear.checked,
    show_achievements: form.show_achievements.checked,
    sidebar_position: form.sidebar_position?.value || "right",
  };
}

// Render sidebar content based on preferences
function renderSidebarContent() {
  const viewer = document.getElementById("sidebar-viewer");
  viewer.innerHTML = "";

  const preferences = getSidebarPreferences();
  const resources = JSON.parse(localStorage.getItem("idle_resources") || "{}");

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

  if (preferences.show_resources) appendSection("Resources", ["logs", "ore", "fish", "cooked_fish", "gold", "ingot"]);
  if (preferences.show_tools) appendSection("Tools", Object.keys(resources).filter(k => /_pickaxe|_axe|_rod|_hammer|_gloves|_boots/.test(k)));
  if (preferences.show_gear) appendSection("Weapons & Armor", Object.keys(resources).filter(k => /_sword|_armor|_shield/.test(k)));
  if (preferences.show_recipes) appendSection("Recipes", Object.keys(resources).filter(k => k.startsWith("recipe_")));
  if (preferences.show_jobs) appendSection("Jobs", []);
  if (preferences.show_crafting_tools) appendSection("Crafting Tools", []);
  if (preferences.show_crafting_gear) appendSection("Crafting Gear", []);
  if (preferences.show_achievements) appendSection("Achievements", []);
}

// Save sidebar preferences to localStorage
function saveSidebarPreferences() {
  const preferences = getSidebarPreferences();
  localStorage.setItem("sidebar_preferences", JSON.stringify(preferences));
}

// Load sidebar preferences from localStorage
function loadSidebarPreferences() {
  const saved = localStorage.getItem("sidebar_preferences");
  if (!saved) return;

  try {
    const preferences = JSON.parse(saved);
    const form = document.getElementById("sidebar-settings-form");

    for (const key in preferences) {
      if (form.elements[key] && form.elements[key].type === "checkbox") {
        form.elements[key].checked = preferences[key];
      }
    }

    if (preferences.sidebar_position && form.elements.sidebar_position) {
      form.elements.sidebar_position.value = preferences.sidebar_position;
    }
  } catch (err) {
    console.warn("Failed to load sidebar preferences:", err);
  }
}

// Apply sidebar position based on saved preference
function applySidebarPosition(position) {
  const wrapper = document.getElementById("sidebar-wrapper");
  wrapper.classList.remove("sidebar-left", "sidebar-right");
  wrapper.classList.add(`sidebar-${position}`);
}

// Save sidebar position and update toggle icon
function saveSidebarPosition() {
  const selector = document.getElementById("sidebar-position");
  const position = selector?.value || "right";
  localStorage.setItem("sidebar_position", position);
  applySidebarPosition(position);
  updateToggleIcon();
}

// Load sidebar position from localStorage or default to "right"
function loadSidebarPosition() {
  const saved = localStorage.getItem("sidebar_position") || "right";
  const selector = document.getElementById("sidebar-position");
  if (selector) selector.value = saved;

  applySidebarPosition(saved);
  updateToggleIcon();
}

// Update the toggle icon based on sidebar state
function updateToggleIcon() {
  const sidebar = document.getElementById("sidebar");
  const icon = document.getElementById("sidebar-toggle-icon");
  const wrapper = document.getElementById("sidebar-wrapper");

  const isCollapsed = sidebar.classList.contains("collapsed");
  const isLeft = wrapper.classList.contains("sidebar-left");

  icon.className = isCollapsed
    ? (isLeft ? "bi bi-chevron-right" : "bi bi-chevron-left")
    : (isLeft ? "bi bi-chevron-left" : "bi bi-chevron-right");
}