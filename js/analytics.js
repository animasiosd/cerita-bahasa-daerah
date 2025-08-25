// File: js/analytics.js
// ✅ Versi final – fix integrasi geoTracker.js

const ANALYTICS_WEB_APP = "https://script.google.com/macros/s/AKfycbxm5YQAB2kify_9SzPph5xgaEMlsKpE8UNfrPuvmghgDM9meNKCiDPABKHJ4a4p3Nak/exec";
const videoProgressSession = {};
const videoCompletedSession = {};

/**
 * Format nama kota/kabupaten secara dinamis
 * - Kalau ada city → pakai langsung (contoh: "Semarang")
 * - Kalau ada county → cek apakah sudah ada "Kabupaten", kalau belum → tambahkan "Kab."
 * - Kalau ada town/municipality/village → fallback terakhir
 */
function resolveCityName(address) {
  if (!address) return "";

  // Kota besar → langsung pakai nama city
  if (address.city) {
    return address.city; // contoh: "Semarang"
  }

  // Kalau tidak ada city, tapi ada county → biasanya kabupaten
  if (address.county) {
    if (/Kabupaten/i.test(address.county)) {
      return address.county; // contoh: "Kabupaten Semarang"
    } else {
      return `Kab. ${address.county}`; // contoh: "Kab. Semarang"
    }
  }

  // Fallback: town, municipality, village
  if (address.town) return address.town;
  if (address.municipality) return address.municipality;
  if (address.village) return address.village;

  return "";
}

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

function sendAnalyticsEvent(eventType, dataObject) {
  fetch(ANALYTICS_WEB_APP, {
    method: "POST",
    body: JSON.stringify({ eventType, data: dataObject })
  }).then(res => res.json()).then(result => {
    if (result.status !== "success") {
      console.warn("📉 Analytics gagal:", result.message);
    }
  }).catch(err => console.error("❌ Gagal kirim analytics:", err));
}

async function logUserLogin(user) {
  if (!user || user.isAnonymous) {
    return;
  }

  let locationData = {};
  let ageData = { age_range: null, minAge: null }; // Default value

  try {
    locationData = await getUserLocation();
  } catch (error) {
    console.warn("[Analytics] Gagal mendapatkan data lokasi.", error.message);
  }

  // ======================================================================
  // ✅ BACA DATA USIA DARI SESSIONSTORAGE
  // ======================================================================
  try {
    const storedAgeData = sessionStorage.getItem('ageData');
    if (storedAgeData) {
      ageData = JSON.parse(storedAgeData);
      console.log("[Analytics] Berhasil membaca data usia dari sessionStorage:", ageData);
      // Hapus data dari session setelah dibaca agar bersih
      sessionStorage.removeItem('ageData');
    }
  } catch(e) {
    console.error("[Analytics] Gagal mem-parsing data usia dari sessionStorage", e);
  }

  // Siapkan payload lengkap
  const payload = {
    user_id: user.uid,
    email: user.email,
    user_name: user.displayName || "Tanpa Nama",
    
    // Data usia yang baru didapat
    age_range: ageData.age_range,
    minAge: ageData.minAge,
    
    // Data lokasi
    latitude: locationData.latitude || "",
    longitude: locationData.longitude || "",
    continent: locationData.continent || "",
    country: locationData.country || "",
    country_code: locationData.country_code || "",
    state: locationData.state || "",
    county: locationData.county || "",
    city: locationData.city || "",
    municipality: locationData.municipality || "",
    town: locationData.town || "",
    village: locationData.village || "",
    suburb: locationData.suburb || "",
    road: locationData.road || "",
    postcode: locationData.postcode || "",
    display_name: locationData.display_name || "",
    timezone: locationData.timezone || ""
  };

  console.log("[Analytics] Mengirim data login (termasuk usia) ke server...", payload);
  sendAnalyticsEvent("USER_LOGIN_ACTIVITY", payload);
}

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
    timestamp: getFormattedTimestampWIB(),
    user_id: user ? user.uid : "ANONYM",
    user_name: user ? user.displayName || "Tanpa Nama" : null,
    url_halaman: url,
    tipe_halaman,
    nama_bahasa,
    device_type: device,
    operating_system: os,
    browser_name: browser
  });
}

