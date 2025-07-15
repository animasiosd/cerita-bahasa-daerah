// File: js/auth.js (Revisi Final)

// 1. KONFIGURASI DAN INISIALISASI FIREBASE (tetap sama)
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

// 2. FUNGSI LOGOUT (tetap sama)
function logout() {
  auth.signOut();
}

// 3. LOGIKA UTAMA (diperbarui)
document.addEventListener('DOMContentLoaded', () => {
  // Ambil semua elemen yang relevan
  const pageLoader = document.getElementById("page-loader");
  const loginContainer = document.getElementById("loginContainer");
  const mainContent = document.getElementById("mainContent");
  const loginBtn = document.getElementById("loginBtn");

  // Tambahkan event ke tombol login jika ada
  if (loginBtn) {
    loginBtn.onclick = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(error => console.error("Login Gagal:", error));
    };
  }

  // Pantau status login user
  auth.onAuthStateChanged(user => {
    // Sembunyikan loader terlebih dahulu
    if(pageLoader) pageLoader.classList.add('d-none');

    if (user) {
      // Jika user login, tampilkan konten utama
      if(mainContent) mainContent.classList.remove('d-none');
      if(loginContainer) loginContainer.classList.add('d-none'); // Pastikan login form tersembunyi
      
      // Atur pesan selamat datang jika ada
      const welcomeMessage = document.getElementById("welcomeMessage");
      if (welcomeMessage && user.displayName) {
        welcomeMessage.textContent = `Selamat datang, ${user.displayName}!`;
      }
      
    } else {
      // Jika user TIDAK login, tampilkan kontainer login
      if(loginContainer) loginContainer.classList.remove('d-none');
      if(mainContent) mainContent.classList.add('d-none'); // Pastikan konten utama tersembunyi
    }
  });
});