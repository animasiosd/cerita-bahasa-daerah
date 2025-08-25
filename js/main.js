// File: js/main.js - Versi Final yang Diperbaiki

const BAHASA_API_URL = "https://script.google.com/macros/s/AKfycbwCT57fhlebRz7nKvvtmPxjKrR54-mQU3syiuRqspHX9nRubS-gg7RYkHybOlIwxdhyTg/exec";

// Listener utama yang akan berjalan di setiap halaman
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Memulai proses pemuatan navbar...");
  const navbarPlaceholder = document.getElementById("navbar-placeholder");
  if (!navbarPlaceholder) {
    console.warn("🟡 Placeholder navbar tidak ditemukan di halaman ini. Proses dihentikan.");
    return;
  }

  // Coba muat dari cache dulu untuk kecepatan
  console.log("🔍 Mengecek cache untuk 'navbarHTML'...");
  const cachedNavbar = localStorage.getItem('navbarHTML');
  if (cachedNavbar) {
    console.log("✅ Navbar berhasil dimuat dari cache.");
    navbarPlaceholder.innerHTML = cachedNavbar;
    initializeNavbarFunctions(); // Panggil fungsi setelah render dari cache
  } else {
    console.log("⚪️ Cache 'navbarHTML' kosong.");
  }

  // Tetap fetch versi terbaru dari server
  console.log("🌐 Memulai fetch 'navbar.html' dari server...");
  fetch('navbar.html')
    .then(res => {
      if (!res.ok) throw new Error(`Gagal memuat navbar. Status: ${res.status}`);
      console.log("👍 Fetch 'navbar.html' berhasil diterima.");
      return res.text();
    })
    .then(html => {
      // Hanya update DOM jika ada perubahan
      if (html !== cachedNavbar) {
        console.log("✨ Konten navbar baru ditemukan, memperbarui DOM dan menyimpan ke cache.");
        navbarPlaceholder.innerHTML = html;
        localStorage.setItem('navbarHTML', html);
      } else {
        console.log("👌 Konten navbar dari server sama dengan cache, tidak ada pembaruan DOM.");
      }
      initializeNavbarFunctions(); // Panggil fungsi setelah render dari fetch
    })
    .catch(err => {
      console.error("❌ Terjadi kesalahan saat fetch navbar:", err);
    });
});

// Fungsi untuk menginisialisasi semua fungsionalitas navbar
function initializeNavbarFunctions() {
  // Pastikan fungsi-fungsi ini hanya dipanggil sekali
  if (window.navbarInitialized) return;
  
  highlightActiveMenu();
  loadDynamicLanguages();
  
  // Inisialisasi fungsionalitas video jika di halaman yang tepat
  if (typeof initPage === 'function') {
      initPage();
  }

  window.navbarInitialized = true; // Tandai bahwa inisialisasi sudah selesai
}

// Fungsi untuk menandai menu aktif
function highlightActiveMenu() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll('a[data-page]').forEach(link => {
    if (link.getAttribute('data-page') === currentPage) {
      link.classList.add('active');
    }
  });
}

// Fungsi untuk memuat daftar bahasa secara dinamis
function loadDynamicLanguages() {
  return new Promise((resolve, reject) => {
    const dropdown = document.getElementById('languagesDropdown');
    if (!dropdown) {
      console.error("❌ Element #languagesDropdown tidak ditemukan.");
      return reject("Element #languagesDropdown tidak ditemukan");
    }

    fetch(BAHASA_API_URL)
      .then(response => response.json())
      .then(data => {
        const bahasaList = data;
        if (!Array.isArray(bahasaList) || bahasaList.length === 0) {
          dropdown.innerHTML = '<li><span class="dropdown-item text-muted">Daftar bahasa kosong.</span></li>';
          return resolve();
        }

        dropdown.innerHTML = ''; // Kosongkan placeholder

        bahasaList.forEach(bahasa => {
          if (!bahasa.value || !bahasa.display) return;
          const listItem = document.createElement('li');
          const link = document.createElement('a');
          link.className = 'dropdown-item language-btn';
          link.href = `halaman-bahasa.html?bahasa=${encodeURIComponent(bahasa.value)}`;
          // Menggunakan format yang benar untuk teks
          link.textContent = `Bahasa ${bahasa.display}`; 
          link.addEventListener("click", () => {
            logUserBehavior("language_selected", bahasa.display);
          });
          listItem.appendChild(link);
          dropdown.appendChild(listItem);
        });
        resolve();
      })
      .catch(err => {
        console.error("❌ Gagal memuat bahasa:", err);
        dropdown.innerHTML = '<li><span class="dropdown-item text-danger">Gagal memuat bahasa.</span></li>';
        reject(err);
      });
  });
}

// ======================================================================
// BAGIAN KODE UNTUK FUNGSI INSTALL PWA
// Tambahkan ini di bagian paling bawah file main.js Anda
// ======================================================================

// Variabel global untuk menyimpan event instalasi agar bisa dipanggil nanti
let deferredPrompt;

// 1. Listener untuk "menangkap" event saat browser siap menampilkan prompt instalasi
window.addEventListener('beforeinstallprompt', (e) => {
  // Mencegah browser menampilkan prompt mini-infobar default di Chrome
  e.preventDefault();
  
  // Simpan event tersebut agar bisa kita picu saat tombol diklik
  deferredPrompt = e;
  
  // Ambil tombol instalasi dari navbar
  const installButton = document.getElementById('manualInstallBtn');
  
  // Tampilkan tombol tersebut karena sekarang aplikasi bisa diinstal
  if (installButton) {
    installButton.style.display = 'block';
    console.log('✅ PWA siap untuk diinstal.');
  }
});

// 2. Listener untuk tombol install manual kita
// Kita pasang listener ke document karena navbar dimuat secara dinamis
document.addEventListener('click', (event) => {
  // Cek apakah yang diklik adalah tombol install kita
  if (event.target && event.target.id === 'manualInstallBtn') {
    
    // Pastikan event instalasi sudah ditangkap sebelumnya
    if (deferredPrompt) {
      // Tampilkan prompt instalasi default dari browser
      deferredPrompt.prompt();
      
      // Tunggu hasil pilihan pengguna (instal atau batal)
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('👍 Pengguna menerima instalasi PWA.');
          // Sembunyikan tombol setelah diinstal
          event.target.style.display = 'none';
        } else {
          console.log('👎 Pengguna menolak instalasi PWA.');
        }
        // Reset variabel setelah digunakan
        deferredPrompt = null;
      });
    } else {
      console.log('Event instalasi belum siap atau sudah digunakan.');
    }
  }
});

// 3. Listener untuk melacak saat aplikasi berhasil diinstal
window.addEventListener('appinstalled', (evt) => {
  console.log('🎉 Aplikasi berhasil diinstal.');
  // Kosongkan deferredPrompt agar tidak muncul lagi
  deferredPrompt = null;
});