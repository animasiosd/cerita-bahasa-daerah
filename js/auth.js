// ============================
// 1️⃣ KONFIGURASI FIREBASE
// ============================
const firebaseConfig = {
  apiKey: "AIzaSyCAOg2aMzFVCQVx07t85lFpTXv3c2ugL1E",
  authDomain: "animasiosd-github.firebaseapp.com",
  projectId: "animasiosd-github",
  storageBucket: "animasiosd-github.appspot.com",
  messagingSenderId: "424179260770",
  appId: "1:424179260770:web:2f4a04a8c9643027bca03b",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Ambil elemen-elemen utama di halaman
const pageLoader = document.getElementById("page-loader");
const loginContainer = document.getElementById("loginContainer");
const mainContent = document.getElementById("mainContent");

// URL helper
const URLS = {
  login: "https://animasiosd.github.io/cerita-bahasa-daerah/login",
  index: "https://animasiosd.github.io/cerita-bahasa-daerah/index.html",
  tutorial: "https://animasiosd.github.io/cerita-bahasa-daerah/locationtutorial.html",
};

// Fungsi-fungsi helper
function redirectTo(url) {
  window.location.href = url;
}

function getLocationStatus() {
  return localStorage.getItem("locationPermission");
}

// ============================
// 3️⃣ LOGOUT USER
// ============================
function logout() {
  try { logUserBehavior("logout_button"); } catch {}
  auth
    .signOut()
    .then(() => {
      window.location.href = URLS.login;
    })
    .catch((error) => console.error("Logout Error:", error));
}

// ============================
// 4️⃣ MODAL LOGIN GAGAL
// ============================
function showLoginFailModal(message = "Login gagal. Silakan coba lagi.") {
  // ... (kode modal tidak berubah)
  let existingModal = document.getElementById("loginFailModal");
  if (existingModal) existingModal.remove();
  const modalDiv = document.createElement("div");
  modalDiv.id = "loginFailModal";
  modalDiv.className = "modal fade";
  modalDiv.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-danger text-white">
          <h5 class="modal-title">Login Gagal</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modalDiv);
  try {
    new bootstrap.Modal(modalDiv).show();
  } catch (e) {
    console.error("Gagal menampilkan modal:", e);
  }
}

