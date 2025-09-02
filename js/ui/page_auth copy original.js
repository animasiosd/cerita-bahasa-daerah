// ======================================================================
// File: js/ui/page_auth.js (FINAL STABIL + LOGGER)
// Deskripsi: Penjaga Gerbang Akses Halaman (Publik/Privat) + Alur Login & Izin Lokasi
// Catatan:
// - Tambahan: logger terintegrasi untuk debug & tracking skenario
// ======================================================================

"use strict";

import { EventTracker } from '../events.js';
import { user_data_service } from '../load_data/user_data_service.js';

// ==================== Firebase Imports ==================== //
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsWkjQp6LxyZX6NZ9Z4rlnY4ygKHJDspU",
  authDomain: "ceritabahasadaerah.firebaseapp.com",
  projectId: "ceritabahasadaerah",
  storageBucket: "ceritabahasadaerah.firebasestorage.app",
  messagingSenderId: "619825814461",
  appId: "1:619825814461:web:c4b6a51097fc8648d650d4",
  measurementId: "G-ENLD2274X0"
};

// === Inisialisasi Firebase ===
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/profile.agerange.read");
provider.addScope("https://www.googleapis.com/auth/user.gender.read");
provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
provider.setCustomParameters({ prompt: "consent" });

// =============================================================
// --- KONFIGURASI HALAMAN ---
// =============================================================
const PUBLIC_PAGES = [
  "/", "/index.html",
  "/404.html",
  "/locationtutorial.html",
  "/privacy_policy.html",
  "/terms_of_service.html",
  "/login.html"
];

const PRIVATE_PAGES = [
  "/home.html",
  "/bahasa.html",
  "/download.html"
];

// Helper normalisasi path untuk mempermudah pencocokan
function normalizePath(p) {
  if (!p) return "/";
  const parts = p.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  return "/" + parts[parts.length - 1].toLowerCase();
}

function isPublicPath(currentPath) {
  const cp = currentPath.toLowerCase();
  return PUBLIC_PAGES.some(p => cp.endsWith(p.toLowerCase()));
}

function isPrivatePath(currentPath) {
  const cp = currentPath.toLowerCase();
  return PRIVATE_PAGES.some(p => cp.endsWith(p.toLowerCase()));
}

function isKnownPath(currentPath) {
  const cp = currentPath.toLowerCase();
  return [...PUBLIC_PAGES, ...PRIVATE_PAGES].some(p => cp.endsWith(p.toLowerCase()));
}

// =============================================================
// --- FUNGSI UTAMA PENJAGA HALAMAN ---
// =============================================================
function managePageAccess(pageSpecificInit) {
  console.log("[AUTH] managePageAccess() dipanggil");

  onAuthStateChanged(auth, async (user) => {
    const rawPath = window.location.pathname;
    const currentPath = normalizePath(rawPath);
    const fullUrl = window.location.href;

    console.log("[AUTH] Path sekarang:", currentPath, "| Full URL:", fullUrl);
    console.log("[AUTH] Status login:", user ? "SUDAH LOGIN" : "BELUM LOGIN");

    handleAuthUIState(user);

    if (!isKnownPath(currentPath)) {
      console.warn("[AUTH] Path tidak dikenal → redirect ke 404.html");
      window.location.replace("/404.html");
      return;
    }

    // Halaman Publik
    if (isPublicPath(currentPath)) {
      console.log("[AUTH] Halaman publik terdeteksi:", currentPath);

      if (currentPath.endsWith("/locationtutorial.html") && !user) {
        console.warn("[AUTH] Harus login untuk akses locationtutorial.html");
        alert("Anda harus login terlebih dahulu.");
        window.location.replace("/login.html");
        return;
      }

      if (currentPath.endsWith("/locationtutorial.html") && user) {
        const granted = await isLocationGranted();
        console.log("[AUTH] Izin lokasi saat ini:", granted);
        if (granted) {
          const redirectUrl = sessionStorage.getItem("redirectAfterPermission") || "/home.html";
          console.log("[AUTH] Lokasi granted → redirect ke:", redirectUrl);
          sessionStorage.removeItem("redirectAfterPermission");
          window.location.replace(redirectUrl);
          return;
        }
      }

      if (currentPath.endsWith("/login.html") && user) {
        console.log("[AUTH] Sudah login, redirect dari login.html → home.html");
        window.location.replace("/home.html");
        return;
      }

      console.log("[AUTH] Halaman publik diakses, tidak ada redirect");
      if (typeof pageSpecificInit === "function") pageSpecificInit();
      return;
    }

    // Halaman Privat
    console.log("[AUTH] Halaman privat terdeteksi:", currentPath);

    if (!user) {
      console.warn("[AUTH] Belum login, redirect ke login.html");
      sessionStorage.setItem("redirectAfterPermission", fullUrl);
      window.location.replace("/login.html");
      return;
    }

    const granted = await isLocationGranted();
    console.log("[AUTH] Status izin lokasi:", granted);

    if (granted) {
      console.log("[AUTH] Lokasi granted, jalankan pageSpecificInit");
      if (typeof pageSpecificInit === "function") pageSpecificInit();
      return;
    }

    console.warn("[AUTH] Lokasi belum granted → redirect ke locationtutorial.html");
    sessionStorage.setItem("redirectAfterPermission", fullUrl);
    window.location.replace("/locationtutorial.html");
  });
}

// =============================================================
// --- CEK IZIN LOKASI ---
// =============================================================
async function isLocationGranted() {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    console.log("[AUTH] Cek izin lokasi:", status.state);
    return status.state === "granted";
  } catch (e) {
    console.error("[AUTH] Gagal memeriksa izin lokasi:", e);
    return false;
  }
}

