// === Countdown Timer ===
function updateCountdown() {
  const targetDate = new Date(Date.UTC(2025, 5, 21, 18, 0, 0)); // June is month 5 (0-indexed)
  const now = new Date();
  const diffMs = targetDate - now;

  const countdownElement = document.getElementById("countdown-timer");
  if (!countdownElement) return;

  if (diffMs <= 0) {
    countdownElement.textContent = "It's Clog Spam Time!";
    return;
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  countdownElement.textContent =
    `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s to Clog Spam`;
}

setInterval(updateCountdown, 1000);
updateCountdown(); // initial call

// === View Counter ===
(function () {
  const viewKey = 'osrs_tracker_views';
  let views = parseInt(localStorage.getItem(viewKey)) || 0;
  views++;
  localStorage.setItem(viewKey, views);

  const viewElement = document.getElementById("view-counter");
  if (viewElement) {
    viewElement.textContent = `Views this browser: ${views}`;
  }
})();