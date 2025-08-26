// File: js/video.js

const VIDEO_API_URL = "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec";

// ✅ Variabel global player (terhubung dengan YouTube IFrame API)
window.currentLanguagePage = null;
window.currentVideoId = null;

function initPage() {
    const videoSelect = document.getElementById('videoSelect');
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);

// GANTI DENGAN BLOK KODE BARU INI
    const language = urlParams.get('bahasa');
    if (!language) {
        videoTitle.textContent = "Parameter ?bahasa= tidak ditemukan.";
        return;
    }

    // Ambil data video dari Google Apps Script
    fetch(`${VIDEO_API_URL}?action=getVideos&lang=${encodeURIComponent(language)}`)
        .then(res => res.json())
        .then(responseData => {
            // BARU: Gunakan displayName dari API untuk judul halaman
            const pageTitle = responseData.displayName || "Daerah"; // Fallback
            document.title = `Cerita Bahasa ${pageTitle}`;

            // BARU: Update meta tags menggunakan displayName yang akurat
            const ogTitle = document.getElementById('og-title');
            const ogDesc = document.getElementById('og-description');
            const ogUrl = document.getElementById('og-url');
            if (ogTitle) ogTitle.setAttribute('content', `Cerita Bahasa ${pageTitle}`);
            if (ogDesc) ogDesc.setAttribute('content', `Dengarkan dan tonton cerita menarik dalam Bahasa ${pageTitle}.`);
            if (ogUrl) ogUrl.setAttribute('content', window.location.href);
            const langPlaceholder = document.getElementById('language-name-placeholder');
            if (langPlaceholder) langPlaceholder.textContent = pageTitle;

            // BARU: Ambil daftar video dari properti 'videos'
            const videos = responseData.videos;

            if (!Array.isArray(videos) || videos.length === 0) {
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

            // BARU: Gunakan variabel 'videos' untuk perulangan
            videos.forEach(video => {
                const option = document.createElement('option');
                option.value = video.videoId;
                option.textContent = video.title;
                videoSelect.appendChild(option);
            });

            videoSelect.onchange = function () {
                const videoId = this.value;
                if (!videoId) {
                    videoTitle.textContent = "Silakan pilih video.";
                    window.currentVideoId = null;
                    return;
                }
                
                if (videoId === window.currentVideoId) {
                    return;
                }
                
                // BARU: Gunakan variabel 'videos' untuk mencari video yang dipilih
                const selected = videos.find(v => v.videoId === videoId);
                videoTitle.textContent = selected ? selected.title : "Video";
                window.currentVideoId = videoId;
                
                if (typeof logUserBehavior === "function") {
                    logUserBehavior("choose_video", selected?.title || "Tanpa Judul", videoId);
                }
                
                if (typeof loadVideoPlayer === "function") {
                    loadVideoPlayer(videoId);
                }
                
                if (typeof loadComments === "function") {
                    loadComments(videoId);
                }
            };
            
        })
        .catch(err => {
            console.error("❌ Gagal memuat data bahasa:", err);
            videoTitle.textContent = "Gagal memuat data bahasa.";
        });
}