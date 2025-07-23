// File: js/video.js

const API_URL = "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec";

document.addEventListener("DOMContentLoaded", function () {
    const videoSelect = document.getElementById('videoSelect');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);

    const language = urlParams.get('bahasa');  // ✅ Sesuai parameter URL Anda

    if (!language) {
        videoTitle.textContent = "Parameter ?bahasa= tidak ditemukan.";
        return;
    }

    fetch(`${API_URL}?lang=${encodeURIComponent(language)}`)  // ✅ Ambil berdasarkan nama bahasa
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                videoTitle.textContent = "Daftar video kosong.";
                return;
            }

            videoTitle.textContent = "Silakan pilih video.";

            videoSelect.innerHTML = '';  // Bersihkan dropdown

            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "-- Pilih Video --";
            videoSelect.appendChild(defaultOption);

            data.forEach(video => {
                const option = document.createElement('option');
                option.value = video.videoId;
                option.textContent = video.title;
                videoSelect.appendChild(option);
            });

            videoSelect.addEventListener('change', function () {
                const videoId = this.value;
                if (!videoId) {
                    videoPlayer.src = '';
                    videoTitle.textContent = "Silakan pilih video.";
                    return;
                }

                const selected = data.find(v => v.videoId === videoId);

                videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
                videoTitle.textContent = selected ? selected.title : "Video";

                // Tambahan untuk sistem komentar
                if (typeof currentVideoId !== 'undefined') {
                    currentVideoId = videoId;    // ✅ Kirim video ID ke sistem komentar
                }
                if (typeof currentLanguagePage !== 'undefined') {
                    currentLanguagePage = language;   // ✅ Kirim bahasa ke sistem komentar
                }

                // Jika ada fungsi loadComments, otomatis jalankan
                if (typeof loadComments === 'function') {
                    loadComments(videoId);   // ✅ Muat komentar untuk video ini
                }
            });

        })
        .catch(err => {
            console.error(err);
            videoTitle.textContent = "Gagal memuat video.";
        });
});