// =============================================================
// --- LOGIN & LOGOUT ---
// =============================================================
function initializeLoginPage() {
  console.log("[AUTH] initializeLoginPage() dipanggil");
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  loginBtn.addEventListener("click", async () => {
    console.log("[AUTH] Tombol login diklik");
    EventTracker?.auth?.loginClick?.();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("[AUTH] Login berhasil:", result.user.email);
      const user = result.user;
      const accessToken = result.credential?.accessToken || null;

      try {
        const profileData = await user_data_service.fetchGoogleProfile(accessToken);
        sessionStorage.setItem("ageData", JSON.stringify(profileData || {}));
        console.log("[AUTH] Data profil Google disimpan");
      } catch {
        console.warn("[AUTH] Gagal mengambil profil Google");
      }

      let redirectUrl = sessionStorage.getItem("redirectAfterPermission") || "/home.html";
      if (!redirectUrl.startsWith("/")) redirectUrl = "/home.html";
      console.log("[AUTH] Redirect setelah login:", redirectUrl);
      sessionStorage.removeItem("redirectAfterPermission");
      window.location.replace(redirectUrl);
    } catch (error) {
      console.error("[AUTH] Login Gagal:", error);
      showLoginFailModal(error?.message || "Login gagal. Silakan coba lagi.");
    }
  });
}

function logout() {
  console.log("[AUTH] Proses logout dimulai");
  EventTracker?.auth?.logoutClick?.();
  signOut(auth)
    .then(() => {
      console.log("[AUTH] Logout berhasil, redirect ke index.html");
      window.location.replace("/index.html");
    })
    .catch((error) => console.error("[AUTH] Logout Error:", error));
}

// =============================================================
// --- LOCATIONTUTORIAL HANDLER ---
// =============================================================
function handleLocationTutorialProceed() {
  console.log("[AUTH] handleLocationTutorialProceed() dipanggil");
  navigator.permissions.query({ name: "geolocation" }).then(status => {
    const redirectUrl = sessionStorage.getItem("redirectAfterPermission");
    const finalDestination = redirectUrl || "/home.html";

    console.log("[AUTH] Status izin lokasi di tutorial:", status.state);

    if (status.state === "granted") {
      console.log("[AUTH] Lokasi granted → redirect ke:", finalDestination);
      localStorage.setItem("locationPermission", "granted");
      if (redirectUrl) sessionStorage.removeItem("redirectAfterPermission");
      window.location.replace(finalDestination);
      return;
    }

    if (status.state === "prompt") {
      console.log("[AUTH] Lokasi prompt, minta izin");
      navigator.geolocation.getCurrentPosition(
        () => {
          console.log("[AUTH] Lokasi diberikan, redirect ke:", finalDestination);
          localStorage.setItem("locationPermission", "granted");
          if (redirectUrl) sessionStorage.removeItem("redirectAfterPermission");
          window.location.replace(finalDestination);
        },
        () => {
          console.warn("[AUTH] Lokasi ditolak, paksa logout");
          showForcedLogoutModal(
            "Izin Lokasi Diperlukan",
            "Izin lokasi diperlukan. Karena Anda menolak, akun akan logout.",
            logout
          );
        }
      );
      return;
    }

    console.warn("[AUTH] Lokasi denied, paksa logout");
    showForcedLogoutModal(
      "Izin Lokasi Diperlukan",
      "Untuk melanjutkan, aktifkan izin lokasi. Karena Anda menolak, akun akan logout.",
      logout
    );
  }).catch(() => {
    console.error("[AUTH] navigator.permissions gagal, fallback getCurrentPosition");
    navigator.geolocation.getCurrentPosition(
      () => {
        const redirectUrl = sessionStorage.getItem("redirectAfterPermission");
        const finalDestination = redirectUrl || "/home.html";
        localStorage.setItem("locationPermission", "granted");
        if (redirectUrl) sessionStorage.removeItem("redirectAfterPermission");
        window.location.replace(finalDestination);
      },
      () => {
        console.warn("[AUTH] Lokasi tetap ditolak, paksa logout");
        showForcedLogoutModal(
          "Izin Lokasi Diperlukan",
          "Izin lokasi diperlukan. Karena Anda menolak, akun akan logout.",
          logout
        );
      }
    );
  });
}

// =============================================================
// --- UI HANDLER ---
// =============================================================
function handleAuthUIState(user) {
  console.log("[AUTH] handleAuthUIState():", user ? "User login" : "User logout");
  const mainContent = document.getElementById("mainContent");
  const loginContainer = document.getElementById("loginContainer");
  const pageLoader = document.getElementById("page-loader");

  if (pageLoader) pageLoader.classList.add("d-none");

  const showMain = !!user && !!mainContent;
  const showLogin = !user && !!loginContainer;

  if (mainContent) {
    mainContent.style.display = showMain ? "block" : "none";
    mainContent.classList.toggle("d-none", !showMain);
  }
  if (loginContainer) {
    loginContainer.style.display = showLogin ? "flex" : "none";
    loginContainer.classList.toggle("d-none", !showLogin);
  }

  if (user) {
    const welcomeText = document.getElementById("welcome-text");
    if (welcomeText) {
      welcomeText.textContent = `🎉 Selamat Datang, ${user.displayName}!`;
    }
  }
}

// =============================================================
// --- EKSPOR ---
// =============================================================
export {
  auth,
  provider,
  managePageAccess,
  initializeLoginPage,
  logout,
  handleLocationTutorialProceed,
  PUBLIC_PAGES,
  PRIVATE_PAGES
};