// ============================
// 5️⃣ LOGIN GOOGLE
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {
    loginBtn.onclick = async () => {
      try { logUserBehavior("login_button"); } catch {}
      
      const provider = new firebase.auth.GoogleAuthProvider();
      
      // ✅ PERBAIKAN: scope People API
      provider.addScope('https://www.googleapis.com/auth/profile.agerange.read');
      provider.addScope('https://www.googleapis.com/auth/user.gender.read');
      provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
      provider.addScope('https://www.googleapis.com/auth/user.addresses.read');

      try {
        // ✅ PERBAIKAN: signInWithPopup hanya sekali + await
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        const credential = result.credential;
        const accessToken = credential && credential.accessToken ? credential.accessToken : null;
        // Ambil umur & gender dari Google People API (jika token tersedia)
        let profileData = {};
        try {
          if (accessToken) {
            profileData = await fetchUserAgeGender(accessToken);
          } else {
            console.warn("[Auth] Access token Google tidak tersedia.");
          }
        } catch (err) {
          console.warn("[Auth] Gagal ambil data People API:", err);
        }
        
        // ✅ Pastikan sessionStorage diisi lebih awal
        sessionStorage.setItem("ageData", JSON.stringify(profileData || {}));
        
        // ✅ Tunggu sampai sessionStorage terisi sebelum memanggil logUserLogin()
        if (typeof logUserLogin === "function") {
          await logUserLogin(user, profileData);  // 🔹 Pastikan dikirim ke analytics.js
          }
          
          // ✅ Kirim data user ke Google Apps Script
          await sendUserLoginToSheet(user, profileData || {});
          
          // Redirect ke halaman utama
          window.location.href = "index.html";
        
        } catch (error) {
          console.error("Login Gagal:", error);
          showLoginFailModal(error.message);
        }
      };
    }

  // === Ambil Data Gender & Umur dari Google People API ===
  async function fetchUserAgeGender(accessToken) {
    try {
      const response = await fetch("https://people.googleapis.com/v1/people/me?personFields=genders,birthdays", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.warn("[Auth] Gagal ambil data umur & gender:", response.status);
        return {};
      }

      const profile = await response.json();
      const gender = profile.genders?.[0]?.value || "Tidak Diketahui";

      // Hitung umur minimum dari tanggal lahir
      const birthday = profile.birthdays?.[0]?.date || null;
      let minAge = null;
      if (birthday?.year) {
        const today = new Date();
        minAge = today.getFullYear() - birthday.year;
      }

      // Tentukan age_range
      let age_range = null;
      if (minAge !== null) {
        if (minAge >= 60) age_range = "60+";
        else if (minAge >= 40) age_range = "40-59";
        else if (minAge >= 25) age_range = "25-39";
        else if (minAge >= 18) age_range = "18-24";
        else age_range = "<18";
      }

      return {
        gender,
        minAge,
        age_range,
        birthday: birthday
          ? `${birthday.year}-${birthday.month || 1}-${birthday.day || 1}`
          : null,
        age_range_category: getAgeCategory(minAge),
      };
    } catch (err) {
      console.error("[Auth] Error fetch data umur & gender:", err);
      return {};
    }
  }

  async function sendUserLoginToSheet(user, profileData) {
    try {
      await fetch("https://script.google.com/macros/s/AKfycbwCT57fhlebRz7nKvvtmPxjKrR54-mQU3syiuRqspHX9nRubS-gg7RYkHybOlIwxdhyTg/exec", {
        method: "POST",
        body: JSON.stringify({
          eventType: "USER_LOGIN_ACTIVITY",
          data: {
            user_id: user.uid,
            email: user.email,
            user_name: user.displayName,
            gender: profileData.gender,
            birthday: profileData.birthday,
            age_range: profileData.age_range,
            minAge: profileData.minAge,
            age_range_category: profileData.age_range_category,
          },
        }),
      });
    } catch (err) {
      console.error("[Auth] Gagal kirim data user ke sheet:", err);
    }
  }

  function getAgeCategory(minAge) {
    if (!minAge) return "Tidak Diketahui";
    if (minAge >= 60) return "Lansia";
    if (minAge >= 40) return "Dewasa Paruh Baya";
    if (minAge >= 20) return "Dewasa Muda";
    if (minAge >= 12) return "Remaja";
    if (minAge >= 5) return "Anak-anak";
    return "Di Bawah Umur";
  }

  // === Helper Kategori Umur ===
  function getAgeCategory(minAge) {
    if (!minAge) return "Tidak Diketahui";
    if (minAge >= 60) return "Lansia";
    if (minAge >= 40) return "Dewasa Paruh Baya";
    if (minAge >= 20) return "Dewasa Muda";
    if (minAge >= 12) return "Remaja";
    if (minAge >= 5) return "Anak-anak";
    return "Di Bawah Umur";
  }

  // ============================
  // 6️⃣ CEK STATUS LOGIN (Logika Prioritas)
  // ============================
  auth.onAuthStateChanged((user) => {
    // ... (kode onAuthStateChanged Anda sudah benar dan tidak perlu diubah)
    const currentPath = window.location.pathname;
    const onLoginPage = currentPath.includes("/cerita-bahasa-daerah/login");
    const onTutorialPage = currentPath.includes("/cerita-bahasa-daerah/locationtutorial.html");

    if (!user) {
      if (!onLoginPage) {
        const urlToSave = window.location.href;
        console.log(`[AUTH-LOGIC] PRIORITAS 1: Pengguna belum login. Menyimpan URL tujuan: ${urlToSave}`);
        sessionStorage.setItem('redirectAfterPermission', urlToSave);
        redirectTo(URLS.login);
      } else {
        hideLoader();
      }
      return;
    }
    
    const statusNow = getLocationStatus();
    if (statusNow !== "granted" && !onTutorialPage) {
      console.log("[AUTH-LOGIC] PRIORITAS 2: Pengguna sudah login, tapi izin lokasi belum ada. Mengarahkan ke tutorial.");
      redirectTo(URLS.tutorial);
      return;
    }

    if (onLoginPage) {
      const redirectUrl = sessionStorage.getItem('redirectAfterPermission');
      const finalDestination = redirectUrl || URLS.index;
      console.log(`[AUTH-LOGIC] PRIORITAS 3: Pengguna sudah login tapi ada di halaman login. Mengarahkan ke: ${finalDestination}`);
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterPermission');
      }
      redirectTo(finalDestination);
      return;
    }

    console.log("[AUTH-LOGIC] PRIORITAS 4: Pengguna ideal. Menampilkan konten.");
    handleLoggedInState(user);
  });


  function handleLoggedInState(user) {
    if (pageLoader) pageLoader.classList.add("d-none");
    if (mainContent) mainContent.classList.remove("d-none");
    if (loginContainer) loginContainer.classList.add("d-none");
    const welcomeMessage = document.getElementById("welcome-text");
    if (welcomeMessage && user.displayName) {
      welcomeMessage.textContent = `🎉 Selamat Datang, ${user.displayName}!`;
    }
  }

  // (Dihapus pemanggilan signInWithPopup ganda yang ada di luar handler — perbaikan bug)

  function hideLoader() {
    if (pageLoader) pageLoader.classList.add("d-none");
    if (loginContainer) loginContainer.classList.remove("d-none");
    if (mainContent) mainContent.classList.add("d-none");
  }
});
