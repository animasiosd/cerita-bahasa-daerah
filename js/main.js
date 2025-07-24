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

        // Panggil fungsi visibilitas navbar yang baru
        toggleNavbarVisibility(firebase.auth().currentUser);

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

// File: js/main.js

function loadDynamicLanguages() {
  // Tunggu sebentar untuk memastikan navbar.html sudah sepenuhnya dimuat
  setTimeout(() => {
    const dropdown = document.getElementById('languagesDropdown');
    if (!dropdown) {
      console.error("❌ Element #languagesDropdown masih belum ditemukan. Cek kembali navbar.html.");
      return;
    }

    fetch(BAHASA_API_URL)
      .then(response => response.json())
      .then(data => {
        const bahasaList = data;
        if (!Array.isArray(bahasaList) || bahasaList.length === 0) {
          dropdown.innerHTML = '<li><span class="dropdown-item text-muted">Daftar bahasa kosong.</span></li>';
          return;
        }

        dropdown.innerHTML = ''; // Kosongkan placeholder

        bahasaList.forEach(bahasa => {
          if (!bahasa.value || !bahasa.display) return; // Lewati data yang tidak lengkap

          const listItem = document.createElement('li');
          const link = document.createElement('a');
          link.className = 'dropdown-item';
          
          // UBAH BAGIAN INI: Tambahkan 'display' sebagai parameter URL baru
          link.href = `halaman-bahasa.html?bahasa=${encodeURIComponent(bahasa.value)}&display=${encodeURIComponent(bahasa.display)}`;
          
          link.textContent = `Bahasa ${bahasa.display}`; // Tampilkan nama yang rapi
          listItem.appendChild(link);
          dropdown.appendChild(listItem);
        });
      })
      .catch((err) => {
        console.error("❌ Gagal memuat bahasa:", err);
        dropdown.innerHTML = '<li><span class="dropdown-item text-danger">Gagal memuat bahasa.</span></li>';
      });
  }, 100); // Penundaan 100ms untuk stabilitas
}