document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("sidebar-settings-form");

  // Load saved settings
  loadSidebarPreferences();

  // Save and re-render on change
  form.addEventListener("change", () => {
    saveSidebarPreferences();
    renderSidebarContent();
  });

  // Initial render
  renderSidebarContent();
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
  };
}

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
      if (form.elements[key]) {
        form.elements[key].checked = preferences[key];
      }
    }
  } catch (err) {
    console.warn("Failed to load sidebar preferences:", err);
  }
}