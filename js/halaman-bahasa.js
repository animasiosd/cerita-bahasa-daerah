// File: js/halaman-bahasa.js

const API_URL = "https://script.google.com/macros/s/AKfycbwCT57fhlebRz7nKvvtmPxjKrR54-mQU3syiuRqspHX9nRubS-gg7RYkHybOlIwxdhyTg/exec";

document.addEventListener("DOMContentLoaded", function () {
    const videoSelect = document.getElementById('videoSelect');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);
    const language = urlParams.get('lang');  // ?lang=kaili, dll

    if (!language) {
        videoTitle.textContent = "Parameter ?lang= tidak ditemukan.";
        return;
    }

    fetch(`${API_URL}?lang=${encodeURIComponent(language)}`)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                videoTitle.textContent = "Daftar video kosong.";
                return;
            }

            videoTitle.textContent = "Silakan pilih video.";

            videoSelect.innerHTML = ''; // bersihkan dropdown jika ada isi sebelumnya

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
            });

        })
        .catch(err => {
            console.error(err);
            videoTitle.textContent = "Gagal memuat video.";
        });
});
