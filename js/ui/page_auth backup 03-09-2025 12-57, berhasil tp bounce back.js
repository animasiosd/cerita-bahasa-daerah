import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase_config.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
provider.addScope("https://www.googleapis.com/auth/user.gender.read");

// Daftar halaman tanpa .html
const protectedPages = ["home", "bahasa", "download", "locationtutorial"];
const publicPages = ["login", "index", "privacy_policy", "terms_of_service", "404"];

/**
 * Fungsi logout → hanya mengandalkan Firebase
 */
const logout = async () => {
  try {
    console.log("🔄 Proses logout dimulai...");
    await signOut(auth);
    console.log("✅ Logout berhasil dari Firebase");
    window.location.replace("/");
  } catch (error) {
    console.error("❌ Gagal logout:", error);
  }
};

/**
 * Fungsi untuk normalisasi nama halaman → tanpa .html
 */
const getNormalizedPage = () => {
  let currentPage = window.location.pathname.split("/").pop().split("?")[0];

  // Jika kosong → anggap sebagai index
  if (currentPage === "") currentPage = "index";

  return currentPage;
};

/**
 * Hapus .html di URL secara global (SEO friendly)
 */
const cleanUrl = () => {
  const path = window.location.pathname;
  if (path.endsWith(".html")) {
    const newPath = path.replace(/\.html$/, "");
    window.history.replaceState({}, "", newPath + window.location.search);
  }
};

/**
 * Fungsi untuk login menggunakan Google
 */
const initializeLoginPage = () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      try {
        console.log("🔑 Memulai proses login Google...");
        const result = await signInWithPopup(auth, provider);
        console.log(`✅ Login berhasil sebagai ${result.user.email}`);

        // Redirect kembali ke halaman yang diminta, atau default ke /home
        const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/home";
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.replace(redirectTo);

      } catch (error) {
        console.error("❌ Login gagal:", error.message);
        alert("Login gagal. Silakan coba lagi!");
      }
    });
  }
};


/**
 * Fungsi utama untuk mengelola akses halaman
 */
const managePageAccess = (callback) => {
  cleanUrl(); // Pastikan URL bersih tanpa .html
  const currentPage = getNormalizedPage();

  console.log("🔄 Mengecek status login langsung ke Firebase...");
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
  console.log("⛔ Tidak login menurut Firebase");

  // Kalau user akses halaman protected → simpan tujuan & redirect ke login
  if (protectedPages.includes(currentPage)) {
    console.log(`🔒 Akses ditolak ke halaman: ${currentPage}`);
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
    window.location.replace("/login");
    return;
  }

  console.log("✅ Halaman publik, akses diizinkan");
  const loginContainer = document.getElementById("loginContainer");
  if (loginContainer) loginContainer.style.display = "block";

  const pageLoader = document.getElementById("page-loader");
  if (pageLoader) pageLoader.style.display = "none";

  return;
}


    // --- Jika user sudah login ---
    console.log(`✅ User login terdeteksi: ${user.email}`);

    // Kalau user buka halaman login/index, redirect ke home
    if (publicPages.includes(currentPage)) {
      console.log("🔄 User sudah login → redirect ke home");
      window.location.replace("/home");
      return;
    }

    // Jika user buka halaman protected, cek izin lokasi
    const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
    handleLoggedInUser(permissionStatus.state, currentPage, callback);

    permissionStatus.onchange = () => {
      handleLoggedInUser(permissionStatus.state, currentPage, callback);
    };

    const pageLoader = document.getElementById("page-loader");
    if (pageLoader) pageLoader.style.display = "none";
  });
};

/**
 * Fungsi untuk menangani user login + cek izin lokasi
 */
function handleLoggedInUser(permissionState, currentPage, callback) {
  switch (permissionState) {
    case "granted":
      console.log("📍 Izin lokasi diberikan");
      const mainContent = document.getElementById("mainContent");
      if (mainContent) mainContent.classList.remove("d-none");
      if (callback) callback();
      break;

    case "prompt":
    case "denied":
      if (currentPage !== "locationtutorial") {
        console.log(`⚠️ Izin lokasi status: ${permissionState} → redirect ke tutorial`);
        sessionStorage.setItem("redirectAfterPermission", currentPage);
        window.location.replace("/locationtutorial");
      }
      break;
  }
}

/**
 * Fungsi untuk meminta izin lokasi di halaman locationtutorial
 */
const handleLocationPermissionRequest = (onDenied) => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("📍 Izin lokasi berhasil:", position);
      const redirectTo = sessionStorage.getItem("redirectAfterPermission") || "/home";
      window.location.replace(redirectTo);
    },
    async (error) => {
      const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
      if (error.code === error.PERMISSION_DENIED) {
        console.log("⛔ Izin lokasi ditolak");
        if (onDenied) onDenied(permissionStatus.state === "denied");
      }
    }
  );
};

/**
 * Pasang event listener logout hanya di halaman yang punya tombol logout
 */
const attachLogoutHandler = () => {
  const currentPage = getNormalizedPage();

  // Jika halaman publik, tidak perlu cek tombol logout
  if (publicPages.includes(currentPage)) {
    console.log("ℹ️ Halaman publik, tidak pasang listener logout");
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("🔄 Tombol logout diklik");
      await logout();
    });
  } else {
    console.warn("⚠️ Tombol logout belum ada, coba cek lagi 300ms...");
    setTimeout(attachLogoutHandler, 300);
  }
};

document.addEventListener("DOMContentLoaded", attachLogoutHandler);

export { auth, logout, initializeLoginPage, managePageAccess, handleLocationPermissionRequest };
