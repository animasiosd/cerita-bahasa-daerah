// ======================================================================
// File: js/ui/page_auth.js
// Deskripsi: Menangani UI dan PROSES otentikasi.
// Asal Kode: auth.js, login.html, index.html, download.html, bahasa.html
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
                const credential = result.credential;
                const accessToken = credential?.accessToken || null;

                let profileData = {};
                if (accessToken) {
                    profileData = await fetchUserAgeGender(accessToken);
                }
                
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
 * Mengambil data usia dan gender dari Google People API.
 * Fungsi ini adalah dependensi dari proses login.
 * Asal Kode: auth.js
 */
async function fetchUserAgeGender(accessToken) {
    try {
        const response = await fetch("https://people.googleapis.com/v1/people/me?personFields=genders,birthdays", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return {};
        
        const profile = await response.json();
        const gender = profile.genders?.[0]?.value || "Tidak Diketahui";
        const birthday = profile.birthdays?.[0]?.date || null;
        let minAge = null;
        if (birthday?.year) {
            minAge = new Date().getFullYear() - birthday.year;
        }

        return { gender, minAge };

    } catch (err) {
        console.error("Error fetch data umur & gender:", err);
        return {};
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
        pageLoader.style.display = 'none';
    }

    if (user) {
        if (mainContent) mainContent.style.display = "block";
        if (loginContainer) loginContainer.style.display = "none";
        
        const welcomeText = document.getElementById("welcome-text");
        if (welcomeText) {
            welcomeText.textContent = `🎉 Selamat Datang, ${user.displayName}!`;
        }
    } else {
        if (mainContent) mainContent.style.display = "none";
        // Di login.html, loginContainer tidak ada, jadi ini tidak akan error
        if (loginContainer) loginContainer.style.display = "flex";
    }
}

/**
 * Fungsi untuk logout.
 * Asal Kode: auth.js
 */
function logout() {
    EventTracker.auth.logoutClick(); // Tracking dari events.js
    auth.signOut().then(() => {
        window.location.href = 'login';
    }).catch((error) => console.error("Logout Error:", error));
}

/**
 * Menampilkan modal Bootstrap saat login gagal.
 * Asal Kode: auth.js
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
 * Ini akan menggantikan logika onAuthStateChanged di setiap halaman.
 */
function managePageAccess() {
    auth.onAuthStateChanged((user) => {
        const currentPath = window.location.pathname.toLowerCase();
        const onLoginPage = currentPath.includes("login");
        const onTutorialPage = currentPath.includes("locationtutorial");
        const onPolicyPage = currentPath.includes("privacy_policy") || currentPath.includes("terms_of_service");

        // Halaman kebijakan bisa diakses siapa saja
        if (onPolicyPage) {
            handleAuthUIState(user); // Cukup atur UI tanpa redirect
            return;
        }

        if (!user) { // Jika TIDAK LOGIN
            if (!onLoginPage) {
                sessionStorage.setItem('redirectAfterPermission', window.location.href);
                window.location.href = 'login';
            } else {
                // Jika sudah di halaman login, tampilkan tombol login
                const pageLoader = document.getElementById('page-loader');
                if(pageLoader) pageLoader.style.display = 'none';
            }
        } else { // Jika SUDAH LOGIN
            if (onLoginPage) {
                // Jangan di halaman login jika sudah login, arahkan ke index
                window.location.href = 'index';
            } else {
                // Tampilkan konten utama di halaman yang dilindungi
                handleAuthUIState(user);

                // Panggil initPage jika ada (untuk halaman video/download)
                if (typeof initPage === 'function') {
                    initPage();
                }
            }
        }
    });
}