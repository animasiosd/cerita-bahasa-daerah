// ======================================================================
// File: js/send_data/analytics_service.js
// Deskripsi: Bertanggung jawab untuk MENGIRIM semua data tracking
//            ke endpoint Google Apps Script.
// ======================================================================

const ANALYTICS_WEB_APP = "https://script.google.com/macros/s/AKfycbxm5YQAB2kify_9SzPph5xgaEMlsKpE8UNfrPuvmghgDM9meNKCiDPABKHJ4a4p3Nak/exec";
const videoProgressSession = {};
const videoCompletedSession = {};

// --- Fungsi Helper (Asal: analytics.js) ---

function getFormattedTimestampWIB() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('id-ID', options).format(now).replace(",", "");
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const platform = navigator.platform.toLowerCase();
  const os = platform.includes("win") ? "Windows" :
             platform.includes("mac") ? "macOS" :
             /android/i.test(ua) ? "Android" :
             /iphone|ipad/i.test(ua) ? "iOS" : "Unknown";
  const browser = /chrome/i.test(ua) ? "Chrome" :
                  /firefox/i.test(ua) ? "Firefox" :
                  /safari/i.test(ua) ? "Safari" :
                  /edg/i.test(ua) ? "Edge" : "Unknown";
  const device = /Mobi/i.test(ua) ? "mobile" : "desktop";
  return { os, browser, device };
}

function resolveCityName(address) {
  if (!address) return "";
  if (address.city) return address.city;
  if (address.county) return `Kab. ${address.county.replace("Kabupaten ", "")}`;
  return address.town || address.municipality || address.village || "";
}

// --- Fungsi Pengiriman Inti ---

function sendAnalyticsEvent(eventType, dataObject) {
  fetch(ANALYTICS_WEB_APP, {
    method: "POST",
    body: JSON.stringify({ eventType, data: dataObject })
  }).then(res => res.json()).then(result => {
    if (result.status !== "success") {
      console.warn(`📉 Analytics Gagal [${eventType}]:`, result.message);
    }
  }).catch(err => console.error(`❌ Gagal kirim analytics [${eventType}]:`, err));
}

// --- Fungsi Pengiriman Spesifik ---

async function logUserLogin(user) {
  if (!user || user.isAnonymous) return;

  const storedAgeData = JSON.parse(sessionStorage.getItem('ageData') || '{}');
  const locationData = await user_data_service.getCurrentLocation(); // Memanggil service yang ada

  const payload = {
    user_id: user.uid,
    email: user.email,
    user_name: user.displayName || "Tanpa Nama",
    gender: storedAgeData.gender || null,
    minAge: storedAgeData.minAge || null,
    latitude: locationData.latitude || "",
    longitude: locationData.longitude || "",
    country: locationData.country || "",
    display_name: locationData.display_name || "",
    timezone: locationData.timezone || ""
  };
  
  sendAnalyticsEvent("USER_LOGIN_ACTIVITY", payload);
}

function logPageView(user) {
  const { os, browser, device } = getDeviceInfo();
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  let tipe_halaman = "unknown";
  let nama_bahasa = null;
  if (path.includes("index.html") || path === "/") tipe_halaman = "homepage";
  else if (path.includes("bahasa.html")) {
      tipe_halaman = "video_page";
      nama_bahasa = params.get("bahasa") || null;
  }
  else if (path.includes("download")) tipe_halaman = "download_page";

  sendAnalyticsEvent("PAGE_VIEW", {
    timestamp: getFormattedTimestampWIB(),
    user_id: user ? user.uid : "ANONYM",
    user_name: user ? (user.displayName || "Tanpa Nama") : null,
    url_halaman: window.location.href,
    tipe_halaman,
    nama_bahasa,
    device_type: device,
    operating_system: os,
    browser_name: browser
  });
}

function logUserBehavior(eventName, detail1 = "", detail2 = "") {
    const user = auth.currentUser;
    sendAnalyticsEvent("USER_BEHAVIOR", {
        event_date: new Date().toLocaleDateString("id-ID"),
        event_timestamp: getFormattedTimestampWIB(),
        user_id: user ? user.uid : "ANONYM",
        user_name: user ? (user.displayName || "Tanpa Nama") : "ANONYM",
        event_name: eventName,
        event_details_1: detail1,
        event_details_2: detail2
    });
}

function trackVideoInteraction(interactionType, additionalData = {}) {
    const user = auth.currentUser;
    const videoTitle = document.getElementById("videoTitle")?.textContent || "Tanpa Judul";
    const language = window.currentLanguagePage || null;
    const videoId = window.currentVideoId || null;

    sendAnalyticsEvent("VIDEO_INTERACTION", {
        interaction_timestamp: getFormattedTimestampWIB(),
        user_id: user ? user.uid : "ANONYM",
        user_name: user ? user.displayName : "TIDAK DIKETAHUI",
        nama_bahasa: language,
        video_id: videoId,
        video_title: videoTitle,
        interaction_type: interactionType,
        ...additionalData
    });
}

function logDownloadPageInteraction(action_type, action_key = "", action_value = "", action_detail = "") {
    const user = auth.currentUser;
    if (!user) return;

    sendAnalyticsEvent("DOWNLOAD_INTERACTION", {
        timestamp: getFormattedTimestampWIB(),
        user_id: user.uid,
        user_name: user.displayName || "Tanpa Nama",
        action_type: action_type,
        action_key: action_key,
        action_value: action_value,
        action_detail: action_detail
    });
}

export {
    logUserLogin,
    logPageView,
    logUserBehavior,
    trackVideoInteraction,
    logDownloadPageInteraction
};