const VIDEO_API_URL = "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec";

function initPage() {
    const videoSelect = document.getElementById('videoSelect');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);

    const language = urlParams.get('bahasa');
    const languageDisplay = urlParams.get('display'); 

    if (!language) {
        videoTitle.textContent = "Parameter ?bahasa= tidak ditemukan.";
        return;
    }

    // ✅ Gunakan 'languageDisplay' jika ada, jika tidak gunakan 'language' sebagai cadangan
    const pageTitle = languageDisplay ? languageDisplay : language.charAt(0).toUpperCase() + language.slice(1);
    
    // Perbarui judul tab
    document.title = `Cerita Bahasa ${pageTitle}`;

    // ▼▼▼ TAMBAHKAN BLOK KODE INI ▼▼▼
    // Perbarui Meta Tag Open Graph (OG) untuk media sosial
    const ogTitle = document.getElementById('og-title');
    const ogDesc = document.getElementById('og-description');
    const ogUrl = document.getElementById('og-url');

    if (ogTitle) {
        ogTitle.setAttribute('content', `Cerita Bahasa ${pageTitle}`);
    }
    if (ogDesc) {
        ogDesc.setAttribute('content', `Dengarkan dan tonton cerita menarik dalam Bahasa ${pageTitle}.`);
    }
    if (ogUrl) {
        ogUrl.setAttribute('content', window.location.href);
    }
    // ▲▲▲ BLOK KODE DI ATAS ▲▲▲

    const langPlaceholder = document.getElementById('language-name-placeholder');
    // ... (sisa kode tidak perlu diubah)
    // ------------------------------------

    fetch(`${VIDEO_API_URL}?lang=${encodeURIComponent(language)}`)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                videoTitle.textContent = "Daftar video kosong.";
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
                    videoPlayer.src = '';
                    videoTitle.textContent = "Silakan pilih video.";
                    window.currentVideoId = null;
                    return;
                }

                const selected = data.find(v => v.videoId === videoId);
                // ✅ Format URL video sudah diperbaiki
                videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
                videoTitle.textContent = selected ? selected.title : "Video";

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