// version.js
const CURRENT_GAME_VERSION = "0.21";
const VERSION_STORAGE_KEY = "idle_last_version";

localStorage.setItem("debug_junk1", "foo");
localStorage.setItem("unused_feature_flag", "true");

const LOCALSTORAGE_WHITELIST = [
  "idle_gold",
  "idle_workers",
  "idle_resources",
  "idle_assignments",
  "sidebar_preferences",
  "idle_last_version", // needed for version popup
  "debug_junk1",
  "unused_feature_flag",
  VERSION_STORAGE_KEY,
];