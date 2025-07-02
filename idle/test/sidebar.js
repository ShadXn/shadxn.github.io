document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggle-sidebar");
  const form = document.getElementById("sidebar-settings-form");
  const viewer = document.getElementById("sidebar-viewer");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  form.addEventListener("change", renderSidebarContent);

  function renderSidebarContent() {
    viewer.innerHTML = "";

    const resources = JSON.parse(localStorage.getItem("idle_resources") || "{}");

    const show = (name) => form.elements[name]?.checked;

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

    if (show("show_resources")) appendSection("Resources", ["logs", "ore", "fish", "cooked_fish", "gold", "ingot"]);
    if (show("show_tools")) appendSection("Tools", Object.keys(resources).filter(k => /_pickaxe|_axe|_rod|_hammer|_gloves|_boots/.test(k)));
    if (show("show_gear")) appendSection("Weapons & Armor", Object.keys(resources).filter(k => /_sword|_armor|_shield/.test(k)));
    if (show("show_recipes")) appendSection("Recipes", Object.keys(resources).filter(k => k.startsWith("recipe_")));
    if (show("show_jobs")) appendSection("Jobs", []); // optional: show assignments or job stats
    if (show("show_crafting_tools")) appendSection("Crafting Tools", []); // can hook in crafted count
    if (show("show_crafting_gear")) appendSection("Crafting Gear", []);
    if (show("show_achievements")) appendSection("Achievements", []); // extend later
  }

  renderSidebarContent();
});