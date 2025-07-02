document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("sidebar-settings-form");
  const positionSelect = document.getElementById("sidebar-position");
  const toggleBtn = document.getElementById("toggle-sidebar");
  const sidebar = document.getElementById("sidebar");
  const toggleIcon = document.getElementById("sidebar-toggle-icon");

  loadSidebarPreferences();
  loadSidebarPosition();

  form.addEventListener("change", () => {
    saveSidebarPreferences();
    renderSidebarContent();
    saveSidebarPosition(); // position might also have changed
  });

  if (positionSelect) {
    positionSelect.addEventListener("change", () => {
      saveSidebarPosition();
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    updateToggleIcon();
    });
  }

  renderSidebarContent();

    // Sidebar toggle button
    const visibilityBtn = document.getElementById("sidebar-visibility-toggle");

    visibilityBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");

        // Adjust floating button location
        if (sidebar.classList.contains("sidebar-left")) {
            visibilityBtn.classList.toggle("sidebar-left", true);
            visibilityBtn.classList.toggle("sidebar-right", false);
        } else {
            visibilityBtn.classList.toggle("sidebar-left", false);
            visibilityBtn.classList.toggle("sidebar-right", true);
        }
    });

});

function getSidebarPreferences() {
  const form = document.getElementById("sidebar-settings-form");
  return {
    show_resources: form.show_resources.checked,
    show_tools: form.show_tools.checked,
    show_gear: form.show_gear.checked,
    show_recipes: form.show_recipes.checked,
    show_jobs: form.show_jobs.checked,
    show_crafting_tools: form.show_crafting_tools.checked,
    show_crafting_gear: form.show_crafting_gear.checked,
    show_achievements: form.show_achievements.checked,
    sidebar_position: form.sidebar_position?.value || "right",
  };
}

function renderSidebarContent() {
    const sidebar = document.getElementById("sidebar");

    if (!preferences.show_sidebar) {
    sidebar.style.display = "none";
    } else {
    sidebar.style.display = "block";
    }

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

function saveSidebarPreferences() {
  const preferences = getSidebarPreferences();
  localStorage.setItem("sidebar_preferences", JSON.stringify(preferences));
}

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

    // ✅ Restore sidebar position select value too
    if (preferences.sidebar_position && form.elements.sidebar_position) {
      form.elements.sidebar_position.value = preferences.sidebar_position;
    }

  } catch (err) {
    console.warn("Failed to load sidebar preferences:", err);
  }
}

function applySidebarPosition(position) {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.remove("sidebar-left", "sidebar-right");
  sidebar.classList.add(`sidebar-${position}`);
}

function saveSidebarPosition() {
  const selector = document.getElementById("sidebar-position");
  const position = selector?.value || "right";
  localStorage.setItem("sidebar_position", position);
  applySidebarPosition(position);
}

function loadSidebarPosition() {
  const saved = localStorage.getItem("sidebar_position") || "right";
  const selector = document.getElementById("sidebar-position");

  applySidebarPosition(saved);

  const btn = document.getElementById("sidebar-visibility-toggle");
  if (btn) {
    btn.classList.toggle("sidebar-left", saved === "left");
    btn.classList.toggle("sidebar-right", saved === "right");
  }

  updateToggleIcon(); // <- Add this line
  if (selector) selector.value = saved;
}

function updateToggleIcon() {
  const isCollapsed = sidebar.classList.contains("collapsed");
  const isLeft = sidebar.classList.contains("sidebar-left");

  if (toggleIcon) {
    toggleIcon.className = isCollapsed
      ? (isLeft ? "bi bi-chevron-right" : "bi bi-chevron-left")
      : (isLeft ? "bi bi-chevron-left" : "bi bi-chevron-right");
  }
}
