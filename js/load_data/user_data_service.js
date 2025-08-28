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
                return resolve({}); // Return objek kosong jika tidak didukung
            }
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`${NOMINATIM_URL}?lat=${latitude}&lon=${longitude}&format=json`);
                        const data = await response.json();
                        locationCache = {
                            latitude,
                            longitude,
                            country: data.address?.country || "",
                            display_name: data.display_name || "",
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            // ... (sisa field lokasi) ...
                        };
                        resolve(locationCache);
                    } catch (error) {
                        resolve({ latitude, longitude }); // Resolve dengan data parsial jika API gagal
                    }
                },
                () => resolve({}), // Resolve objek kosong jika user menolak
                { timeout: 10000 }
            );
        });
    },

    /**
     * Mengambil data usia dan gender dari Google People API.
     * Asal Kode: auth.js (dipindahkan dari ui/page_auth.js)
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