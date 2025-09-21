// File: js/ui/common.js
import { auth } from './page_auth.js'
import { api_service } from '../load_data/api_service.js';
import { EventTracker } from '../events.js';

// ----------------------
// Ensure Material Symbols loaded (inject once)
// ----------------------
function ensureMaterialSymbols() {
  if (!document.querySelector('link[href*="Material+Symbols+Outlined"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined';
    document.head.appendChild(link);
  }
}

/**
 * Memeriksa status login dan mengubah 'href' pada elemen dengan kelas '.smart-redirect'
 * jika pengguna belum login.
 */
export function initializeSmartRedirects() {
  const smartButtons = document.querySelectorAll('.smart-redirect');
  
  smartButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      // Mencegah tautan melakukan aksi default (pindah ke href="#")
      event.preventDefault(); 
      
      // Cek status login saat ini secara langsung
      const user = auth.currentUser; 

      if (user) {
        // Jika pengguna sudah login, arahkan ke home
        window.location.href = '/home.html';
      } else {
        // Jika pengguna belum login, arahkan ke index
        window.location.href = '/index.html';
      }
    });
  });
}
/**
 * Memuat dan menginisialisasi navbar.
 */
export function initializeNavbar() {
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
  ensureMaterialSymbols();
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

  // --- TAMBAHAN BARU: MEMASANG EVENT LISTENER UNTUK TRACKING ---
  const navLogoLink = document.getElementById('navLogoLink');
  if (navLogoLink) {
    navLogoLink.addEventListener('click', () => EventTracker.navigation.logoClick());
  }

  const navBerandaLink = document.getElementById('navBerandaLink');
  if (navBerandaLink) {
    navBerandaLink.addEventListener('click', () => EventTracker.navigation.berandaClick());
  }

  const navDownloadLink = document.getElementById('navDownloadLink');
  if (navDownloadLink) {
    navDownloadLink.addEventListener('click', () => EventTracker.navigation.downloadClick());
  }
  // --- AKHIR TAMBAHAN ---

  // --- Tutup menu jika klik area luar (mobile slide) ---
document.addEventListener('click', (e) => {
  const navbarNav   = document.getElementById('navbarNav');
  const hamburger   = document.querySelector('.navbar-toggler');
  const isExpanded  = hamburger?.getAttribute('aria-expanded') === 'true';

  // jika menu terbuka dan klik di luar menu & bukan tombol hamburger
  if (
    isExpanded &&
    !navbarNav.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    const bsCollapse = bootstrap.Collapse.getInstance(navbarNav);
    if (bsCollapse) {
      bsCollapse.hide(); // collapse kembali
    }
  }
});

const closeBtn = document.getElementById("closeMobileMenu");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    const nav = document.getElementById("navbarNav");
    const bsCollapse = bootstrap.Collapse.getInstance(nav);
    if (bsCollapse) bsCollapse.hide();
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
            EventTracker.pwa.installAccepted(); // Tracking diterima
            event.target.style.display = 'none';
          } else {
            EventTracker.pwa.installDismissed();
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