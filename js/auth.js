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
        <div class="modal-header bg-danger text-white"><h5 class="modal-title">Login Gagal</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button></div>
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
    loginBtn.onclick = () => {
      try { logUserBehavior("login_button"); } catch {}
      
      const provider = new firebase.auth.GoogleAuthProvider();
      
      // ✅ PERBAIKAN: Menggunakan 'auth' bukan 'aauth'
      provider.addScope('https://www.googleapis.com/auth/profile.agerange.read');
      provider.addScope('https://www.googleapis.com/auth/user.gender.read');
      provider.addScope('https://www.googleapis.com/auth/user.addresses.read');

      auth
        .signInWithPopup(provider)
        .then(async (result) => {
          const user = result.user;
          const credential = result.credential;
          const accessToken = credential.accessToken;

          console.log("✅ Login via pop-up berhasil untuk:", user.displayName);

          if (accessToken) {
            try {
              console.log("[Auth] Mengambil data profil dari Google People API...");
              // Meminta semua data (usia, gender, alamat) dalam satu panggilan API
              const response = await fetch('https://people.googleapis.com/v1/people/me?personFields=ageRanges,genders,addresses', {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });

              if (!response.ok) {
                throw new Error(`Gagal mengambil data People API. Status: ${response.status}`);
              }

              const profileData = await response.json();
              
              // Proses dan simpan data usia
              if (profileData.ageRanges && profileData.ageRanges.length > 0) {
                const ageRangeData = profileData.ageRanges[0];
                const ageData = {
                  age_range: ageRangeData.ageRange || "UNKNOWN",
                  minAge: ageRangeData.minAge || null
                };
                sessionStorage.setItem('ageData', JSON.stringify(ageData));
                console.log("[Auth] Berhasil mendapatkan data usia:", ageData);
              }
              // (Anda bisa menambahkan logika serupa untuk gender dan alamat di sini jika perlu)

            } catch (error) {
              console.warn("[Auth] Gagal mengambil atau memproses data profil:", error.message);
            }
          }
        })
        .catch((error) => {
          // ✅ PERBAIKAN: Blok catch yang sudah dibersihkan
          console.error("Login Gagal:", error);
          showLoginFailModal(error.message);
        });
    };
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

  function hideLoader() {
    if (pageLoader) pageLoader.classList.add("d-none");
    if (loginContainer) loginContainer.classList.remove("d-none");
    if (mainContent) mainContent.classList.add("d-none");
  }
});
