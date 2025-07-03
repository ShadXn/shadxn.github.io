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
    localStorage.setItem("sidebar_collapsed", isCollapsed ? "true" : "false");
  });

  if (positionSelect) {
    positionSelect.addEventListener("change", () => {
      const pos = positionSelect.value;
      localStorage.setItem("sidebar_position", pos);
      applyPosition(pos);
    });
  }

  // ✅ Reapply after loading preferences
  const savedPos = localStorage.getItem("sidebar_position") || "right";
  const savedCollapsed = localStorage.getItem("sidebar_collapsed") === "true";
  applyPosition(savedPos);
  if (savedCollapsed) {
    sidebarWrapper.classList.add("collapsed");
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
    show_resources: form.show_resources?.checked ?? true,
    show_recipes: form.show_recipes?.checked ?? true,
    show_tools: form.show_tools?.checked ?? true,
    show_gear: form.show_gear?.checked ?? true,
    show_sidebar: form.show_sidebar?.checked ?? true,
    sidebar_position: localStorage.getItem("sidebar_position") || "right",
    sidebar_collapsed: document.getElementById("sidebar-wrapper")?.classList.contains("collapsed") ?? false,
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

    for (const key in preferences) {
      if (form.elements[key] && form.elements[key].type === "checkbox") {
        form.elements[key].checked = preferences[key];
      }
    }

    if (form.elements.sidebar_position) {
    const savedPos = localStorage.getItem("sidebar_position") || "right";
    form.elements.sidebar_position.value = savedPos;
    }

    applySidebarPosition(preferences.sidebar_position || "right");

    if (preferences.sidebar_collapsed) {
      sidebarWrapper?.classList.add("collapsed");
    } else {
      sidebarWrapper?.classList.remove("collapsed");
    }

    // Show/hide sidebar if applicable
    const toggleBtn = document.getElementById("sidebar-visibility-toggle");
    if (!preferences.show_sidebar) {
        sidebarWrapper?.classList.add("d-none");
        toggleBtn?.classList.add("d-none");
    } else {
        sidebarWrapper?.classList.remove("d-none");
        toggleBtn?.classList.remove("d-none");
    }


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
  const icon = document.getElementById("sidebar-toggle-icon");
  const wrapper = document.getElementById("sidebar-wrapper");
  const isCollapsed = wrapper.classList.contains("collapsed");
  const isLeft = wrapper.classList.contains("sidebar-left");

  icon.className = isCollapsed
    ? (isLeft ? "bi bi-chevron-right" : "bi bi-chevron-left")
    : (isLeft ? "bi bi-chevron-left" : "bi bi-chevron-right");
}