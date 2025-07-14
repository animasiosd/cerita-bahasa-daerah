// File: js/main.js
document.addEventListener("DOMContentLoaded", function() {
  // Cari placeholder untuk navbar
  const navbarPlaceholder = document.getElementById("navbar-placeholder");
  
  // Jika placeholder ditemukan, muat navbar.html ke dalamnya
  if (navbarPlaceholder) {
    fetch("navbar.html")
      .then(response => response.text())
      .then(data => {
        navbarPlaceholder.innerHTML = data;
      });
  }
});