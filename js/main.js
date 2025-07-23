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
        loadDynamicLanguages(); // Panggil setelah navbar dimuat
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
          console.log("Data Bahasa:", data); // ⬅ Tambahkan baris ini
      const bahasaList = data.headers;
      if (!Array.isArray(bahasaList) || bahasaList.length === 0) {
        dropdown.innerHTML = '<li><span class="dropdown-item text-muted">Daftar bahasa kosong.</span></li>';
        return;
      }

      dropdown.innerHTML = ''; // Kosongkan isi awal

      bahasaList.forEach(bahasa => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.href = `halaman-bahasa.html?bahasa=${encodeURIComponent(bahasa)}`;
        link.textContent = `Bahasa ${bahasa}`;
        listItem.appendChild(link);
        dropdown.appendChild(listItem);
      });
    })
    .catch(() => {
      dropdown.innerHTML = '<li><span class="dropdown-item text-danger">Gagal memuat bahasa.</span></li>';
    });
}
