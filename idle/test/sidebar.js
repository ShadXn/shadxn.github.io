let sidebar, toggleIcon;

document.addEventListener("DOMContentLoaded", () => {
  const sidebarWrapper = document.getElementById("sidebar-wrapper");
  const toggleIcon = document.getElementById("sidebar-toggle-icon");
  const toggleBtn = document.getElementById("sidebar-visibility-toggle");
  const positionSelect = document.getElementById("sidebar-position");
  const form = document.getElementById("sidebar-settings-form");

  // 🛠 Load preferences FIRST
  loadSidebarPreferences();

  if (form) {
    form.addEventListener("change", () => {
      saveSidebarPreferences();
      renderSidebarContent();
      saveSidebarPosition();
    });
  }

  function updateIcon(collapsed, position) {
    toggleIcon.className =
      collapsed
        ? (position === "left" ? "bi bi-chevron-right" : "bi bi-chevron-left")
        : (position === "left" ? "bi bi-chevron-left" : "bi bi-chevron-right");
  }

  function applyPosition(pos) {
    sidebarWrapper.classList.remove("sidebar-left", "sidebar-right");
    sidebarWrapper.classList.add(`sidebar-${pos}`);
    updateIcon(sidebarWrapper.classList.contains("collapsed"), pos);
  }

  toggleBtn.addEventListener("click", () => {
    sidebarWrapper.classList.toggle("collapsed");
    const isCollapsed = sidebarWrapper.classList.contains("collapsed");
    const currentPosition = sidebarWrapper.classList.contains("sidebar-right") ? "right" : "left";
    updateIcon(isCollapsed, currentPosition);
    const preferences = JSON.parse(localStorage.getItem("sidebar_preferences") || "{}");
    preferences.sidebar_collapsed = isCollapsed;
    localStorage.setItem("sidebar_preferences", JSON.stringify(preferences));
  });

  if (positionSelect) {
    positionSelect.addEventListener("change", () => {
      const pos = positionSelect.value;
      const preferences = JSON.parse(localStorage.getItem("sidebar_preferences") || "{}");
      preferences.sidebar_position = pos;
      localStorage.setItem("sidebar_preferences", JSON.stringify(preferences));
      applyPosition(pos);
    });
  }

  // ✅ Reapply after loading preferences
  const preferences = JSON.parse(localStorage.getItem("sidebar_preferences") || "{}");
  const savedPos = preferences.sidebar_position || "right";
  const savedCollapsed = preferences.sidebar_collapsed ?? false;
  applyPosition(savedPos);
  if (savedCollapsed) {
    sidebarWrapper.classList.add("collapsed");
  }

  renderSidebarContent();
});

// Save sidebar position to localStorage
function getSavedSidebarPosition() {
  const prefs = JSON.parse(localStorage.getItem("sidebar_preferences") || "{}");
  return prefs.sidebar_position || "right";
}

// Get sidebar preferences from the form
function getSidebarPreferences() {
  const form = document.getElementById("sidebar-settings-form");
  const sidebarWrapper = document.getElementById("sidebar-wrapper");

  return {
    show_resources: form.show_resources?.checked ?? true,
    show_recipes: form.show_recipes?.checked ?? true,
    show_tools: form.show_tools?.checked ?? true,
    show_gear: form.show_gear?.checked ?? true,
    show_sidebar: form.show_sidebar?.checked ?? true,
    sidebar_position: form.sidebar_position?.value ?? "right",
    sidebar_collapsed: sidebarWrapper?.classList.contains("collapsed") ?? true,
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
  if (preferences.show_recipes) appendSection("Recipes", Object.keys(resources).filter(k => k.startsWith("recipe_")));
  if (preferences.show_tools) appendSection("Tools", Object.keys(resources).filter(k => /_pickaxe|_axe|_rod|_hammer|_gloves|_boots/.test(k)));
  if (preferences.show_gear) appendSection("Weapons & Armor", Object.keys(resources).filter(k => /_sword|_armor|_shield/.test(k)));
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
    const sidebarWrapper = document.getElementById("sidebar-wrapper");
    const toggleBtn = document.getElementById("sidebar-visibility-toggle");

    // Apply checkboxes
    for (const key in preferences) {
      if (form.elements[key] && form.elements[key].type === "checkbox") {
        form.elements[key].checked = preferences[key];
      }
    }

    // Apply sidebar position (from preferences only)
    const position = preferences.sidebar_position || "right";
    if (form.elements.sidebar_position) {
      form.elements.sidebar_position.value = position;
    }
    applySidebarPosition(position);

    // Apply collapse state (from preferences only)
    const isCollapsed = preferences.sidebar_collapsed ?? false;
    sidebarWrapper.classList.toggle("collapsed", isCollapsed);

    // Show/hide sidebar & toggle button
    const showSidebar = preferences.show_sidebar ?? true;
    sidebarWrapper.classList.toggle("d-none", !showSidebar);
    toggleBtn.classList.toggle("d-none", !showSidebar);

  } catch (err) {
    console.warn("Failed to load sidebar preferences:", err);
  }
}

// Apply sidebar position based on saved preference
function applySidebarPosition(position) {
  const wrapper = document.getElementById("sidebar-wrapper");
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebar-visibility-toggle");

  wrapper.classList.remove("sidebar-left", "sidebar-right");
  sidebar.classList.remove("sidebar-left", "sidebar-right");
  toggleBtn.classList.remove("sidebar-left", "sidebar-right");

  wrapper.classList.add(`sidebar-${position}`);
  sidebar.classList.add(`sidebar-${position}`);
  toggleBtn.classList.add(`sidebar-${position}`);
}

// Save sidebar position and update toggle icon
function saveSidebarPosition() {
  const selector = document.getElementById("sidebar-position");
  const formValue = selector?.value || "right";

  // Get current preferences
  const current = JSON.parse(localStorage.getItem("sidebar_preferences") || "{}");
  current.sidebar_position = formValue;

  localStorage.setItem("sidebar_preferences", JSON.stringify(current));
  applySidebarPosition(formValue);
  updateToggleIcon();
}

// Load sidebar position from localStorage or default to "right"
function loadSidebarPosition() {
  const saved = JSON.parse(localStorage.getItem("sidebar_preferences") || "{}");
  const position = saved.sidebar_position || "right";

  const selector = document.getElementById("sidebar-position");
  if (selector) selector.value = position;

  applySidebarPosition(position);
  updateToggleIcon();
}

// Update the toggle icon based on sidebar state
function updateToggleIcon() {
  const icon = document.getElementById("sidebar-toggle-icon");
  const wrapper = document.getElementById("sidebar-wrapper");
  const isCollapsed = wrapper.classList.contains("collapsed");
  const isLeft = wrapper.classList.contains("sidebar-left");

  icon.className = isCollapsed
    ? (isLeft ? "bi bi-chevron-right" : "bi bi-chevron-left")
    : (isLeft ? "bi bi-chevron-left" : "bi bi-chevron-right");
}