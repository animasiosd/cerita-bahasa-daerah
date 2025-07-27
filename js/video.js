// File: js/video.js

const VIDEO_API_URL = "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec";

// ✅ Variabel global player (terhubung dengan YouTube IFrame API)
window.currentLanguagePage = null;
window.currentVideoId = null;

function initPage() {
    const videoSelect = document.getElementById('videoSelect');
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);

    const language = urlParams.get('bahasa');
    const languageDisplay = urlParams.get('display');

    if (!language) {
        videoTitle.textContent = "Parameter ?bahasa= tidak ditemukan.";
        return;
    }

    const pageTitle = languageDisplay ? languageDisplay : language.charAt(0).toUpperCase() + language.slice(1);

    // Ubah judul tab
    document.title = `Cerita Bahasa ${pageTitle}`;

    // OG meta tag untuk share
    const ogTitle = document.getElementById('og-title');
    const ogDesc = document.getElementById('og-description');
    const ogUrl = document.getElementById('og-url');

    if (ogTitle) ogTitle.setAttribute('content', `Cerita Bahasa ${pageTitle}`);
    if (ogDesc) ogDesc.setAttribute('content', `Dengarkan dan tonton cerita menarik dalam Bahasa ${pageTitle}.`);
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    // Update placeholder pertanyaan diskusi
    const langPlaceholder = document.getElementById('language-name-placeholder');
    if (langPlaceholder) langPlaceholder.textContent = pageTitle;

    // Ambil data video dari Google Apps Script
    fetch(`${VIDEO_API_URL}?lang=${encodeURIComponent(language)}`)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                videoTitle.textContent = "Coming soon! Belum ada video untuk bahasa ini.";
                return;
            }

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
                    videoTitle.textContent = "Silakan pilih video.";
                    window.currentVideoId = null;

                    // ⛔ Jangan hapus player, cukup kosongkan jika perlu
                    return;
                }

                const selected = data.find(v => v.videoId === videoId);
                videoTitle.textContent = selected ? selected.title : "Video";

                window.currentVideoId = videoId;

                // ✅ Gunakan fungsi dari halaman: loadVideoPlayer()
                if (typeof loadVideoPlayer === "function") {
                    loadVideoPlayer(videoId);
                }

                // ✅ Muat komentar jika fungsi tersedia
                if (typeof loadComments === "function") {
                    loadComments(videoId);
                }
            });
        })
        .catch(err => {
            console.error("❌ Gagal memuat video:", err);
            videoTitle.textContent = "Gagal memuat video.";
        });
}

// ✅ Jalankan initPage saat halaman dimuat
document.addEventListener("DOMContentLoaded", initPage);
