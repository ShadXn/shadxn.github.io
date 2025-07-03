document.getElementById("open-news-btn").addEventListener("click", () => {
    document.getElementById("news-overlay").style.display = "block";
    });

    document.getElementById("close-news-btn").addEventListener("click", () => {
    document.getElementById("news-overlay").style.display = "none";
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('#news-overlay a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
