// File: js/geotracker.js
// ✅ Versi Final - Integrasi analytics.js & video_interaction

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

// Cache sederhana untuk menghindari pemanggilan API berulang
let locationCache = null;
let isTrackingInProgress = false;

/**
 * Ambil lokasi pengguna menggunakan Geolocation API + Reverse Geocoding Nominatim
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
                    // Cek cache → update koordinat biar akurat
                    if (locationCache) {
                        resolve({ ...locationCache, latitude, longitude });
                        return;
                    }

                    // Panggil Nominatim API
                    const response = await fetch(`${NOMINATIM_URL}?lat=${latitude}&lon=${longitude}&format=json`, {
                        method: "GET",
                        headers: {
                            "Accept": "application/json",
                            "User-Agent": "CeritaBahasaDaerahApp/1.0",
                            "Referer": window.location.origin
                        },
                        cache: "no-store"
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

        // Gabungkan data interaksi dengan data lokasi lengkap
        const enrichedData = {
            ...interactionData,
            latitude: location.latitude,
            longitude: location.longitude,
            continent: location.continent,
            country: location.country,
            country_code: location.country_code,
            state: location.state,
            county: location.county,
            city: location.city,
            municipality: location.municipality,
            town: location.town,
            village: location.village,
            suburb: location.suburb,
            road: location.road,
            postcode: location.postcode,
            display_name: location.display_name,
            timezone: location.timezone
        };

        // Kirim ke analytics.js
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
