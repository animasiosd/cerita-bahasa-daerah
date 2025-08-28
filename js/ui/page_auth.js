// ======================================================================
// File: js/ui/page_auth.js (VERSI FINAL & BERSIH)
// Deskripsi: Menangani UI dan PROSES otentikasi.
// ======================================================================
"use strict";

import { EventTracker } from '../events.js';
import { user_data_service } from '../load_data/user_data_service.js'; 

// === (Firebase Imports dan Config tetap sama seperti kode Anda) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
const firebaseConfig = {
    apiKey: "AIzaSyCsWkjQp6LxyZX6NZ9Z4rlnY4ygKHJDspU",
    authDomain: "ceritabahasadaerah.firebaseapp.com",
    projectId: "ceritabahasadaerah",
    storageBucket: "ceritabahasadaerah.firebasestorage.app",
    messagingSenderId: "619825814461",
    appId: "1:619825814461:web:c4b6a51097fc8648d650d4",
    measurementId: "G-ENLD2274X0"
};

// === (Inisialisasi Firebase tetap sama) ===
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/profile.agerange.read");
provider.addScope("https://www.googleapis.com/auth/user.gender.read");
provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
provider.setCustomParameters({ prompt: "consent" });


// =============================================================
// --- FUNGSI-FUNGSI UTAMA ---
// =============================================================

/**
 * Fungsi utama dan satu-satunya "Penjaga Gerbang" untuk semua halaman.
 */
function managePageAccess(pageSpecificInit) {
    const publicPages = [
        "/", "/index.html", "/404.html", "/locationtutorial.html",
        "/privacy_policy.html", "/terms_of_service.html"
    ];

    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname.toLowerCase();
        const isPublicPage = publicPages.some(page => currentPath.endsWith(page));

        handleAuthUIState(user); // Selalu perbarui UI sesuai status login

        if (isPublicPage) {
            // Jika halaman publik, tidak perlu cek lebih lanjut
            return;
        }

        // Mulai logika untuk halaman privat
        if (!user) {
            // Jika tidak login, paksa ke index.html
            sessionStorage.setItem('redirectAfterPermission', window.location.href);
            window.location.href = '/index.html';
            return;
        }
        
        // Jika sudah login, cek lokasi
        navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
            const isLocationGranted = permissionStatus.state === 'granted';

            if (isLocationGranted) {
                // Syarat terpenuhi: Login + Lokasi -> jalankan skrip halaman
                if (typeof pageSpecificInit === 'function') {
                    pageSpecificInit();
                }
            } else {
                // Login sudah, tapi lokasi belum -> arahkan ke tutorial
                sessionStorage.setItem('redirectAfterPermission', window.location.href);
                window.location.href = '/locationtutorial.html';
            }
        });
    });
}


/**
 * Menginisialisasi listener untuk tombol login di halaman login.
 */
function initializeLoginPage() {
    const loginBtn = document.getElementById("loginBtn");
    if (!loginBtn) return;

    loginBtn.addEventListener("click", async () => {
        EventTracker.auth.loginClick();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const accessToken = result.credential?.accessToken || null;

            const profileData = await user_data_service.fetchGoogleProfile(accessToken);
            sessionStorage.setItem("ageData", JSON.stringify(profileData || {}));
            
            // Logika redirect setelah login berhasil
            let redirectUrl = sessionStorage.getItem("redirectAfterPermission") || "/home.html";
            if (redirectUrl === "/" || redirectUrl.endsWith("index.html")) {
                redirectUrl = "/home.html";
            }
            sessionStorage.removeItem("redirectAfterPermission");
            window.location.href = redirectUrl;

        } catch (error) {
            console.error("Login Gagal:", error);
            showLoginFailModal(error.message);
        }
    });
}

/**
 * Fungsi untuk logout.
 */
function logout() {
    EventTracker.auth.logoutClick();
    signOut(auth).then(() => {
        window.location.href = "/index.html";
    }).catch((error) => console.error("Logout Error:", error));
}


// =============================================================
// --- FUNGSI-FUNGSI HELPER UI ---
// =============================================================

function handleAuthUIState(user) {
    const mainContent = document.getElementById("mainContent");
    const loginContainer = document.getElementById("loginContainer");
    const pageLoader = document.getElementById("page-loader");

    if (pageLoader) pageLoader.classList.add("d-none");

    const showMain = user && mainContent;
    const showLogin = !user && loginContainer;

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

function showLoginFailModal(message = "Login gagal. Silakan coba lagi.") {
    let modalEl = document.getElementById("loginFailModal");
    if (modalEl) modalEl.remove();

    const modalDiv = document.createElement("div");
    modalDiv.id = "loginFailModal";
    modalDiv.className = "modal fade";
    modalDiv.innerHTML = `... (HTML modal Anda tetap sama) ...`;
    document.body.appendChild(modalDiv);
    new bootstrap.Modal(modalDiv).show();
}

function handleLocationTutorialProceed() {
    navigator.permissions.query({ name: "geolocation" }).then(result => {
        const redirectUrl = sessionStorage.getItem('redirectAfterPermission');
        const finalDestination = redirectUrl || "home.html";

        if (result.state === "granted") {
            localStorage.setItem("locationPermission", "granted");
            if (redirectUrl) sessionStorage.removeItem('redirectAfterPermission');
            window.location.href = finalDestination;
        } 
        else if (result.state === "prompt") {
            navigator.geolocation.getCurrentPosition(
                (position) => { // User mengizinkan
                    localStorage.setItem("locationPermission", "granted");
                    if (redirectUrl) sessionStorage.removeItem('redirectAfterPermission');
                    window.location.href = finalDestination;
                },
                (error) => { // User menolak
                    localStorage.setItem("locationPermission", "denied");
                    logout(); // Panggil fungsi logout yang sudah ada
                }
            );
        } 
        else { // State adalah 'denied'
            localStorage.setItem("locationPermission", "denied");
            logout(); // Panggil fungsi logout yang sudah ada
        }
    });
}

// Ekspor semua fungsi yang perlu diakses dari luar modul
export { auth, provider, managePageAccess, initializeLoginPage, logout, handleLocationTutorialProceed };
