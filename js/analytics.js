// File: js/analytics.js sudah berhasil 3 yaitu sheet user_list, user_per_page

const ANALYTICS_WEB_APP = "https://script.google.com/macros/s/AKfycbxm5YQAB2kify_9SzPph5xgaEMlsKpE8UNfrPuvmghgDM9meNKCiDPABKHJ4a4p3Nak/exec";
const videoProgressSession = {};
const videoCompletedSession = {};

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

function logUserLogin(user) {
  if (!user) return;
  sendAnalyticsEvent("USER_LOGIN_ACTIVITY", {
    user_id: user.uid,
    email: user.email,
    user_name: user.displayName || "Tanpa Nama",
    age_range: null,
    minAge: null,
    first_login_city: null,
    last_login_city: null,
    first_login_country: null,
    last_login_country: null
  });
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
  
  sendVideoInteraction({
    user_id: user ? user.uid : "ANONYM",
    user_name: user ? user.displayName : "TIDAK DIKETAHUI",
    nama_bahasa: language,
    video_id: videoId,
    video_title: videoTitle,
    interaction_type: interactionType,
    ...additionalData
  });
}

function sendVideoInteraction(data) {
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
    video_completed: data.video_completed || ""
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

  if (!videoId || !duration || percentage < 5) return;

  const lastSent = videoProgressSession[videoId] || 0;
  const isCompleted = percentage >= 95;

  const allowedPoints = [25, 50, 75, 95];
  if (allowedPoints.includes(percentage) && percentage !== lastSent) {
    videoProgressSession[videoId] = percentage;

    sendAnalyticsEvent("VIDEO_INTERACTION", {
      interaction_timestamp: getFormattedTimestampWIB(),
      user_id: user ? user.uid : "ANONYM",
      user_name: user ? user.displayName || "Tanpa Nama" : null,
      nama_bahasa: language,
      video_id: videoId,
      video_title: title,
      interaction_type: "progress_update",
      comment_id: "",
      video_watch_percentage: percentage,
      video_completed: ""
    });
  }

  if (isCompleted && !videoCompletedSession[videoId]) {
    videoCompletedSession[videoId] = true;

    sendAnalyticsEvent("VIDEO_INTERACTION", {
      interaction_timestamp: getFormattedTimestampWIB(),
      user_id: user ? user.uid : "ANONYM",
      user_name: user ? user.displayName || "Tanpa Nama" : null,
      nama_bahasa: language,
      video_id: videoId,
      video_title: title,
      interaction_type: "video_completed",
      comment_id: "",
      video_watch_percentage: percentage,
      video_completed: "yes"
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
    } else if (event.data === YT.PlayerState.PAUSED) {
      trackVideoInteraction("pause", { video_watch_percentage: percentage });
    } else if (event.data === YT.PlayerState.ENDED) {
      trackVideoInteraction("ended", { video_watch_percentage: percentage });
    }
  });
}
