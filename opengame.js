// Track collapse state in localStorage
document.addEventListener("DOMContentLoaded", function () {
  const collapseEl = document.getElementById("expandInfo");
  const collapse = new bootstrap.Collapse(collapseEl, {
    toggle: false // Don't auto-toggle on init
  });

  // Apply stored state
  const isOpen = localStorage.getItem("idle_game_open") === "true";
  if (isOpen) collapse.show();

  // Update storage on toggle
  collapseEl.addEventListener("shown.bs.collapse", () => {
    localStorage.setItem("idle_game_open", "true");
  });
  collapseEl.addEventListener("hidden.bs.collapse", () => {
    localStorage.setItem("idle_game_open", "false");
  });
});