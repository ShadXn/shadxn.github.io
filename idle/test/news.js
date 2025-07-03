fetch('news.json')
  .then(res => res.json())
  .then(newsItems => {
    const container = document.getElementById("news-container");
    const nav = document.getElementById("news-sidebar");

    newsItems.forEach(item => {
      const versionId = `version-${item.version.replace('.', '')}`;

      // 📰 News section content
      const section = document.createElement("section");
      section.id = versionId;
      section.innerHTML = `<h3>${item.title}</h3><p>${item.content.replace(/\n/g, '<br>')}</p><hr>`;
      container.appendChild(section);

      // 🧭 Sidebar link
      const li = document.createElement("li");
      li.innerHTML = `<a href="#${versionId}" class="nav-link">${item.title}</a>`;
      nav.appendChild(li);
    });

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

document.getElementById("open-news-btn").addEventListener("click", () => {
  document.getElementById("news-overlay").style.display = "block";
});

document.getElementById("close-news-btn").addEventListener("click", () => {
  document.getElementById("news-overlay").style.display = "none";
});