import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics, setUserId, setUserProperties, logEvent } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { app } from "./firebase_config.js";
import { user_data_service } from "../load_data/user_data_service.js";
import { logUserLogin, logPageView  } from "../send_data/analytics_service.js";
import { EventTracker } from "../events.js";

const auth = getAuth(app);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();
//provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
//provider.addScope("https://www.googleapis.com/auth/user.gender.read");
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
//provider.addScope("https://www.googleapis.com/auth/profile.agerange.read");

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

        // 🔹 Track ke Firebase Analytics
        trackUserLoginAnalytics(result.user);

        // Ambil token Google untuk akses People API
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential.accessToken;
        
        const profileData = await user_data_service.fetchGoogleProfile(accessToken);
        
        // Simpan hasilnya ke sessionStorage
        if (profileData) {
          sessionStorage.setItem("ageData", JSON.stringify(profileData));
          console.log("🎉 Data profil Google disimpan:", profileData);
          
          const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/home";
          sessionStorage.removeItem("redirectAfterLogin");
          window.location.replace(redirectTo);
        }

      } catch (error) {
        console.error("❌ Login gagal:", error.message);
        alert("Login gagal. Silakan coba lagi!");
      }
    });
  }
};

let hasLoggedUserData = false; 

/**
 * Track user_id & login event ke Firebase Analytics
 */
function trackUserLoginAnalytics(user) {
  if (!user) return;

  setUserProperties(analytics, { id_user_firebase: user.uid }); // set user_id untuk GA4 User-ID
  logEvent(analytics, "login", {
    method: user.providerData?.[0]?.providerId || "unknown"
  });

  console.log("📊 Firebase Analytics: user_id & login event tercatat", {
    user_id: user.uid,
    method: user.providerData?.[0]?.providerId
  });
}

/**
 * Fungsi utama untuk mengelola akses halaman
 */
const managePageAccess = (callback) => {
  cleanUrl();
  const currentPage = getNormalizedPage();

  console.log("🔄 Mengecek status login...");

  onAuthStateChanged(auth, async (user) => {
    EventTracker.page.view(user); // <--- PANGGILAN MELALUI EVENTTRACKER
    if (!user) {
      console.log("⛔ Tidak login");

      // Kalau halaman protected → redirect ke login
      if (protectedPages.includes(currentPage)) {
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

    // ✅ Jika user login
    console.log(`✅ User login terdeteksi: ${user.email}`);

    // 1️⃣ Pastikan profil lengkap
    //await ensureUserProfileData(user);

    // 1️⃣ Track ke Firebase Analytics
    trackUserLoginAnalytics(user);

    // 2️⃣ Kirim log hanya sekali per session
    //if (!hasLoggedUserData) {
      //await logUserLogin(user);
      //hasLoggedUserData = true;
    //}

    // 3️⃣ Kalau user di login/index → redirect ke home
    if (currentPage === "login" || currentPage === "index") {
      console.log("🔄 User sudah login → redirect ke home");
      window.location.replace("/home");
      return;
    }

    // 4️⃣ Cek izin lokasi untuk halaman protected
    const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
    handleLoggedInUser(permissionStatus.state, currentPage, callback, user);
    permissionStatus.onchange = () => {
      handleLoggedInUser(permissionStatus.state, currentPage, callback, user);
    };

    const pageLoader = document.getElementById("page-loader");
    if (pageLoader) pageLoader.style.display = "none";
  });
};

/**
 * Fungsi untuk menangani user login + cek izin lokasi
 */
function handleLoggedInUser(permissionState, currentPage, callback, user) {
  switch (permissionState) {
    case "granted":
      console.log("📍 Izin lokasi diberikan");

      if (user && !hasLoggedUserData) {
        logUserLogin(user).then(() => {
            console.log("✅ Data login dan lokasi berhasil dikirim.");
        });
        hasLoggedUserData = true;
      }

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

  // PERBAIKAN 2: Tambahkan pengecualian agar tidak mencari tombol logout
  // di halaman locationtutorial.
  if (publicPages.includes(currentPage) || currentPage === 'locationtutorial') {
    console.log("ℹ️ Halaman publik atau tutorial, tidak pasang listener logout");
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      EventTracker.auth.logoutClick()
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
