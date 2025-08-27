// ======================================================================
// File: js/ui/page_video.js
// Deskripsi: Menangani semua logika UI di halaman video, termasuk
//            dropdown, player, komentar, dan tombol share.
// Asal Kode: video.js, comments.js, bahasa.html (inline scripts)
// ======================================================================

// --- Variabel Global untuk Halaman Video ---
let currentVideoId = null;
let currentLanguagePage = null;
let ytPlayer;

/**
 * Fungsi utama untuk menginisialisasi seluruh halaman video.
 */
function initializeVideoPage() {
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);
    const language = urlParams.get('bahasa');
    
    if (!language) {
        videoTitle.textContent = "Parameter ?bahasa= tidak ditemukan.";
        return;
    }
    
    currentLanguagePage = language;

    // Memanggil service untuk mengambil data video
    api_service.fetchVideos(language)
        .then(responseData => {
            const videos = responseData.videos;
            const pageTitle = responseData.displayName || language;

            // Update judul halaman dan meta tags
            document.title = `Cerita Bahasa ${pageTitle}`;
            document.getElementById('language-name-placeholder').textContent = pageTitle;
            // (Logika update meta tag lain bisa ditambahkan di sini)

            if (!videos || videos.length === 0) {
                videoTitle.textContent = "Segera hadir! Belum ada video untuk bahasa ini.";
                return;
            }

            populateVideoDropdown(videos);
            setupShareButtons(); // Setup tombol share setelah judul halaman siap
        })
        .catch(err => {
            videoTitle.textContent = "Gagal memuat data video.";
        });
    
    initializeCommentSection(); // Inisialisasi form komentar
    loadYouTubeIframeAPI(); // Memuat API Player YouTube
}

/**
 * Mengisi dropdown pilihan video dan mengatur event listener-nya.
 */
function populateVideoDropdown(videos) {
    const videoSelect = document.getElementById('videoSelect');
    videoSelect.innerHTML = '<option value="">-- Pilih Video --</option>';
    
    videos.forEach(video => {
        const option = document.createElement('option');
        option.value = video.videoId;
        option.textContent = video.title;
        videoSelect.appendChild(option);
    });

    videoSelect.onchange = function() {
        const videoId = this.value;
        if (!videoId) return;

        const selectedVideo = videos.find(v => v.videoId === videoId);
        currentVideoId = videoId;
        document.getElementById('videoTitle').textContent = selectedVideo.title;
        
        EventTracker.videoPage.chooseVideo(selectedVideo.title, videoId);

        loadVideoInPlayer(videoId); 
        renderCommentsForVideo(videoId);
    };
}


// --- Bagian Logika Player (dari bahasa.html & analytics.js) ---

/** Memuat script YouTube IFrame API secara dinamis */
function loadYouTubeIframeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

/** Fungsi ini dipanggil otomatis oleh API YouTube setelah script-nya dimuat */
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player-placeholder', {
        height: '100%',
        width: '100%',
        playerVars: { 'autoplay': 0, 'controls': 1 },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function loadVideoInPlayer(videoId) {
    if (ytPlayer && typeof ytPlayer.cueVideoById === 'function') {
        ytPlayer.cueVideoById(videoId);
    }
}

function onPlayerStateChange(event) {
    const state = event.data;
    const percentage = Math.floor((ytPlayer.getCurrentTime() / ytPlayer.getDuration()) * 100);

    if (state === YT.PlayerState.PLAYING) {
        EventTracker.videoPage.play(percentage);
    } else if (state === YT.PlayerState.PAUSED) {
        EventTracker.videoPage.pause(percentage);
    } else if (state === YT.PlayerState.ENDED) {
        EventTracker.videoPage.ended();
    }
}


// --- Bagian Logika Komentar (dari comments.js) ---

function initializeCommentSection() {
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    // Event listener untuk edit, hapus, like akan ditangani di renderCommentsForVideo
}

async function handleCommentSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text || !currentVideoId) return;

    const user = auth.currentUser;
    const videoTitle = document.getElementById('videoTitle').textContent;
    
    const commentData = {
        videoId: currentVideoId,
        videoTitle: videoTitle,
        languagePage: currentLanguagePage,
        userId: user.uid,
        userName: user.displayName,
        userPhotoUrl: user.photoURL,
        commentText: text,
    };

    try {
        const result = await api_service.postComment(commentData);
        if (result.status === "success") {
            input.value = '';
            EventTracker.videoPage.comment.submit(videoTitle, text);
            renderCommentsForVideo(currentVideoId); // Muat ulang komentar
        } else {
            alert('Gagal mengirim komentar.');
        }
    } catch (error) {
        alert('Terjadi kesalahan saat mengirim komentar.');
    }
}

function renderCommentsForVideo(videoId) {
    const section = document.getElementById('comment-section');
    section.innerHTML = '<div class="spinner-border" role="status"></div>';
    
    api_service.fetchComments(videoId).then(comments => {
        section.innerHTML = '';
        if (!comments || comments.length === 0) {
            section.innerHTML = '<p class="text-muted text-center">Jadilah yang pertama berkomentar!</p>';
            return;
        }
        comments.forEach(comment => {
            // Logika untuk membuat elemen HTML komentar ada di sini
            // ...
        });
    });
}


// --- Bagian Tombol Share (dari bahasa.html) ---

function setupShareButtons() {
    const pageUrl = window.location.href;
    const shareText = "Ayo lihat cerita menarik dalam bahasa daerah ini: " + document.title;
    
    const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + pageUrl)}`;
    const facebookLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;

    const shareWaBtn = document.getElementById('share-wa');
    const shareFbBtn = document.getElementById('share-fb');

    if (shareWaBtn) {
        shareWaBtn.href = whatsappLink;
        shareWaBtn.onclick = () => logShare('whatsapp');
    }
    if (shareFbBtn) {
        shareFbBtn.href = facebookLink;
        shareFbBtn.onclick = () => logShare('facebook');
    }
}

function logShare(platform) {
    const videoTitle = document.getElementById("videoTitle")?.textContent || "Tanpa Judul";
    // Asumsi: EventTracker akan punya fungsi untuk ini
    // EventTracker.social.share(platform, videoTitle);
    logUserBehavior("share_button", platform, videoTitle); // Menggunakan logUserBehavior yang ada
}