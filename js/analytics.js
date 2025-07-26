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

// ⏰ Fungsi utilitas: Format timestamp sesuai zona waktu Jakarta (WIB)
function getFormattedTimestampWIB() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('id-ID', options).format(now).replace(",", "");
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
    timestamp: getFormattedTimestampWIB(), // 🕓 Ganti ke format WIB
    user_id: user ? user.uid : "ANONYM",
    user_name: user ? user.displayName || "Tanpa Nama" : null,
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
  if (user) {
    setTimeout(() => {
      logUserLogin(user);  // ⏱️ Delay agar data user stabil
      logPageView(user);
    }, 500); // Delay 500ms untuk memastikan data user sudah siap
  } else {
    logPageView(null);
  }
});
});
