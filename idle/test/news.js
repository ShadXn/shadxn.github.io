// news.js — handles news display and version updates
document.addEventListener("DOMContentLoaded", () => {
    // Render news overlay
    renderNewsOverlay();

    document.getElementById("open-news-btn").addEventListener("click", () => {
        document.getElementById("news-overlay").style.display = "block";
        document.body.style.overflow = "hidden"; // ✅ prevent background scroll
    });

    document.getElementById("close-news-btn").addEventListener("click", () => {
        document.getElementById("news-overlay").style.display = "none";
        document.body.style.overflow = ""; // ✅ restore scroll
    });

});

// Render news
function renderNewsOverlay() {
    fetch('news.json')
    .then(res => res.json())
    .then(newsItems => {
        const container = document.getElementById("news-container");
        const nav = document.getElementById("news-sidebar");

        // ✅ Clear old content to avoid duplicates
        container.innerHTML = '';
        nav.innerHTML = '';

        newsItems.forEach(item => {
        const versionId = `version-${item.version.replace('.', '')}`;

        // News section content
        const section = document.createElement("section");
        section.id = versionId;
        section.innerHTML = `
            <h3>${item.title}</h3>
            ${item.date ? `<div class="text-muted mb-2" style="font-size: 0.9rem;">🗓️ ${formatLocalizedDate(item.date)}</div>` : ''}
            ${marked.parse(item.content)}
            <hr>
        `;

        container.appendChild(section);

        // Sidebar link
        const li = document.createElement("li");
        li.innerHTML = `<a href="#${versionId}" class="nav-link">${item.title}</a>`;
        nav.appendChild(li);
        });

        // 🔍 Compare with localStorage and show popup if needed
        const lastPlayedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
        console.log("Stored version:", lastPlayedVersion);
        console.log("Current version:", CURRENT_GAME_VERSION);

        if (lastPlayedVersion !== CURRENT_GAME_VERSION) {
            // Clean storage before doing anything else
            cleanLocalStorage(LOCALSTORAGE_WHITELIST);
            const latest = newsItems.find(item => item.version === CURRENT_GAME_VERSION);
        if (latest) {
            const modalTitle = document.getElementById("update-version-label");
            const modalBody = document.getElementById("update-modal-body");

            if (modalTitle && modalBody) {
            modalTitle.textContent = latest.version;
            modalBody.innerHTML = marked.parse(latest.content);

            const modalElement = document.getElementById("updateModal");
            const modal = new bootstrap.Modal(modalElement);

            modalElement.addEventListener('shown.bs.modal', () => {
                // Bootstrap confirms modal is fully open and aria-hidden is removed
                console.log("✅ Modal is fully shown and accessible.");
            });
            modal.show();
            }
        }

        // ✅ Store new version so popup only shows once
        localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_GAME_VERSION);
        console.log("Version saved to localStorage:", CURRENT_GAME_VERSION);
        }

        // Smooth scroll for sidebar links
        document.querySelectorAll('#news-overlay a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            }
        });
        });
    });
}

// Date formatting function
function formatLocalizedDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  let userPref = localStorage.getItem("preferred_date_format") || "auto";
  let locale;

  switch (userPref) {
    case "en-US":
    case "en-GB":
    case "fr-FR":
    case "de-DE":
      locale = userPref;
      break;
    case "auto":
    default:
      locale = navigator.language || 'en-US';
  }

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
