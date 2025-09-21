// ======================================================================
// File: js/send_data/analytics_service.js
// Deskripsi: Bertanggung jawab untuk MENGIRIM semua data tracking
//            ke endpoint Google Apps Script.
// ======================================================================
import { user_data_service } from '../load_data/user_data_service.js';
import { auth } from '../ui/page_auth.js';
import { api_service } from '../load_data/api_service.js';
import { EventTracker } from '../events.js';  // ⬅️ pastikan import di atas file

const videoProgressSession = {};
const videoCompletedSession = {};

// Ambil parameter bahasa & displayName (jika ada)
const params = new URLSearchParams(window.location.search);
const languageSlug = params.get("bahasa") || "";
const languageDisplayName = window.currentLanguageDisplayName || languageSlug;

function resolveLanguageName() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("bahasa") || "";

  // ✅ 1. Jika page_video.js sudah set -> pakai itu
  if (window.currentLanguagePage) return window.currentLanguagePage;

  // ✅ 2. Jika belum ada, coba ambil dari slug yang diformat (lebih aman)
  if (slug) {
    return slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // ✅ 3. Terakhir, barulah pakai judul tab bila pola cocok
  const match = document.title.match(/^Cerita Bahasa (.+)$/);
  return match ? match[1] : null;
}


// ======================================================================
// Fungsi untuk update favorite_languages & last_accessed_language
// ======================================================================
async function updateFavoriteLanguage(languageName) {
    const user = auth.currentUser;
    if (!user || !languageName) return;

    const cleanName = window.currentLanguageDisplayName || languageName;
    const storedLanguages = JSON.parse(sessionStorage.getItem("favorite_languages") || "[]");

    if (!storedLanguages.includes(cleanName)) {
        storedLanguages.push(cleanName);
    }

    sessionStorage.setItem("favorite_languages", JSON.stringify(storedLanguages));

    const locationData = await user_data_service.getCurrentLocation();

    const payload = {
        interaction_date: new Date().toLocaleDateString("id-ID"),
        interaction_timestamp: getFormattedTimestampWIB(),
        user_id: user.uid,
        email: user.email || "",
        user_name: user.displayName || "Tanpa Nama",
        profile_photo_url: user.photoURL || "",
        auth_provider: user.providerData?.[0]?.providerId || "unknown",
        favorite_languages: storedLanguages.length > 0 ? storedLanguages.join(", ") : "-",
        last_accessed_language: cleanName || "-",
        latitude: locationData.latitude || "",
        longitude: locationData.longitude || "",
        country: locationData.country || "",
        display_name: locationData.display_name || "",
        timezone: locationData.timezone || ""
    };

    fetch(api_service._URL_ANALYTICS_WEB_APP, {
        method: "POST",
        body: JSON.stringify({
            eventType: "USER_PROFILE_UPDATE",
            data: payload
        })
    }).catch(err => console.error("❌ Gagal update bahasa favorit:", err));
}

/**
 * Membuat atau mengambil session_id unik untuk setiap sesi kunjungan.
 * ID ini akan hilang saat tab browser ditutup.
 */
function getSessionId() {
  const SESSION_KEY = 'session_id';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // Buat ID baru jika belum ada: Waktu saat ini + Angka acak
    sessionId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// ======================================================================
// Helper Functions
// ======================================================================
/**
 * Helper function untuk format tanggal AppSheet
 * @param {string | Date} dateInput - Tanggal dalam format string atau objek Date
 * @param {boolean} includeTime - Apakah akan menyertakan waktu dalam output
 * @returns {string} - Tanggal yang sudah diformat (contoh: 09/12/2025 atau 09/12/2025 07:30:00)
 */

function getFormattedTimestampWIB(includeTime = true) {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }

  const formatted = new Intl.DateTimeFormat('en-US', options).format(now);
  // Hasil default "MM/DD/YYYY, HH:mm:ss" → hilangkan koma bila ada
  return formatted.replace(',', '');
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
    const device = /Mobi/i.test(ua) ? "Mobile" : "Desktop";
    return { os, browser, device };
}

