// ======================================================================
// File: js/ui/page_video.js
// Deskripsi: Menangani semua logika UI di halaman video, termasuk
//            dropdown video, player, dan manajemen komentar.
// ======================================================================

let currentVideoId = null;
let currentLanguagePage = null;

/**
 * Fungsi utama untuk menginisialisasi halaman video.
 */
function initializeVideoPage() {
    const videoSelect = document.getElementById('videoSelect');
    const videoTitle = document.getElementById('videoTitle');
    const urlParams = new URLSearchParams(window.location.search);
    const language = urlParams.get('bahasa');

    if (!language) {
        videoTitle.textContent = "Parameter ?bahasa= tidak ditemukan.";
        return;
    }
    
    currentLanguagePage = language;

    // ASUMSI: `api_service.fetchVideos(language)` ada di 'load_data/api_service.js'
    api_service.fetchVideos(language)
        .then(responseData => {
            const videos = responseData.videos;
            document.title = `Cerita Bahasa ${responseData.displayName}`;
            // ... (logika update meta tag lainnya) ...

            if (!videos || videos.length === 0) {
                videoTitle.textContent = "Coming soon! Belum ada video untuk bahasa ini.";
                return;
            }

            populateVideoDropdown(videos);
        })
        .catch(err => {
            console.error("Gagal memuat data video:", err);
            videoTitle.textContent = "Gagal memuat data video.";
        });
    
    initializeCommentSection();
}

/**
 * Mengisi dropdown pilihan video dengan data dari API.
 * @param {Array} videos - Array objek video.
 */
function populateVideoDropdown(videos) {
    const videoSelect = document.getElementById('videoSelect');
    videoSelect.innerHTML = '<option value="">-- Pilih Video --</option>'; // Reset
    
    videos.forEach(video => {
        const option = document.createElement('option');
        option.value = video.videoId;
        option.textContent = video.title;
        videoSelect.appendChild(option);
    });

    videoSelect.onchange = function() {
        const videoId = this.value;
        const selectedVideo = videos.find(v => v.videoId === videoId);

        if (!videoId) {
            // Handle deselect
            return;
        }

        currentVideoId = videoId;
        document.getElementById('videoTitle').textContent = selectedVideo.title;
        EventTracker.videoPage.chooseVideo(selectedVideo.title, videoId);

        // ASUMSI: Fungsi `loadVideoPlayer` akan ada di file terpisah yg menangani player
        loadVideoPlayer(videoId); 
        renderCommentsForVideo(videoId);
    };
}


// --- Bagian Komentar ---

/**
 * Menginisialisasi event listener untuk form dan area komentar.
 */
function initializeCommentSection() {
    const commentForm = document.getElementById('comment-form');
    const commentSection = document.getElementById('comment-section');

    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    if (commentSection) {
        commentSection.addEventListener('click', handleCommentInteraction);
    }
}

/**
 * Memuat dan merender komentar untuk videoId tertentu.
 * @param {string} videoId 
 */
function renderCommentsForVideo(videoId) {
    const section = document.getElementById('comment-section');
    section.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Memuat...</span></div>';
    
    // ASUMSI: `api_service.fetchComments(videoId)` ada di 'load_data/api_service.js'
    api_service.fetchComments(videoId)
        .then(comments => {
            section.innerHTML = '';
            if (!comments || comments.length === 0) {
                section.innerHTML = '<p>Belum ada komentar.</p>';
                return;
            }
            comments.forEach(comment => {
                const commentEl = createCommentElement(comment);
                section.appendChild(commentEl);
            });
        })
        .catch(err => {
            section.innerHTML = '<p class="text-danger">Gagal memuat komentar.</p>';
        });
}

// ... (Fungsi-fungsi lain seperti handleCommentSubmit, createCommentElement, handleCommentInteraction, dll.,
// dipindahkan dari comments.js ke sini, dengan logika fetch dipisahkan ke service) ...