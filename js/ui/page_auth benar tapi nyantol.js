import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase_config.js";

// Inisialisasi Firebase Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// Meminta akses scope tambahan untuk data demografi
provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
provider.addScope("https://www.googleapis.com/auth/user.gender.read");

/**
 * Fungsi untuk logout pengguna.
 * Mengarahkan pengguna kembali ke halaman index.
 * Skenario: 11
 */
const logout = () => {
  signOut(auth)
    .then(() => {
      console.log("Pengguna berhasil logout.");
      window.location.href = "/index.html";
    })
    .catch((error) => {
      console.error("Gagal melakukan logout:", error);
    });
};

/**
 * Menginisialisasi tombol login Google.
 * Menggunakan signInWithRedirect untuk pengalaman pengguna yang lebih baik.
 */
const initializeLoginPage = () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      // Simpan halaman tujuan jika ada, jika tidak, arahkan ke home.html
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/home.html";
      sessionStorage.setItem("redirectAfterLogin", redirectTo);
      signInWithRedirect(auth, provider);
    });
  }
};

/**
 * Fungsi utama untuk mengelola akses halaman berdasarkan status login dan izin lokasi.
 * @param {function} [callback] - Fungsi yang akan dijalankan jika akses diizinkan.
 */
const managePageAccess = (callback) => {
  onAuthStateChanged(auth, async (user) => {
    const protectedPages = ["home.html", "bahasa.html", "download.html", "locationtutorial.html"];
    const publicPages = ["login.html", "index.html", "privacy_policy.html", "terms_of_service.html", "404.html"];
    const currentPage = window.location.pathname.split("/").pop();

    if (user) {
      // --- PENGGUNA SUDAH LOGIN ---
      const permissionStatus = await navigator.permissions.query({ name: "geolocation" });

      // Cek izin lokasi dan arahkan sesuai kondisi
      handleLoggedInUser(permissionStatus.state, currentPage, protectedPages, publicPages, callback);

      // Tambahkan listener untuk memantau perubahan izin lokasi secara real-time
      permissionStatus.onchange = () => {
        handleLoggedInUser(permissionStatus.state, currentPage, protectedPages, publicPages, callback);
      };

    } else {
      // --- PENGGUNA BELUM LOGIN ---
      // Skenario 2: Jika mencoba akses halaman terproteksi, lempar ke index.html
      if (protectedPages.includes(currentPage)) {
        console.log("Akses ditolak. Silakan login terlebih dahulu.");
        window.location.replace("/index.html");
        return;
      }
      // Skenario 1: Jika di halaman publik, izinkan akses.
      console.log("Pengguna belum login, akses halaman publik diizinkan.");
      // Tampilkan UI untuk login jika ada
      const loginContainer = document.getElementById('loginContainer');
      if (loginContainer) loginContainer.style.display = 'block';
    }

    // Sembunyikan loader setelah pengecekan selesai
    const pageLoader = document.getElementById('page-loader');
    if (pageLoader) pageLoader.style.display = 'none';
  });
};

/**
 * Logika internal untuk menangani pengguna yang sudah login berdasarkan status izin lokasi.
 */
function handleLoggedInUser(permissionState, currentPage, protectedPages, publicPages, callback) {
  switch (permissionState) {
    case "granted":
      // Skenario 3 & 4 & 13: Izin sudah diberikan
      if (publicPages.includes(currentPage)) {
        // Jika pengguna sudah login dan punya izin, tapi malah buka halaman index,
        // arahkan otomatis ke home.
        window.location.replace("/home.html");
      } else if (protectedPages.includes(currentPage)) {
        // Akses diizinkan ke halaman terproteksi
        console.log("Akses diizinkan, izin lokasi diberikan.");
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'block';
        if (callback) callback();
      }
      break;

    case "prompt":
    case "denied":
      // Skenario 5 & 6: Izin belum diberikan atau ditolak
      // Arahkan ke halaman tutorial jika belum berada di sana
      if (currentPage !== "locationtutorial.html") {
        console.log(`Izin lokasi status: ${permissionState}. Mengarahkan ke tutorial.`);
        sessionStorage.setItem("redirectAfterPermission", currentPage);
        window.location.replace("/locationtutorial.html");
      }
      break;
  }
}

/**
 * FUNGSI BARU untuk menangani permintaan izin di halaman locationtutorial.html
 * @param {function} onDenied - Callback jika izin ditolak. Menerima argumen boolean (isPermanent).
 */
const handleLocationPermissionRequest = (onDenied) => {
  // Skenario 7: Meminta izin lokasi kepada browser
  navigator.geolocation.getCurrentPosition(
    // --- SUKSES ---
    (position) => {
      // Skenario 8: Pengguna memberikan izin
      console.log("Izin lokasi berhasil diberikan.", position);
      const redirectTo = sessionStorage.getItem("redirectAfterPermission") || "/home.html";
      window.location.replace(redirectTo);
    },
    // --- GAGAL ---
    async (error) => {
      // Cek ulang status izin untuk membedakan penolakan sementara atau permanen
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      if (error.code === error.PERMISSION_DENIED) {
        if (permissionStatus.state === 'denied') {
          // Skenario 10: Izin ditolak secara permanen di pengaturan browser
          console.log("Izin ditolak permanen.");
          if (onDenied) onDenied(true); // Kirim status permanen
        } else {
          // Skenario 9: Izin ditolak dari prompt yang muncul
          console.log("Izin ditolak dari prompt.");
          if (onDenied) onDenied(false); // Kirim status tidak permanen
        }
      }
    }
  );
};

export { auth, logout, initializeLoginPage, managePageAccess, handleLocationPermissionRequest };