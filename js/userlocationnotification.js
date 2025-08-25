// File: js/userLocationNotification.js
function requestUserGeolocation() {
    if (!navigator.geolocation) {
        // Jika browser tidak mendukung geolocation → arahkan ke halaman tutorial
        window.location.href = "/beta/locationtutorial.html";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        // ✅ Jika user mengizinkan lokasi
        function (position) {
            console.log("Lokasi diizinkan ✅");
            // Lanjutkan ke halaman utama
        },

        // ❌ Jika user menolak izin lokasi
        function (error) {
            if (error.code === error.PERMISSION_DENIED) {
                console.log("Lokasi ditolak ❌, menampilkan tutorial...");
                // Arahkan ke halaman tutorial izinkan lokasi
                window.location.href = "/beta/locationtutorial.html";
            } else {
                console.log("Terjadi kesalahan lain:", error.message);
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Jalankan otomatis saat user login berhasil
document.addEventListener("DOMContentLoaded", function () {
    requestUserGeolocation();
});
