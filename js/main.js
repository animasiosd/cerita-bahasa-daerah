// File: js/main.js

const BAHASA_API_URL = "https://script.google.com/macros/s/AKfycbwCT57fhlebRz7nKvvtmPxjKrR54-mQU3syiuRqspHX9nRubS-gg7RYkHybOlIwxdhyTg/exec";

document.addEventListener("DOMContentLoaded", function() {
  const navbarPlaceholder = document.getElementById("navbar-placeholder");

  if (navbarPlaceholder) {
    fetch("navbar.html")
      .then(response => {
        if (!response.ok) throw new Error("Gagal memuat navbar.");
        return response.text();
      })
      .then(html => {
        navbarPlaceholder.innerHTML = html;
        highlightActiveMenu();
        loadDynamicLanguages();
      })
      .catch(err => {
        console.error("Error memuat navbar:", err);
      });
  }
});

function highlightActiveMenu() {
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll('a[data-page]').forEach(link => {
    if (link.getAttribute('data-page') === currentPage) {
      link.classList.add('active');
    }
  });
}

function loadDynamicLanguages() {
  const dropdown = document.getElementById('languagesDropdown');
  if (!dropdown) return;

  fetch(BAHASA_API_URL)
    .then(response => response.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        dropdown.innerHTML = '<li><span class="dropdown-item text-muted">Daftar bahasa kosong.</span></li>';
        return;
      }

      dropdown.innerHTML = ''; // Bersihkan isi awal

      data.forEach(item => {
        const namaBahasa = item.bahasa;
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.href = `halaman-bahasa.html?bahasa=${encodeURIComponent(namaBahasa)}`;
        link.textContent = `Bahasa ${namaBahasa}`;
        listItem.appendChild(link);
        dropdown.appendChild(listItem);
      });

    })
    .catch(() => {
      dropdown.innerHTML = '<li><span class="dropdown-item text-danger">Gagal memuat bahasa.</span></li>';
    });
}
