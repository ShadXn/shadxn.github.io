// version.js
const CURRENT_GAME_VERSION = "0.22";
const VERSION_STORAGE_KEY = "idle_last_version";

// Clean up localStorage by removing unused keys
const LOCALSTORAGE_WHITELIST = [
  "idle_workers", // for worker count
  "idle_resources", // for game resources
  "idle_assignments", // for worker assignments
  "sidebar_preferences", // for sidebar state
  "idle_last_version", // needed for version popup
  "idle_owned_workers", // for owned workers
  "idle_worker_data", // for worker data
  VERSION_STORAGE_KEY,
];