function trackVideoInteraction(interactionType, additionalData = {}) {
  const user = firebase.auth().currentUser || null;
  const videoTitle = document.getElementById("videoTitle")?.textContent || "Tanpa Judul";
  const language = window.currentLanguagePage || null;
  const videoId = window.currentVideoId || null;
  const geo = window.latestGeoData || {};

  sendVideoInteractionToAnalytics({
    user_id: user ? user.uid : "ANONYM",
    user_name: user ? user.displayName : "TIDAK DIKETAHUI",
    nama_bahasa: language,
    video_id: videoId,
    video_title: videoTitle,
    interaction_type: interactionType,
    ...additionalData,
    latitude: geo.latitude || "",
    longitude: geo.longitude || "",
    continent: geo.continent || "",
    country: geo.country || "",
    country_code: geo.country_code || "",
    state: geo.state || "",
    county: geo.county || "",
    city: resolveCityName(geo),
    municipality: geo.municipality || "",
    town: geo.town || "",
    village: geo.village || "",
    suburb: geo.suburb || "",
    road: geo.road || "",
    postcode: geo.postcode || "",
    timezone: geo.timezone || "",
    display_name: geo.display_name || ""
  });
}

/**
 * Kirim data interaksi video dengan dukungan geoTracker.js
 * Otomatis menyertakan lokasi jika tersedia
 */
function sendVideoInteraction(data) {
  // Ambil lokasi terbaru dari geotracker.js kalau ada
  const geo = window.latestGeoData || {};
  
  sendAnalyticsEvent("VIDEO_INTERACTION", {
    interaction_timestamp: getFormattedTimestampWIB(),
    user_id: data.user_id,
    user_name: data.user_name,
    nama_bahasa: data.nama_bahasa,
    video_id: data.video_id,
    video_title: data.video_title,
    interaction_type: data.interaction_type,
    comment_id: data.comment_id || "",
    video_watch_percentage: data.video_watch_percentage || "",
    video_completed: data.video_completed || "",
    latitude: geo.latitude || "",
    longitude: geo.longitude || "",
    continent: geo.continent || "",
    country: geo.country || "",
    country_code: geo.country_code || "",
    state: geo.state || "",
    county: geo.county || "",
    city: geo.city || "",
    municipality: geo.municipality || "",
    town: geo.town || "",
    village: geo.village || "",
    suburb: geo.suburb || "",
    road: geo.road || "",
    postcode: geo.postcode || "",
    timezone: geo.timezone || "",
    display_name: geo.display_name || ""
  });
}

function sendVideoInteractionToAnalytics(enrichedData) {
  sendAnalyticsEvent("VIDEO_INTERACTION", {
    interaction_timestamp: getFormattedTimestampWIB(),
    user_id: enrichedData.user_id,
    user_name: enrichedData.user_name,
    nama_bahasa: enrichedData.nama_bahasa,
    video_id: enrichedData.video_id,
    video_title: enrichedData.video_title,
    interaction_type: enrichedData.interaction_type,
    comment_id: enrichedData.comment_id || "",
    video_watch_percentage: enrichedData.video_watch_percentage || "",
    video_completed: enrichedData.video_completed || "",
    latitude: enrichedData.latitude || "",
    longitude: enrichedData.longitude || "",
    continent: enrichedData.continent || "",
    country: enrichedData.country || "",
    country_code: enrichedData.country_code || "",
    state: enrichedData.state || "",
    county: enrichedData.county || "",
    city: enrichedData.city || "",
    municipality: enrichedData.municipality || "",
    town: enrichedData.town || "",
    village: enrichedData.village || "",
    suburb: enrichedData.suburb || "",
    road: enrichedData.road || "",
    postcode: enrichedData.postcode || "",
    timezone: enrichedData.timezone || "",
    display_name: enrichedData.display_name || ""
  });
}

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      setTimeout(() => {
        logUserLogin(user);
        logPageView(user);
      }, 500);
    } else {
      logPageView(null);
    }
  });
});

