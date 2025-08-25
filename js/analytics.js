// File: js/analytics.js
// ✅ Versi Final – Fix integrasi geoTracker.js & ageData

const ANALYTICS_WEB_APP = "https://script.google.com/macros/s/AKfycbxm5YQAB2kify_9SzPph5xgaEMlsKpE8UNfrPuvmghgDM9meNKCiDPABKHJ4a4p3Nak/exec";
const videoProgressSession = {};
const videoCompletedSession = {};

/**
 * Format nama kota/kabupaten secara dinamis
 */
function resolveCityName(address) {
  if (!address) return "";
  if (address.city) return address.city;
  if (address.county) {
    if (/Kabupaten/i.test(address.county)) return address.county;
    return `Kab. ${address.county}`;
  }
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

async function waitForAgeData(maxWait = 3000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const ageData = sessionStorage.getItem("ageData");
    if (ageData && ageData !== "{}") return JSON.parse(ageData);
    await new Promise(res => setTimeout(res, 200));
  }
  console.warn("[Analytics] ageData tidak tersedia, gunakan nilai default.");
  return {};
}

async function logUserLogin(user, profileData = {}) {
  if (!user) return;

  // ✅ Pastikan ageData sudah siap
  const ageData = Object.keys(profileData).length
    ? profileData
    : await waitForAgeData();

  const geoData = window.latestGeoData || {};

  const payload = {
    eventType: "USER_LOGIN_ACTIVITY",
    data: {
      user_id: user.uid,
      email: user.email,
      user_name: user.displayName,
      birthday: ageData.birthday || "",
      gender: ageData.gender || "Tidak Diketahui",
      minAge: ageData.minAge || "",
      age_range: ageData.age_range || "",
      age_range_category: ageData.age_range_category || "",
      ...geoData
    }
  };

  try {
    await fetch(ANALYTICS_WEB_APP, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("[Analytics] Data login user berhasil dikirim:", payload);
  } catch (err) {
    console.error("[Analytics] Gagal kirim data login:", err);
  }
}

function logPageView(user) {
  const deviceInfo = getDeviceInfo();
  const geoData = window.latestGeoData || {};
  const currentUrl = window.location.href;

  const data = {
    timestamp: getFormattedTimestampWIB(),
    user_id: user ? user.uid : "GUEST",
    user_name: user ? user.displayName : "Pengunjung",
    url_halaman: currentUrl,
    tipe_halaman: document.title || "Halaman",
    nama_bahasa: geoData.language || "",
    device_type: deviceInfo.device,
    operating_system: deviceInfo.os,
    browser_name: deviceInfo.browser
  };

  sendAnalyticsEvent("PAGE_VIEW", data);
  console.log("[Analytics] Page view terkirim:", data);
}

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      setTimeout(() => {
        logUserLogin(user);
        logPageView(user);
      }, 3000);
    } else {
      logPageView(null);
    }
  });
});
