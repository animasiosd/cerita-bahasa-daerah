// File: js/auth.js

// 1️⃣ KONFIGURASI DAN INISIALISASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCAOg2aMzFVCQVx07t85lFpTXv3c2ugL1E",
  authDomain: "animasiosd-github.firebaseapp.com",
  projectId: "animasiosd-github",
  storageBucket: "animasiosd-github.firebasestorage.app",
  messagingSenderId: "424179260770",
  appId: "1:424179260770:web:2f4a04a8c9643027bca03b",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ▼▼▼ FUNGSI BARU UNTUK MENGATUR SELURUH NAVBAR ▼▼▼
function toggleNavbarVisibility(user) {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        if (user) {
            // Jika ada user, tampilkan navbar
            navbarPlaceholder.style.display = 'block';
        } else {
            // Jika tidak ada user, sembunyikan navbar
            navbarPlaceholder.style.display = 'none';
        }
    }
}

// 2️⃣ FUNGSI LOGOUT GLOBAL
function logout() {
  auth.signOut().then(() => {
    // Arahkan pengguna kembali ke halaman utama setelah logout berhasil
    window.location.href = 'index.html';
  }).catch((error) => {
    // Menangani jika terjadi error saat logout
    console.error('Logout Error:', error);
  });
}


// 3️⃣ PANTAU STATUS LOGIN DI SETIAP HALAMAN
document.addEventListener('DOMContentLoaded', () => {
  const pageLoader = document.getElementById("page-loader");
  const loginContainer = document.getElementById("loginContainer");
  const mainContent = document.getElementById("mainContent");

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(error => {
        console.error("Login Gagal:", error);
        alert("Login gagal. Silakan coba lagi.");
      });
    };
  }

  auth.onAuthStateChanged(user => {
    // Panggil fungsi visibilitas navbar
    toggleNavbarVisibility(user);

    if (pageLoader) pageLoader.classList.add('d-none');

    if (user) {
      if (mainContent) mainContent.classList.remove('d-none');
      if (loginContainer) loginContainer.classList.add('d-none');

            // Tampilkan kembali tombol "Pilih Bahasa"
      if (languageDropdown) {
        languageDropdown.parentElement.style.display = 'block';
      }

      const welcomeMessage = document.getElementById("welcomeMessage");
      if (welcomeMessage && user.displayName) {
        welcomeMessage.textContent = `Selamat datang, ${user.displayName}!`;
      }
    } else {
      if (loginContainer) loginContainer.classList.remove('d-none');
      if (mainContent) mainContent.classList.add('d-none');
            // Sembunyikan tombol "Pilih Bahasa"
      if (languageDropdown) {
        languageDropdown.parentElement.style.display = 'none';
      }
    }
  });
});
