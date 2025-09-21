// File: js/load_data/user_data_service.js

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
let locationCache = null;

export const user_data_service = {
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
                    const MAPTILER_API_KEY = "q2Tpg24C584V753macDS";
                    const url = `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_API_KEY}`;
                    
                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`MapTiler API responded with status: ${response.status}`);
                        }
                        const data = await response.json();
                        const features = data.features || [];
                        
                        // Objek penampung sementara untuk semua data mentah dari MapTiler
                        const rawParts = {};

                        if (features.length > 0) {
                            const firstResult = features[0];
                            rawParts.display_name = firstResult.place_name || ""; // Mapping untuk display_name
                            
                            firstResult.context.forEach(item => {
                                const id = item.id.split('.')[0];
                                rawParts[id] = item.text;
                                if (id === 'country') {
                                    rawParts['country_code'] = item.short_code;
                                }
                            });

                            // Jika ada 'street' atau 'address' di level atas, prioritaskan itu
                            if (firstResult.place_type.includes('street') || firstResult.place_type.includes('address')) {
                                rawParts.street = firstResult.text;
                            }
                        }

                        // Objek final sesuai struktur Anda (berbasis Nominatim)
                        const finalAddress = {
                            latitude: latitude,
                            longitude: longitude,
                            continent: rawParts.continental_marine || "", // Akan sering kosong
                            country: rawParts.country || "",
                            country_code: rawParts.country_code || "",
                            state: rawParts.region || "",
                            county: rawParts.district || "",
                            city: rawParts.subregion || "", // Sesuai tabel Anda: subregion -> city
                            municipality: rawParts.locality || "",
                            town: "", // MapTiler jarang memberikan 'town' secara eksplisit
                            village: rawParts.place || "", // Sesuai tabel Anda: place -> village
                            suburb: rawParts.neighbourhood || rawParts.locality || "",
                            road: rawParts.street || "",
                            postcode: rawParts.postcode || "",
                            display_name: rawParts.display_name || "",
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        };

                        locationCache = finalAddress;
                        resolve(locationCache);

                    } catch (error) {
                        console.error("❌ Gagal fetch atau parse MapTiler:", error);
                        resolve({ latitude, longitude }); 
                    }
                },
                () => resolve({}),
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
    const url = "https://people.googleapis.com/v1/people/me?personFields=genders,birthdays,ageRanges";
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }});

    const rawText = await response.text();
    console.log("People API raw response:", response.status, rawText);

    if (!response.ok) {
      // debug friendly
      console.warn("⚠️ People API tidak OK:", response.status, rawText);
      return {};
    }
    const profile = JSON.parse(rawText);
    console.log("People API parsed profile:", profile);

    const gender = profile.genders?.[0]?.value || "Tidak Diketahui";

    // birthday handling: prioritas cari yang ada year, tapi tetap simpan dd-mm jika year kosong
    let birthday = "";
    let minAge = null;

    if (profile.birthdays && profile.birthdays.length > 0) {
      const birthdayObj = profile.birthdays.find(b => b.date?.year) || profile.birthdays[0];
      const d = birthdayObj.date || {};
      
      // Cek jika data tanggal lengkap (hari, bulan, tahun)
      if (d.year && d.month && d.day) {
        // Buat string tanggal dengan format YYYY-MM-DD yang standar
        const year = d.year;
        const month = String(d.month).padStart(2, '0'); // Pastikan bulan 2 digit (01, 02, ..., 12)
        const day = String(d.day).padStart(2, '0');   // Pastikan hari 2 digit (01, 02, ..., 31)

        // Format baru: YYYY-MM-DD
        birthday = `${year}-${month}-${day}`;
        minAge = new Date().getFullYear() - d.year;
      }
    }

    // fallback: gunakan ageRanges jika available untuk menebak minAge
    if (!minAge && profile.ageRanges && profile.ageRanges.length > 0) {
      const ar = profile.ageRanges[0].ageRange || profile.ageRanges[0].value || "";
      // mapping umum (tambah sesuai kebutuhan)
      const map = {
        "LESS_THAN_TWENTY_ONE": 20,
        "TWENTY_ONE_OR_OLDER": 21,
        "AGE_RANGE_18_24": 18,
        "AGE_RANGE_25_34": 25,
        "AGE_RANGE_35_44": 35,
        "AGE_RANGE_45_54": 45,
        "AGE_RANGE_55_64": 55,
        "AGE_RANGE_65_PLUS": 65
      };
      if (map[ar]) minAge = map[ar];
    }

    return { gender, birthday, minAge };
  } catch (err) {
    console.error("❌ Gagal fetch Google Profile (dengan akses token):", err);
    return {};
  }
}
};