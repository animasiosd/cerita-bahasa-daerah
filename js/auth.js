// ============================
// 1️⃣ KONFIGURASI FIREBASE sementara oke mengenai redirect URL karena izin lokasi
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

// Ambil elemen-elemen utama di halaman (disamakan dengan ID yang dipakai di HTML)
const pageLoader = document.getElementById("page-loader");
const loginContainer = document.getElementById("loginContainer");
const mainContent = document.getElementById("mainContent");

// Ambil status izin lokasi dari localStorage (snapshot awal; untuk cek realtime gunakan getLocationStatus())
const locationStatus = localStorage.getItem("locationPermission"); // [INFO]

// Flag supaya navbar tidak di-fetch berulang
let navbarLoaded = false;

// URL helper
const URLS = {
  login: "https://animasiosd.github.io/beta/login",
  index: "https://animasiosd.github.io/beta/index.html", // bisa diganti ke .../beta/ jika ingin URL bersih
  tutorial: "https://animasiosd.github.io/beta/locationtutorial.html",
};

// Fungsi untuk redirect halaman
function redirectTo(url) {
  window.location.href = url;
}

// Helper status izin lokasi (selalu ambil fresh)
function getLocationStatus() {
  return localStorage.getItem("locationPermission"); // "granted" | "denied" | null
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
// 4️⃣ MODAL LOGIN GAGAL (TETAP ADA, TIDAK DIUBAH STRUKTURNYA)
// ============================
function showLoginFailModal(message = "Login gagal. Silakan coba lagi.") {
  let existingModal = document.getElementById("loginFailModal");
  if (existingModal) existingModal.remove();

  const modalDiv = document.createElement("div");
  modalDiv.id = "loginFailModal";
  modalDiv.className = "modal fade";
  modalDiv.tabIndex = -1;
  modalDiv.setAttribute("aria-hidden", "true");
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
    </div>
  `;
  document.body.appendChild(modalDiv);

  try {
    if (window.bootstrap && bootstrap.Modal) {
      new bootstrap.Modal(modalDiv).show();
    } else {
      modalDiv.classList.add("show");
      modalDiv.style.display = "block";
      modalDiv.setAttribute("aria-modal", "true");
      modalDiv.removeAttribute("aria-hidden");
    }
  } catch (e) {
    console.error("Gagal menampilkan modal:", e);
  }
}

// ============================
// 5️⃣ LOGIN GOOGLE
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // ambil ulang elemen (tetap dipertahankan sesuai struktur awal)
  const loginContainer = document.getElementById("loginContainer");
  const pageLoader = document.getElementById("page-loader");
  const mainContent = document.getElementById("mainContent");
  const loginBtn = document.getElementById("loginBtn");

  // Tombol Login Google
if (loginBtn) {
    loginBtn.onclick = () => {
      try { logUserBehavior("login_button"); } catch {}
      
      // ✅ 1. Buat provider terlebih dahulu
      const provider = new firebase.auth.GoogleAuthProvider();
      
      // ✅ 2. Baru tambahkan scope ke provider yang sudah ada
      // Scope ini akan meminta izin pengguna untuk membaca rentang usia mereka.
      provider.addScope('https://www.googleapis.com/auth/user.age.range.read');

      auth
        .signInWithPopup(provider)
        .then(async (result) => {
          const user = result.user;
          // Dapatkan "kunci" atau Access Token untuk mengakses Google API
          const credential = result.credential;
          const accessToken = credential.accessToken;

          console.log("✅ Login via pop-up berhasil untuk:", user.displayName);

          if (accessToken) {
            try {
              console.log("[Auth] Mengambil data rentang usia dari Google People API...");
              const response = await fetch('https://people.googleapis.com/v1/people/me?personFields=ageRanges', {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });

              if (!response.ok) {
                throw new Error(`Gagal mengambil data People API. Status: ${response.status}`);
              }

              const profileData = await response.json();
              
              if (profileData.ageRanges && profileData.ageRanges.length > 0) {
                const ageRangeData = profileData.ageRanges[0];
                const ageData = {
                  age_range: ageRangeData.ageRange || "UNKNOWN",
                  minAge: ageRangeData.minAge || null
                };
                
                // Simpan data usia di sessionStorage agar bisa dibaca oleh analytics.js
                sessionStorage.setItem('ageData', JSON.stringify(ageData));
                console.log("[Auth] Berhasil mendapatkan dan menyimpan data usia:", ageData);
              }
            } catch (error) {
              console.warn("[Auth] Gagal mengambil atau memproses data usia:", error.message);
            }
          }
          // Setelah ini, onAuthStateChanged akan berjalan dan menangani semua redirect.
        })
        .catch((error) => {
          // ✅ Blok catch yang sudah dibersihkan
          console.error("Login Gagal:", error);
          showLoginFailModal(error.message);

          if (mainContent) mainContent.classList.remove("d-none");
          if (loginContainer) loginContainer.classList.add("d-none");

          const welcomeMessage = document.getElementById("welcome-text");
          if (welcomeMessage && user.displayName) {
            welcomeMessage.textContent = `🎉 Selamat Datang, ${user.displayName}!`;
          }
        });
    };
  }

  // ============================
  // 6️⃣ CEK STATUS LOGIN (VERSI BARU YANG LEBIH CERDAS)
  // ============================
   auth.onAuthStateChanged((user) => {
    const currentPath = window.location.pathname;

    const onLoginPage = currentPath.includes("/beta/login");
    const onTutorialPage = currentPath.includes("/beta/locationtutorial.html");

    // PRIORITAS #1: TANGANI PENGGUNA YANG BELUM LOGIN
    if (!user) {
      if (!onLoginPage) {
        const urlToSave = window.location.href;
        console.log(`[AUTH-LOGIC] PRIORITAS 1: Pengguna belum login. Menyimpan URL tujuan: ${urlToSave}`);
        sessionStorage.setItem('redirectAfterPermission', urlToSave);
        redirectTo(URLS.login);
      } else {
        hideLoader();
      }
      return; // WAJIB: Hentikan eksekusi di sini.
    }

    // ======================================================================
    // JIKA KODE SAMPAI DI SINI, PENGGUNA SUDAH PASTI LOGIN
    // ======================================================================
    
    // PRIORITAS #2: TANGANI PENGGUNA LOGIN TAPI IZIN LOKASI BELUM ADA
    const statusNow = getLocationStatus();
    if (statusNow !== "granted" && !onTutorialPage) {
      // PENTING: JANGAN simpan sessionStorage lagi di sini.
      // URL yang benar (Toli-Toli) sudah disimpan oleh PRIORITAS #1.
      // Jika kita simpan lagi, URL Toli-Toli akan tertimpa URL halaman saat ini.
      console.log("[AUTH-LOGIC] PRIORITAS 2: Pengguna sudah login, tapi izin lokasi belum ada. Mengarahkan ke tutorial.");
      redirectTo(URLS.tutorial);
      return;
    }

    // PRIORITAS #3: TANGANI PENGGUNA LOGIN & TERJEBAK DI HALAMAN LOGIN
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

    // PRIORITAS #4: KONDISI IDEAL
    // Pengguna sudah login, izin lokasi sudah ada, dan tidak di halaman anomali.
    console.log("[AUTH-LOGIC] PRIORITAS 4: Pengguna ideal. Menampilkan konten.");
    handleLoggedInState(user);
  });

  // [Tetap dalam struktur ini] — atur tampilan saat sudah login 
  function handleLoggedInState(user) {
    if (pageLoader) pageLoader.classList.add("d-none");

    if (mainContent) mainContent.classList.remove("d-none");
    if (loginContainer) loginContainer.classList.add("d-none");

    const welcomeMessage = document.getElementById("welcome-text");
    if (welcomeMessage && user.displayName) {
      welcomeMessage.textContent = `🎉 Selamat Datang, ${user.displayName}!`;
    }
  }

  // [Tetap dalam struktur ini] — sembunyikan loader saat belum login
  function hideLoader() {
    if (pageLoader) pageLoader.classList.add("d-none");
    if (loginContainer) loginContainer.classList.remove("d-none");
    if (mainContent) mainContent.classList.add("d-none");
  }
});
