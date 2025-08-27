// ======================================================================
// File: js/ui/common.js
// Deskripsi: Menangani logika UI untuk komponen umum seperti navbar,
//            PWA install button, dan page loader.
// Asal Kode: main.js
// ======================================================================

const BAHASA_API_URL = "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec";

/**
 * Memuat dan menginisialisasi navbar.
 */
function initializeNavbar() {
  const navbarPlaceholder = document.getElementById("navbar-placeholder");
  if (!navbarPlaceholder) return;

  const cachedNavbar = localStorage.getItem('navbarHTML');
  if (cachedNavbar) {
    navbarPlaceholder.innerHTML = cachedNavbar;
    setupNavbarFunctionality();
  }

  fetch('navbar.html')
    .then(res => res.ok ? res.text() : Promise.reject(`Status: ${res.status}`))
    .then(html => {
      if (html !== cachedNavbar) {
        navbarPlaceholder.innerHTML = html;
        localStorage.setItem('navbarHTML', html);
      }
      setupNavbarFunctionality();
    })
    .catch(err => console.error("Gagal memuat navbar:", err));
}

/**
 * Menjalankan fungsi-fungsi setelah navbar dirender.
 */
function setupNavbarFunctionality() {
  if (window.navbarInitialized) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll('a[data-page]').forEach(link => {
    if (link.getAttribute('data-page') === currentPage) {
      link.classList.add('active');
    }
  });

  const dropdown = document.getElementById('languagesDropdown');
  if (dropdown) {
    // --- PERUBAHAN DI SINI ---
    // Memanggil service, bukan fetch langsung.
    api_service.fetchLanguages()
      .then(bahasaList => {
        dropdown.innerHTML = '';
        if (bahasaList.length === 0) throw new Error("Daftar bahasa kosong.");
        bahasaList.forEach(bahasa => {
          if (!bahasa.value || !bahasa.display) return;
          const listItem = document.createElement('li');
          const link = document.createElement('a');
          link.className = 'dropdown-item';
          link.href = `bahasa.html?bahasa=${encodeURIComponent(bahasa.value)}`;
          link.textContent = `Bahasa ${bahasa.display}`;
          link.addEventListener("click", () => EventTracker.navigation.languageSelect(bahasa.display));
          listItem.appendChild(link);
          dropdown.appendChild(listItem);
        });
      })
      .catch(err => {
        console.error("Gagal memuat bahasa:", err);
        dropdown.innerHTML = '<li><span class="dropdown-item text-danger">Gagal memuat.</span></li>';
      });
  }

  initializePWAInstallButton();
  window.navbarInitialized = true;
}

/**
 * Menginisialisasi fungsionalitas untuk tombol instalasi PWA.
 */
function initializePWAInstallButton() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installButton = document.getElementById('manualInstallBtn');
    if (installButton) {
      installButton.style.display = 'block';
    }
  });

  // Menggunakan event delegation karena navbar dimuat dinamis
  document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'manualInstallBtn') {
      EventTracker.pwa.installClick(); // Tracking klik
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            event.target.style.display = 'none';
          }
          deferredPrompt = null;
        });
      }
    }
  });

  window.addEventListener('appinstalled', () => {
    const installButton = document.getElementById('manualInstallBtn');
    if (installButton) {
        installButton.style.display = 'none';
    }
    deferredPrompt = null;
  });
}