function sendAnalyticsEvent(eventType, dataObject) {
    fetch(api_service._URL_ANALYTICS_WEB_APP, {
        method: "POST",
        mode: "no-cors",
        //headers: {"Content-Type": "text/plain;charset=utf-8"},
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ eventType, data: dataObject }),
    })
    .then(async res => {
        if (!res.ok) {
            const text = await res.text();
            //console.error(`❌ Gagal kirim analytics [${eventType}]:`, text);
            return;
        }
        return res.json();
    })
    .then(result => {
        if (result && result.status !== "success") {
            console.warn(`📉 Analytics Gagal [${eventType}]:`, result.message);
        }
    })
    .catch(err => {
        console.error(`❌ CORS Error [${eventType}]:`, err);
    });

}

async function maybeRefreshAgeDataFromSession() {
  let storedAgeData = JSON.parse(sessionStorage.getItem('ageData') || '{}');
  if (!storedAgeData || Object.keys(storedAgeData).length === 0) {
    const token = sessionStorage.getItem('googleAccessToken');
    if (token) {
      const fresh = await user_data_service.fetchGoogleProfile(token);
      if (fresh && (fresh.minAge || fresh.birthday || fresh.gender)) {
        sessionStorage.setItem('ageData', JSON.stringify(fresh));
        return fresh;
      } else {
        // Jangan return {} kalau gagal → tetap pakai data lama (robust)
        return storedAgeData;
      }
    }
  }
  return storedAgeData;
}

// ======================================================================
// Fungsi Pengiriman Spesifik
// ======================================================================
async function logUserLogin(user) {
    if (!user || user.isAnonymous) return;

    /**
     * Helper function baru untuk format tanggal AppSheet
     * @param {string | Date} dateInput - Tanggal dalam format string atau objek Date
     * @param {boolean} includeTime - Apakah akan menyertakan waktu dalam output
     * @returns {string} - Tanggal yang sudah diformat (contoh: 09/10/2025 atau 09/10/2025 07:30:00)
     */

    const { os, browser, device } = getDeviceInfo();
    const storedAgeData = JSON.parse(sessionStorage.getItem('ageData') || '{}');
    const storedLanguages = JSON.parse(sessionStorage.getItem("favorite_languages") || "[]");
    const locationData = await user_data_service.getCurrentLocation();
    
    // Payload dengan format tanggal & waktu yang sudah disesuaikan untuk AppSheet
    const payload = {
        last_updated_date: getFormattedTimestampWIB(false), // Format: MM/DD/YYYY
        last_updated_timestamp: getFormattedTimestampWIB(), // Format: MM/DD/YYYY HH:mm:ss
        user_id: user.uid,
        email: user.email || "",
        user_name: user.displayName || "Tanpa Nama",
        profile_photo_url: user.photoURL || "",
        auth_provider: user.providerData?.[0]?.providerId || "unknown",
        first_login: getFormattedTimestampWIB(user.metadata.creationTime), // Format: MM/DD/YYYY HH:mm:ss
        last_login: getFormattedTimestampWIB(user.metadata.lastSignInTime), // Format: MM/DD/YYYY HH:mm:ss
        // ... sisa properti payload tetap sama ...
        birthday: storedAgeData.birthday || "",
        age_range: storedAgeData.minAge ? `${storedAgeData.minAge}+` : "",
        minAge: storedAgeData.minAge || "",
        age_range_category: storedAgeData.minAge ? getAgeCategory(storedAgeData.minAge) : "Tidak Diketahui",
        gender: storedAgeData.gender || "Tidak Diketahui",
        favorite_languages: storedLanguages.length > 0 ? storedLanguages.join(", ") : "",
        last_accessed_language: storedLanguages.slice(-1)[0] || "",
        last_device_type: device,
        last_os: os,
        last_browser: browser,
        signup_referrer: document.referrer || "direct",
        first_latitude: locationData.latitude || "",
        first_longitude: locationData.longitude || "",
        first_continent: locationData.continent || "",
        first_country: locationData.country || "",
        first_country_code: locationData.country_code || "",
        first_state: locationData.state || "",
        first_county: locationData.county || "",
        first_city: locationData.city || "",
        first_municipality: locationData.municipality || "",
        first_town: locationData.town || "",
        first_village: locationData.village || "",
        first_suburb: locationData.suburb || "",
        first_road: locationData.road || "",
        first_postcode: locationData.postcode || "",
        first_display_name: locationData.display_name || "",
        first_timezone: locationData.timezone || "",
        last_latitude: locationData.latitude || "",
        last_longitude: locationData.longitude || "",
        last_continent: locationData.continent || "",
        last_country: locationData.country || "",
        last_country_code: locationData.country_code || "",
        last_state: locationData.state || "",
        last_county: locationData.county || "",
        last_city: locationData.city || "",
        last_municipality: locationData.municipality || "",
        last_town: locationData.town || "",
        last_village: locationData.village || "",
        last_suburb: locationData.suburb || "",
        last_road: locationData.road || "",
        last_postcode: locationData.postcode || "",
        last_display_name: locationData.display_name || "",
        last_timezone: locationData.timezone || "",
        last_session_id: getSessionId()
    };
    
    sendAnalyticsEvent("USER_LOGIN_ACTIVITY", payload);
}

