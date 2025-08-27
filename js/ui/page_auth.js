// ======================================================================
// File: js/ui/page_auth.js (VERSI PERBAIKAN)
// Deskripsi: Menangani UI dan PROSES otentikasi.
// ======================================================================

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


/**
 * Menginisialisasi listener untuk tombol login di halaman login.
 */
function initializeLoginPage() {
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            EventTracker.auth.loginClick(); // Tracking dari events.js

            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/profile.agerange.read');
            provider.addScope('https://www.googleapis.com/auth/user.gender.read');
            provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
            
            provider.setCustomParameters({ prompt: 'consent' });

            try {
                const result = await auth.signInWithPopup(provider);
                const user = result.user;
                const accessToken = result.credential?.accessToken || null;

                // Memanggil service dari load_data untuk mengambil data profil
                const profileData = await user_data_service.fetchGoogleProfile(accessToken);
                
                // Menyimpan data usia ke sessionStorage agar bisa diakses analytics.js
                sessionStorage.setItem("ageData", JSON.stringify(profileData || {}));

                // Menunggu proses logUserLogin selesai sebelum redirect
                if (typeof logUserLogin === "function") {
                    await logUserLogin(user);
                }

                // Redirect ke halaman yang disimpan atau ke index
                const redirectUrl = sessionStorage.getItem('redirectAfterPermission') || 'index';
                if(sessionStorage.getItem('redirectAfterPermission')) {
                    sessionStorage.removeItem('redirectAfterPermission');
                }
                window.location.href = redirectUrl;

            } catch (error) {
                console.error("Login Gagal:", error);
                showLoginFailModal(error.message);
            }
        });
    }
}

/**
 * Mengatur tampilan halaman berdasarkan status login pengguna.
 * @param {object|null} user - Objek user dari Firebase, atau null.
 */
function handleAuthUIState(user) {
    const mainContent = document.getElementById("mainContent");
    const loginContainer = document.getElementById("loginContainer");
    const pageLoader = document.getElementById('page-loader');

    if (pageLoader) {
        // CARA YANG BENAR: Tambahkan class d-none untuk menyembunyikan loader.
        pageLoader.classList.add('d-none');
    }

    if (user) {
        if (mainContent) mainContent.classList.remove("d-none");
        // Di halaman download, loginContainer memang ada untuk ditampilkan jika user logout.
        if (loginContainer) loginContainer.classList.add("d-none");
        
        const welcomeText = document.getElementById("welcome-text");
        if (welcomeText) {
            welcomeText.textContent = `🎉 Selamat Datang, ${user.displayName}!`;
        }
    } else {
        if (mainContent) mainContent.classList.add("d-none");
        if (loginContainer) {
            loginContainer.classList.remove("d-none");
            // Pastikan loginContainer terlihat dengan benar
            loginContainer.style.display = "flex";
        }
    }
}

/**
 * Fungsi untuk logout.
 */
function logout() {
    EventTracker.auth.logoutClick(); // Tracking dari events.js
    auth.signOut().then(() => {
        window.location.href = 'login';
    }).catch((error) => console.error("Logout Error:", error));
}

/**
 * Menampilkan modal Bootstrap saat login gagal.
 */
function showLoginFailModal(message = "Login gagal. Silakan coba lagi.") {
    let modalEl = document.getElementById("loginFailModal");
    if (modalEl) modalEl.remove();

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
    
    const modal = new bootstrap.Modal(modalDiv);
    modal.show();
}

/**
 * Logika utama untuk memeriksa status login dan mengarahkan pengguna.
 */
function managePageAccess() {
    auth.onAuthStateChanged((user) => {
        const currentPath = window.location.pathname.toLowerCase();
        const onLoginPage = currentPath.includes("login");
        const onTutorialPage = currentPath.includes("locationtutorial");
        const onPolicyPage = currentPath.includes("privacy_policy") || currentPath.includes("terms_of_service");

        if (onPolicyPage) {
            handleAuthUIState(user);
            return;
        }

        if (!user) {
            if (!onLoginPage) {
                sessionStorage.setItem('redirectAfterPermission', window.location.href);
                window.location.href = 'login';
            } else {
                const pageLoader = document.getElementById('page-loader');
                if(pageLoader) pageLoader.style.display = 'none';
            }
        } else {
            if (onLoginPage) {
                window.location.href = 'index';
            } else {
                handleAuthUIState(user);

                if (typeof initPage === 'function') {
                    initPage();
                }
            }
        }
    });
}