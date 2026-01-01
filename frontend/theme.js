// Run immediately to prevent "Flash of White"
(function() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.setAttribute('data-theme', 'dark');
    }
})();

// Function to toggle (used by Settings page)
function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('darkMode', 'false');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('darkMode', 'true');
    }
}