async function logPageView(user) {
    const { os, browser, device } = getDeviceInfo();
    const languageName = resolveLanguageName();
    const locationData = await user_data_service.getCurrentLocation();
    if (locationData && locationData.latitude) {
        sessionStorage.setItem('locationData', JSON.stringify(locationData));
    }
    const storedAgeData = JSON.parse(sessionStorage.getItem('ageData') || '{}');

    const payload = {
      // Waktu & Sesi
      event_date: getFormattedTimestampWIB(false),
      event_timestamp: getFormattedTimestampWIB(),
      session_id: getSessionId(),

      // Konteks Halaman
      page_url: window.location.href,
      page_title: document.title,
      language_name: languageName,
      referrer_url: document.referrer || "direct",

      // Info Pengguna
      user_id: user ? user.uid : "ANONYM",
      email: user ? user.email : "ANONYM",
      user_name: user ? (user.displayName || "Tanpa Nama") : "ANONYM",
      profile_photo_url: user ? (user.photoURL || "") : "", 
      auth_provider: user ? (user.providerData?.[0]?.providerId || "unknown") : "anonymous",
      role: "user", 

      // Demografi
      gender: storedAgeData.gender || "Tidak Diketahui",
      age_range_category: storedAgeData.minAge ? getAgeCategory(storedAgeData.minAge) : "Tidak Diketahui",
      
      // Info Teknis
      device_type: device,
      os: os,
      browser: browser,

      // Geografis
      road: locationData.road || "", 
      village: locationData.village || "",
      city: locationData.city || locationData.town || locationData.county || "",
      state: locationData.state || "",
      country: locationData.country || "",
      display_name: locationData.display_name || ""
    };
    sendAnalyticsEvent("PAGE_VIEW", payload);
}

// Helper function untuk kategori usia
function getAgeCategory(minAge) {
  if (!minAge || isNaN(minAge)) return "Tidak Diketahui";
  if (minAge >= 60) return "Lansia";
  if (minAge >= 40) return "Dewasa Paruh Baya";
  if (minAge >= 20) return "Dewasa Muda";
  if (minAge >= 12) return "Remaja";
  if (minAge >= 5) return "Anak-anak";
  return "Di Bawah Umur";
}

