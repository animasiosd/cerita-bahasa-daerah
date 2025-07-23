// File: js/video.js

const VIDEO_API_URL = "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec";

// Fungsi ini akan dipanggil dari main.js setelah navbar & komentar siap
function initPage() {
    const videoSelect = document.getElementById('videoSelect');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);

    const language = urlParams.get('bahasa'); // ✅ Sesuai parameter URL
    if (!language) {
        videoTitle.textContent = "Parameter ?bahasa= tidak ditemukan.";
        return;
    }

    // Perintah ini akan mengganti judul di tab browser.
    document.title = `Cerita Bahasa ${language.charAt(0).toUpperCase() + language.slice(1)}`;
    // ----------------------------------------------------

    fetch(`${VIDEO_API_URL}?lang=${encodeURIComponent(language)}`)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                videoTitle.textContent = "Daftar video kosong.";
                return;
            }

            // Simpan info global untuk komentar.js
            window.currentLanguagePage = language;
            window.currentVideoId = null;

            videoTitle.textContent = "Silakan pilih video.";
            videoSelect.innerHTML = '';

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
                    window.currentVideoId = null;
                    return;
                }

                const selected = data.find(v => v.videoId === videoId);
                videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
                videoTitle.textContent = selected ? selected.title : "Video";

                // Simpan untuk komentar
                window.currentVideoId = videoId;

                if (typeof loadComments === 'function') {
                    loadComments(videoId);
                }
            });
        })
        .catch(err => {
            console.error("❌ Gagal memuat video:", err);
            videoTitle.textContent = "Gagal memuat video.";
        });
}
