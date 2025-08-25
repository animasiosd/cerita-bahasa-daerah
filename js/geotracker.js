// File: js/geotracker.js
// Versi Final - Integrasi ke analytics.js dan video_interaction
// Evan Rindi Silvanus - 2025

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

// Cache sederhana untuk menghindari pemanggilan API berulang
let locationCache = null;
let isTrackingInProgress = false;

/**
 * Ambil lokasi pengguna menggunakan Geolocation API
 * @returns {Promise<Object>} Data lokasi lengkap
 */
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.warn("Geolocation tidak didukung browser ini.");
            return reject("Geolocation tidak didukung");
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Cek cache terlebih dahulu
                    if (locationCache) {
                        resolve({ ...locationCache, latitude, longitude });
                        return;
                    }

                    // Panggil Nominatim API tanpa caching
                    const response = await fetch(`${NOMINATIM_URL}?lat=${latitude}&lon=${longitude}&format=json`, {
                        method: "GET",
                        headers: {
                            "Accept": "application/json",
                            "User-Agent": "CeritaBahasaDaerahApp/1.0"
                        },
                        cache: "no-store" // Penting: tidak cache Nominatim API
                    });

                    if (!response.ok) throw new Error("Gagal ambil data lokasi");

                    const data = await response.json();
                    const address = data.address || {};

                    // Ambil timezone dari browser
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                    // Simpan hasil di cache
                    locationCache = {
                        latitude,
                        longitude,
                        continent: address.continent || "",
                        country: address.country || "",
                        country_code: address.country_code || "",
                        state: address.state || "",
                        county: address.county || "",
                        city: address.city || "",
                        municipality: address.municipality || "",
                        town: address.town || "",
                        village: address.village || "",
                        suburb: address.suburb || "",
                        road: address.road || "",
                        postcode: address.postcode || "",
                        display_name: data.display_name || "",
                        timezone
                    };

                    resolve(locationCache);
                } catch (error) {
                    console.error("Gagal mengambil lokasi:", error);
                    reject(error);
                }
            },
            (error) => {
                console.error("Izin geolocation ditolak atau gagal:", error);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Kirim data lokasi + tracking interaksi video ke analytics.js
 */
async function trackVideoLocationInteraction(interactionData) {
    if (isTrackingInProgress) return;
    isTrackingInProgress = true;

    try {
        const location = await getUserLocation();

        // Gabungkan data interaksi dengan data lokasi
        const enrichedData = {
            ...interactionData,
            latitude: location.latitude,
            longitude: location.longitude,
            country: location.country,
            state_province: location.state_province,
            city: location.city,
            postcode: location.postcode,
            timezone: location.timezone
        };

        // Kirim ke analytics.js (pastikan fungsi ini sudah ada di analytics.js)
        if (typeof sendVideoInteractionToAnalytics === "function") {
            sendVideoInteractionToAnalytics(enrichedData);
        } else {
            console.error("Fungsi sendVideoInteractionToAnalytics tidak ditemukan di analytics.js");
        }
    } catch (error) {
        console.error("Gagal tracking lokasi interaksi video:", error);
    } finally {
        isTrackingInProgress = false;
    }
}

// ✅ Ambil lokasi user otomatis sekali saat halaman dimuat
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const location = await getUserLocation();
        window.latestGeoData = location; // Simpan global agar analytics.js bisa akses
    } catch (error) {
        console.warn("[GeoTracker] Gagal ambil lokasi:", error);
        window.latestGeoData = {}; // Pastikan tidak undefined
    }
});