function trackWatchProgress(currentTime, duration) {
  const percentage = Math.floor((currentTime / duration) * 100);
  const user = firebase.auth().currentUser || null;
  const videoId = window.currentVideoId || null;
  const language = window.currentLanguagePage || null;
  const title = document.getElementById("videoTitle")?.textContent || "Tanpa Judul";
  const geo = window.latestGeoData || {};

  if (!videoId || !duration || percentage < 1) return;

  const lastSent = videoProgressSession[videoId] || 0;
  const isCompleted = percentage >= 95;

  // ✅ Kirim progress pada 25%, 50%, 75%, 95%
  const allowedPoints = [25, 50, 75, 95];
  if (allowedPoints.includes(percentage) && percentage !== lastSent) {
    videoProgressSession[videoId] = percentage;

    sendVideoInteractionToAnalytics({
      user_id: user ? user.uid : "ANONYM",
      user_name: user ? user.displayName || "Tanpa Nama" : null,
      nama_bahasa: language,
      video_id: videoId,
      video_title: title,
      interaction_type: "progress_update",
      video_watch_percentage: percentage,
      video_completed: "",
      latitude: geo.latitude || "",
      longitude: geo.longitude || "",
      continent: geo.continent || "",
      country: geo.country || "",
      country_code: geo.country_code || "",
      state: geo.state || "",
      county: geo.county || "",
      city: resolveCityName(geo),
      municipality: geo.municipality || "",
      town: geo.town || "",
      village: geo.village || "",
      suburb: geo.suburb || "",
      road: geo.road || "",
      postcode: geo.postcode || "",
      timezone: geo.timezone || "",
      display_name: geo.display_name || ""
    });
  }

  // ✅ Tetap kirim data ketika video selesai ditonton
  if (isCompleted && !videoCompletedSession[videoId]) {
    videoCompletedSession[videoId] = true;

    sendVideoInteractionToAnalytics({
      user_id: user ? user.uid : "ANONYM",
      user_name: user ? user.displayName || "Tanpa Nama" : null,
      nama_bahasa: language,
      video_id: videoId,
      video_title: title,
      interaction_type: "progress_update",
      video_watch_percentage: percentage,
      video_completed: "",
      latitude: geo.latitude || "",
      longitude: geo.longitude || "",
      country: geo.country || "",
      state_province: geo.state_province || "",
      city: resolveCityName(geo),
      postcode: geo.postcode || "",
      timezone: geo.timezone || ""
    });
  }
}


let playerInterval = null;

function startTrackingPlayerProgress(player) {
  clearInterval(playerInterval);
  playerInterval = setInterval(() => {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    trackWatchProgress(currentTime, duration);
  }, 1000);
}

function attachPlayerEventListeners(player) {
  player.addEventListener("onStateChange", function (event) {
    const duration = player.getDuration();
    const currentTime = player.getCurrentTime();
    const percentage = Math.floor((currentTime / duration) * 100);

    if (event.data === YT.PlayerState.PLAYING) {
      trackVideoInteraction("play", { video_watch_percentage: percentage });
      startTrackingPlayerProgress(player);
    } 
    else if (event.data === YT.PlayerState.PAUSED) {
      trackVideoInteraction("pause", { video_watch_percentage: percentage });
    } 
    else if (event.data === YT.PlayerState.ENDED) {
      if (!videoCompletedSession[window.currentVideoId]) {
        trackVideoInteraction("video_completed", { video_watch_percentage: 100 });
        videoCompletedSession[window.currentVideoId] = true;
      }
    }
  });

  // ✅ Deteksi fullscreen
  document.addEventListener("fullscreenchange", () => {
    const percentage = Math.floor((player.getCurrentTime() / player.getDuration()) * 100);
    if (document.fullscreenElement) {
      trackVideoInteraction("enter_fullscreen", { video_watch_percentage: percentage });
    } else {
      trackVideoInteraction("exit_fullscreen", { video_watch_percentage: percentage });
    }
  });
}

function logUserBehavior(eventName, detail1 = "", detail2 = "") {
  const user = firebase.auth().currentUser || null;

  sendAnalyticsEvent("USER_BEHAVIOR", {
    event_date: new Date().toLocaleDateString("id-ID"),
    event_timestamp: getFormattedTimestampWIB(),
    user_id: user ? user.uid : "ANONYM",
    user_name: user ? user.displayName || "Tanpa Nama" : "ANONYM",
    event_name: eventName,
    event_details_1: detail1,
    event_details_2: detail2
  });
}

function logDownloadPageInteraction(action_type, action_key = "", action_value = "", action_detail = "") {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const payload = {
    eventType: "DOWNLOAD_INTERACTION",
    data: {
      timestamp: getFormattedTimestampWIB(),
      user_id: user.uid,
      user_name: user.displayName || "Tanpa Nama",
      action_type: action_type,
      action_key: action_key,
      action_value: action_value,
      action_detail: action_detail
    }
  };

  fetch(ANALYTICS_WEB_APP, {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(err => console.error("logDownloadPageInteraction error:", err));
}
