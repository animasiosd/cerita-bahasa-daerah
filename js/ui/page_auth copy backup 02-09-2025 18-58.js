// File: js/ui/page_auth.js (VERSI FINAL DENGAN POPUP)
import { firebaseConfig } from '../firebase_config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { 
  initializeAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  browserLocalPersistence 
} from 'firebase/auth'; // getRedirectResult dan signInWithRedirect sudah dihapus

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/user.birthday.read');
provider.addScope('https://www.googleapis.com/auth/user.gender.read');

// =================================================================
// BAGIAN 2: FUNGSI-FUNGSI UTAMA
// =================================================================

export function managePageAccess(callbackOnSuccess) {
  // ... (Fungsi ini tidak perlu diubah, biarkan apa adanya)
  const pageLoader = document.getElementById('page-loader');
  const mainContent = document.getElementById('mainContent');
  const loginContainer = document.getElementById('loginContainer');
  const publicPages = ['/', '/index.html', '/privacy_policy.html', '/terms_of_service.html', '/404.html'];
  const currentPagePath = window.location.pathname;
  const isPublicPage = publicPages.includes(currentPagePath);
  const isLocationTutorialPage = currentPagePath.includes('locationtutorial.html');
  if (pageLoader) pageLoader.style.display = 'flex';
  onAuthStateChanged(auth, (user) => {
    if (user) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        const hasRealPermission = permissionStatus.state === 'granted';
        localStorage.setItem('locationPermissionGranted', hasRealPermission);
        if (!hasRealPermission && !isLocationTutorialPage) {
          window.location.replace('/locationtutorial.html');
          return;
        }
        if (hasRealPermission && (isLocationTutorialPage || isPublicPage)) {
          window.location.replace('/home.html');
          return;
        }
        if (pageLoader) pageLoader.style.display = 'none';
        if (loginContainer) loginContainer.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        if (typeof callbackOnSuccess === 'function') {
          callbackOnSuccess(user);
        }
      });
    } else {
      if (!isPublicPage && !isLocationTutorialPage) {
        window.location.replace('/index.html');
        return;
      }
      if (pageLoader) pageLoader.style.display = 'none';
      if (loginContainer) loginContainer.style.display = 'flex';
      if (mainContent) mainContent.style.display = 'block';
      if (typeof callbackOnSuccess === 'function') {
        callbackOnSuccess(null);
      }
    }
  });
}

export function initializeLoginPage() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      console.log("Tombol login diklik, memulai proses login dengan Popup...");
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          console.log("Login dengan Popup berhasil. Pengguna:", user.displayName);
        })
        .catch((error) => {
          console.error("Login dengan Popup gagal:", error);
          if (error.code === 'auth/popup-closed-by-user') {
            alert("Jendela login ditutup sebelum selesai. Silakan coba lagi.");
          }
        });
    });
  }
}

// ... (Sisa fungsi handleLocationPermissionRequest dan logout tidak perlu diubah)
export function handleLocationPermissionRequest() {
    console.log("Meminta izin lokasi...");
    navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        const handleGranted = (position) => {
            console.log("Izin lokasi berhasil diberikan.", position.coords);
            localStorage.setItem('locationPermissionGranted', 'true');
            window.location.replace('/home.html');
        };
        const handleDenied = () => {
            console.warn("Izin lokasi ditolak.");
            localStorage.setItem('locationPermissionGranted', 'false');
            alert("Anda menolak izin lokasi. Aplikasi ini memerlukannya untuk berfungsi. Anda akan kami logout.");
            logout();
        };
        if (permissionStatus.state === 'granted') {
            handleGranted({ coords: { latitude: 'cached', longitude: 'cached' }});
            return;
        }
        if (permissionStatus.state === 'denied') {
            alert("Izin lokasi diblokir permanen. Harap aktifkan melalui pengaturan browser Anda. Anda akan di-logout.");
            logout();
            return;
        }
        navigator.geolocation.getCurrentPosition(handleGranted, handleDenied, {
            timeout: 20000,
            enableHighAccuracy: true
        });
    });
}
export function logout() {
  console.log("Proses logout dimulai...");
  localStorage.removeItem('locationPermissionGranted');
  sessionStorage.removeItem('ageData');
  signOut(auth).catch((error) => {
    console.error("Terjadi error saat sign out:", error);
  }).finally(() => {
    console.log("Logout selesai, redirect ke index.");
    window.location.href = '/index.html';
  });
}
window.logout = logout;