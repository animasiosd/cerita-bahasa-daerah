// File: js/client_performance_and_errors.js

const ANALYTICS_WEB_APP = "https://script.google.com/macros/s/AKfycbxm5YQAB2kify_9SzPph5xgaEMlsKpE8UNfrPuvmghgDM9meNKCiDPABKHJ4a4p3Nak/exec";

// ✅ Helper untuk kirim data ke Google Sheets
function logClientEvent(eventType, details = {}) {
  const user = firebase.auth().currentUser || null;

  const payload = {
    eventType: "CLIENT_EVENT",
    data: {
      timestamp: new Date().toISOString(),
      user_id: user ? user.uid : "ANONYM",
      user_name: user ? (user.displayName || "Tanpa Nama") : "ANONYM",
      event_type: eventType,
      page_url: window.location.href,
      load_time_ms: details.load_time_ms || null,
      error_message: details.error_message || null,
      browser_name: navigator.userAgent
    }
  };

  fetch(ANALYTICS_WEB_APP, {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(err => console.error("❌ logClientEvent error:", err));
}

// -------- TRACK PAGE LOAD LAMBAT --------
window.addEventListener("load", () => {
  const perfData = window.performance.timing;
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;

  if (loadTime > 3000) { // hanya log kalau > 3 detik
    logClientEvent("PAGE_LOAD_SLOW", { load_time_ms: loadTime });
  }
});

// -------- TRACK RUNTIME ERROR (JS error) --------
const loggedErrors = new Set();
window.addEventListener("error", (event) => {
  const errorMsg = event.message || "Unknown Error";
  const key = `${window.location.href}-${errorMsg}`;
  if (loggedErrors.has(key)) return; // jangan spam error yang sama
  loggedErrors.add(key);

  logClientEvent("JS_RUNTIME_ERROR", { error_message: errorMsg });
});

// -------- TRACK RESOURCE ERROR (CSS/JS gagal load) --------
window.addEventListener("error", (event) => {
  if (event.target.tagName) {
    const resource = event.target.src || event.target.href;
    if (resource) {
      logClientEvent("RESOURCE_ERROR", { error_message: `Gagal load: ${resource}` });
    }
  }
}, true);
