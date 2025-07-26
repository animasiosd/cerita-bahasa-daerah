// File: js/analytics.js

// URL endpoint Google Apps Script
const ANALYTICS_WEB_APP = "https://script.google.com/macros/s/AKfycbxm5YQAB2kify_9SzPph5xgaEMlsKpE8UNfrPuvmghgDM9meNKCiDPABKHJ4a4p3Nak/exec";

// Fungsi utilitas: Dapatkan informasi perangkat pengguna
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const platform = navigator.platform.toLowerCase();
  const os = platform.includes("win") ? "Windows"
           : platform.includes("mac") ? "macOS"
           : platform.includes("linux") ? "Linux"
           : /android/i.test(ua) ? "Android"
           : /iphone|ipad/i.test(ua) ? "iOS"
           : "Unknown";

  const browser = /chrome/i.test(ua) ? "Chrome"
                : /firefox/i.test(ua) ? "Firefox"
                : /safari/i.test(ua) ? "Safari"
                : /edg/i.test(ua) ? "Edge"
                : /opr/i.test(ua) ? "Opera"
                : "Unknown";

  const device = /Mobi/i.test(ua) ? "mobile"
               : /Tablet/i.test(ua) ? "tablet"
               : "desktop";

  return { os, browser, device };
}

// Fungsi untuk kirim POST ke Google Apps Script
function sendAnalyticsEvent(eventType, dataObject) {
  fetch(ANALYTICS_WEB_APP, {
    method: "POST",
    body: JSON.stringify({
      eventType: eventType,
      data: dataObject
    })
  }).then(res => res.json()).then(result => {
    if (result.status !== "success") {
      console.warn("📉 Analytics gagal:", result.message);
    }
  }).catch(err => console.error("❌ Gagal kirim analytics:", err));
}

// Fungsi kirim aktivitas login user
function logUserLogin(user) {
  if (!user) return;

  sendAnalyticsEvent("USER_LOGIN_ACTIVITY", {
    user_id: user.uid,
    email: user.email,
    user_name: user.displayName || "Tanpa Nama",
    age_range: null,           // 🔕 Tidak digunakan sementara
    minAge: null,              // 🔕
    first_login_city: null,    // 🔕
    last_login_city: null,     // 🔕
    first_login_country: null, // 🔕
    last_login_country: null   // 🔕
  });
}

// Fungsi kirim page view
function logPageView(user) {
  const { os, browser, device } = getDeviceInfo();
  const url = window.location.href;
  const path = window.location.pathname;
  let tipe_halaman = "unknown";
  let nama_bahasa = null;

  if (path.includes("index.html") || path === "/" || path === "/index") tipe_halaman = "homepage";
  else if (path.includes("halaman-bahasa")) {
    tipe_halaman = "video_page";
    const params = new URLSearchParams(window.location.search);
    nama_bahasa = params.get("bahasa") || null;
  }
  else if (path.includes("download")) tipe_halaman = "download_page";

  sendAnalyticsEvent("PAGE_VIEW", {
    timestamp: new Date().toISOString(),
    user_id: user ? user.uid : "ANONYM",
    url_halaman: url,
    tipe_halaman: tipe_halaman,
    nama_bahasa: nama_bahasa,
    device_type: device,
    operating_system: os,
    browser_name: browser
  });
}

// Integrasi: pantau status auth Firebase
document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(user => {
    // Kirim login analytics (sekali saja saat login)
    if (user) {
      logUserLogin(user);
      logPageView(user);
    } else {
      logPageView(null); // Untuk page view tanpa login
    }
  });
});
