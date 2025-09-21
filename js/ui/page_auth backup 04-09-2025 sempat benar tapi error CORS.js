import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase_config.js";
import { logUserLogin } from "../send_data/analytics_service.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
provider.addScope("https://www.googleapis.com/auth/profile.agerange.read");

provider.addScope("https://www.googleapis.com/auth/user.gender.reaad");

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

        // Ambil token Google untuk akses People API
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential.accessToken;

        // Panggil Google People API untuk ambil gender & birthday
        const response = await fetch(
          `https://people.googleapis.com/v1/people/me?personFields=genders,birthdays`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const gender = data.genders?.[0]?.value || "Tidak Diketahui";
          const birthdayObj = data.birthdays?.[0]?.date || null;
          const birthday = birthdayObj
            ? `${birthdayObj.day}-${birthdayObj.month}-${birthdayObj.year}`
            : "";

          // Hitung umur otomatis kalau birthday ada
          let minAge = "";
          if (birthdayObj?.year) {
            minAge = new Date().getFullYear() - birthdayObj.year;
          }

          // Simpan ke sessionStorage untuk dipakai analytics_service.js
          sessionStorage.setItem("ageData", JSON.stringify({ gender, birthday, minAge }));
          
          console.log("🎉 Data profil Google disimpan:", { gender, birthday, minAge });
        } else {
          console.warn("⚠️ Gagal ambil data gender/birthday:", await response.text());
        }

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

async function ensureUserProfileData(user) {
  const stored = sessionStorage.getItem("ageData");
  if (stored) return; // sudah ada

  const token = await user.getIdToken();
  const response = await fetch(
    `https://people.googleapis.com/v1/people/me?personFields=genders,birthdays`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.ok) {
    const data = await response.json();
    const gender = data.genders?.[0]?.value || "Tidak Diketahui";
    const birthdayObj = data.birthdays?.[0]?.date || null;
    const birthday = birthdayObj
      ? `${birthdayObj.day}-${birthdayObj.month}-${birthdayObj.year}`
      : "";
    let minAge = "";
    if (birthdayObj?.year) {
      minAge = new Date().getFullYear() - birthdayObj.year;
    }

    sessionStorage.setItem("ageData", JSON.stringify({ gender, birthday, minAge }));
  }
}

let hasLoggedUserData = false; 

/**
 * Fungsi utama untuk mengelola akses halaman
 */
const managePageAccess = (callback) => {
  cleanUrl();
  const currentPage = getNormalizedPage();

  console.log("🔄 Mengecek status login...");

  onAuthStateChanged(auth, async (user) => {
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
    await ensureUserProfileData(user);

    // 2️⃣ Kirim log hanya sekali per session
    if (!hasLoggedUserData) {
      await logUserLogin(user);
      hasLoggedUserData = true;
    }

    // 3️⃣ Kalau user di login/index → redirect ke home
    if (currentPage === "login" || currentPage === "index") {
      console.log("🔄 User sudah login → redirect ke home");
      window.location.replace("/home");
      return;
    }

    // 4️⃣ Cek izin lokasi untuk halaman protected
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