async function logUserBehavior(event_action, event_label = "", event_value = "") {
    const user = auth.currentUser;
    const { os, browser, device } = getDeviceInfo(); // BARU: Ambil info os & browser
    const languageName = resolveLanguageName();
    const storedAgeData = await maybeRefreshAgeDataFromSession();
    
    let locationData = JSON.parse(sessionStorage.getItem('locationData') || '{}');
    if (!locationData.latitude) {
        locationData = await user_data_service.getCurrentLocation();
    }

    const payload = {
        // Waktu & Sesi
        event_date: new Date().toLocaleDateString("id-ID", { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'),
        event_timestamp: getFormattedTimestampWIB(),
        session_id: getSessionId(),

        // Info Pengguna
        user_id: user ? user.uid : "ANONYM",
        email: user ? user.email : "ANONYM",
        user_name: user ? (user.displayName || "Tanpa Nama") : "ANONYM",
        role: "user", // Akan ditimpa oleh server
        profile_photo_url: user ? (user.photoURL || "") : "", // BARU
        auth_provider: user ? (user.providerData?.[0]?.providerId || "unknown") : "anonymous", // BARU

        // Demografi
        gender: storedAgeData.gender || "Tidak Diketahui",
        age_range_category: storedAgeData.minAge ? getAgeCategory(storedAgeData.minAge) : "Tidak Diketahui",
        
        // Info Teknis
        device_type: device,
        os: os, // BARU
        browser: browser, // BARU

        // Konteks Halaman
        page_url: window.location.href,
        page_title: document.title || window.location.pathname,
        language_name: languageName,
        referrer_url: document.referrer || "direct", // BARU

        // Geografis
        road: locationData.road || "", // BARU
        village: locationData.village || "",
        city: locationData.city || locationData.town || locationData.county || "", 
        state: locationData.state || "",
        country: locationData.country || "",
        display_name: locationData.display_name || "", // BARU

        // Detail Event
        event_action: event_action,
        event_label: event_label,
        event_value: event_value
    };
    sendAnalyticsEvent("USER_BEHAVIOR", payload);
}

async function trackVideoInteraction(event_action, event_details_1 = "", event_details_2 = "") {
    const now = Date.now();
    const videoKey = window.currentVideoId || 'NO_VIDEO_ID';
    if (!videoProgressSession[videoKey]) {
        videoProgressSession[videoKey] = { lastAction: null, lastTs: 0 };
    }
    const last = videoProgressSession[videoKey];
    // jika action sama dengan terakhir dan terjadi dalam 700ms -> abaikan
    if (last.lastAction === event_action && (now - last.lastTs) < 700) {
        console.log(`[Analytics] supressed duplicate video event: ${event_action} for ${videoKey}`);
        return; // suppress duplicate
    }
    // update history
    videoProgressSession[videoKey].lastAction = event_action;
    videoProgressSession[videoKey].lastTs = now;
    
    const user = auth.currentUser;
    const { os, browser, device } = getDeviceInfo();

    // Ambil data dari elemen halaman dan variabel global
    const videoTitle = document.getElementById("videoTitle")?.textContent || "Tanpa Judul";
    const languageName = resolveLanguageName();
    const videoId = window.currentVideoId || null;

    // Ambil data demografi & lokasi dari cache sesi
    let storedAgeData = JSON.parse(sessionStorage.getItem('ageData') || '{}');
    let locationData = JSON.parse(sessionStorage.getItem('locationData') || '{}');
    if (!locationData.latitude) {
        locationData = await user_data_service.getCurrentLocation();
        if (locationData && locationData.latitude) {
            sessionStorage.setItem('locationData', JSON.stringify(locationData));
        }
    }

    const payload = {
        // Waktu & Sesi
        event_date: getFormattedTimestampWIB(false),
        event_timestamp: getFormattedTimestampWIB(),
        session_id: getSessionId(),

        // Info Pengguna
        user_id: user ? user.uid : "ANONYM",
        email: user ? user.email : "ANONYM",
        user_name: user ? (user.displayName || "Tanpa Nama") : "ANONYM",
        profile_photo_url: user ? (user.photoURL || "") : "",
        role: "user", // Akan ditimpa oleh server

        // Demografi (Lengkap)
        gender: storedAgeData.gender || "Tidak Diketahui",
        age_range_category: storedAgeData.minAge ? getAgeCategory(storedAgeData.minAge) : "Tidak Diketahui",
        birthday: storedAgeData.birthday || "",
        age_range: storedAgeData.minAge ? `${storedAgeData.minAge}+` : "",
        minAge: storedAgeData.minAge || "",

        // Info Teknis
        device_type: device,
        os: os,
        browser: browser,

        // Konteks Halaman & Video
        page_url: window.location.href,
        referrer_url: document.referrer || "direct",
        language_name: languageName,
        video_id: videoId,
        video_title: videoTitle,

        // Detail Event
        event_action: event_action,
        event_details_1: event_details_1,
        event_details_2: event_details_2,

        // Geografis (Lengkap)
        latitude: locationData.latitude || "",
        longitude: locationData.longitude || "",
        road: locationData.road || "",
        village: locationData.village || "",
        city: locationData.city || "",
        state: locationData.state || "",
        country: locationData.country || "",
        continent: locationData.continent || "",
        timezone: locationData.timezone || "",
        display_name: locationData.display_name || ""
    };
    
    sendAnalyticsEvent("VIDEO_INTERACTION", payload);
}

async function logDownloadPageInteraction(action_key_val, language_val = "", title_val = "", sequence_val = "") {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Kumpulkan semua data konteks
    const { os, browser, device } = getDeviceInfo();
    const storedAgeData = JSON.parse(sessionStorage.getItem('ageData') || '{}');
    let locationData = JSON.parse(sessionStorage.getItem('locationData') || '{}');
    if (!locationData.latitude) {
        locationData = await user_data_service.getCurrentLocation();
        if (locationData.latitude) {
            sessionStorage.setItem('locationData', JSON.stringify(locationData));
        }
    }

    // 2. Susun payload yang lengkap sesuai header baru
    const payload = {
        // Waktu & Sesi
        event_date: new Date().toLocaleDateString("id-ID", { year: 'numeric', month: '2-digit', day: '2-digit' }), // BARU
        event_timestamp: getFormattedTimestampWIB(), // DIPERBAIKI: dari 'timestamp' menjadi 'event_timestamp'
        session_id: getSessionId(),
        
        // Konteks Halaman
        page_url: window.location.href,
        page: document.title || window.location.pathname, // BARU
        referrer_url: document.referrer || "direct", // BARU

        // Info Pengguna
        user_id: user.uid,
        email: user.email || "ANONYM",
        user_name: user.displayName || "Tanpa Nama",
        
        // Info Demografi
        gender: storedAgeData.gender || "Tidak Diketahui",
        age_range_category: storedAgeData.minAge ? getAgeCategory(storedAgeData.minAge) : "Tidak Diketahui",

        // Info Teknis
        device_type: device,
        operating_system: os,
        browser_name: browser,
        
        // Info Geografis (dengan 'village')
        village: locationData.village || "", // BARU
        city: locationData.city || locationData.town || locationData.county || "",
        state: locationData.state || "",
        country: locationData.country || "",
        
        // Detail Aksi
        action_key: action_key_val,
        language: language_val,
        title: title_val,
        sequence: sequence_val
    };

    // 3. Kirim event
    sendAnalyticsEvent("DOWNLOAD_INTERACTION", payload);
}

export {
    logUserLogin,
    updateFavoriteLanguage,
    logPageView,
    logUserBehavior,
    trackVideoInteraction,
    logDownloadPageInteraction,
    getFormattedTimestampWIB
};

// ========== GLOBAL USER_BEHAVIOR FALLBACK LOGGER ==========
// Tujuan: memastikan setiap klik UI tercatat sebagai user_behavior
//        meski EventTracker khusus tidak terpanggil.

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a, [data-analytics]');
    if (!el) return;

    // Gunakan data-analytics > id > textContent (maks 60 karakter)
    const label =
      el.dataset.analytics ||
      el.id ||
      (el.textContent || '').trim().slice(0, 60) ||
      'unlabeled';

    // Tentukan kategori untuk kolom event_label (seperti di EventTracker)
    // Navbar → "Navbar", Footer → "Footer", lainnya → "Global"
    let category = 'Global';
    if (el.closest('nav')) category = 'Navbar';
    else if (el.closest('footer')) category = 'Footer';

    // Panggil EventTracker agar urutan kolom & struktur
    // sama dengan semua event di events.js
    // → parameter: (event_action, event_label, event_value)
    EventTracker &&
      EventTracker.page &&
      EventTracker.page.view &&
      EventTracker.page.view(); // tetap log page_view

    // Catat klik sebagai USER_BEHAVIOR resmi
    // action: 'UI Click'  |  label: category  |  value: label
    if (window.EventTracker?.auth) {
      // panggil logUserBehavior via EventTracker agar konsisten
      // tidak langsung ke logUserBehavior()
      logUserBehavior('UI Click', category, label);
    }
  });
});
