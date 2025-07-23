const BAHASA_API_URL = "https://script.google.com/macros/s/AKfycbwCT57fhlebRz7nKvvtmPxjKrR54-mQU3syiuRqspHX9nRubS-gg7RYkHybOlIwxdhyTg/exec";

document.addEventListener("DOMContentLoaded", function () {
  const navbarPlaceholder = document.getElementById("navbar-placeholder");

  if (navbarPlaceholder) {
    fetch("navbar.html")
      .then(response => {
        if (!response.ok) throw new Error("Gagal memuat navbar.");
        return response.text();
      })
      .then(html => {
        navbarPlaceholder.innerHTML = html;

        requestAnimationFrame(() => {
          console.log("Cek elemen #languagesDropdown:", document.getElementById("languagesDropdown"));
          highlightActiveMenu();
          loadDynamicLanguages();

          // Tunggu sampai fungsi dari video.js & comments.js tersedia
          const waitUntilReady = () => {
            if (
              typeof firebase !== 'undefined' &&
              typeof initPage === 'function' &&
              typeof loadComments === 'function'
            ) {
              initPage(); // dari video.js
            } else {
              requestAnimationFrame(waitUntilReady);
            }
          };
          waitUntilReady();
        });
      })
      .catch(err => {
        console.error("❌ Error memuat navbar:", err);
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
  if (!dropdown) {
    console.warn("⚠️ Element #languagesDropdown tidak ditemukan");
    return;
  }

  fetch(BAHASA_API_URL)
    .then(response => response.json())
    .then(data => {
      console.log("🧩 Data Bahasa dari API:", data);

       // ✅ SEKARANG 'data' adalah array of objects, bukan data.headers
      const bahasaList = data; 
      if (!Array.isArray(bahasaList) || bahasaList.length === 0) {
        dropdown.innerHTML = '<li><span class="dropdown-item text-muted">Daftar bahasa kosong.</span></li>';
        return;
      }

      dropdown.innerHTML = '';

       // ✅ Sesuaikan perulangan untuk menggunakan properti .value dan .display
      bahasaList.forEach(bahasa => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        // Gunakan 'bahasa.value' untuk URL
        link.href = `halaman-bahasa.html?bahasa=${encodeURIComponent(bahasa.value)}`;
        // Gunakan 'bahasa.display' untuk teks yang tampil
        link.textContent = `Bahasa ${bahasa.display}`; 
        listItem.appendChild(link);
        dropdown.appendChild(listItem);
      });
    })
    .catch((err) => {
      console.error("❌ Gagal memuat bahasa:", err);
      dropdown.innerHTML = '<li><span class="dropdown-item text-danger">Gagal memuat bahasa.</span></li>';
    });
}
