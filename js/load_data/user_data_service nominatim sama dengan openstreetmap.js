// File: js/load_data/user_data_service.js

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
let locationCache = null;

export const user_data_service = {
    /**
     * Mengambil lokasi pengguna menggunakan Geolocation & Nominatim API.
     * Asal Kode: geotracker.js
     */
    async getCurrentLocation() {
    return new Promise((resolve) => {
        if (locationCache) {
            return resolve(locationCache);
        }
            if (!navigator.geolocation) {
            return resolve({});
        }
            navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                    try {
                    const response = await fetch(`${NOMINATIM_URL}?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await response.json();
                        
                        // --- PERBAIKAN DI SINI: MELENGKAPI SEMUA FIELD LOKASI ---
                        locationCache = {
                            latitude: latitude,
                            longitude: longitude,
                            continent: data.address?.continent || "",
                            country: data.address?.country || "",
                            country_code: data.address?.country_code || "",
                            state: data.address?.state || "",
                            county: data.address?.county || "",
                            city: data.address?.city ||  "",
                            municipality: data.address?.municipality || "",
                            town: data.address?.town || "",
                            village: data.address?.village || "",
                            suburb: data.address?.suburb || "",
                            road: data.address?.road || "",
                            postcode: data.address?.postcode || "",
                            display_name: data.display_name || "",
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        };
                        // --- AKHIR PERBAIKAN ---

                        resolve(locationCache);
                } catch (error) {
                    console.error("❌ Gagal fetch Nominatim:", error);
                    resolve({ latitude, longitude }); // Resolve dengan data parsial jika API gagal
                    }
                },
                () => resolve({}), // User tolak izin
            { timeout: 10000 }
            );
        });
    },

    /**
     * Mengambil data usia dan gender dari Google People API.
     */
    async fetchGoogleProfile(accessToken) {
        if (!accessToken) return {};
        try {
            const response = await fetch("https://people.googleapis.com/v1/people/me?personFields=genders,birthdays", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) return {};

            const profile = await response.json();
            const gender = profile.genders?.[0]?.value || "Tidak Diketahui";
            const birthday = profile.birthdays?.[0]?.date || null;
            let minAge = null;
            if (birthday?.year) {
                minAge = new Date().getFullYear() - birthday.year;
            }
            return { gender, minAge };
        } catch (err) {
            console.error("Error fetch data Google Profile:", err);
            return {};
        }
    }
};