// ======================================================================
// File: js/ui/page_video.js (VERSI FINAL TERINTEGRASI)
// Deskripsi: Menangani SEMUA logika UI di halaman video, termasuk
//            player, dropdown, share, dan semua fitur komentar.
// ======================================================================
import { auth } from "./page_auth.js";
import { api_service } from "../load_data/api_service.js";
import { EventTracker } from "../events.js";
import { logUserBehavior, trackVideoInteraction  } from "../send_data/analytics_service.js";

export { initializeVideoPage };

let ytPlayer = null;

/**
 * Fungsi utama untuk menginisialisasi seluruh halaman video.
 */
function initializeVideoPage() {
    const videoTitleEl = document.getElementById('videoTitle');
    const videoSelect = document.getElementById('videoSelect');
    const urlParams = new URLSearchParams(window.location.search);
    const language = urlParams.get('bahasa');

    // Inisialisasi variabel global di window object
    window.currentVideoId = null;
    window.currentLanguagePage = null;

    if (!language) {
        document.title = "Bahasa Tidak Ditemukan";
        videoTitleEl.textContent = "Bahasa tidak ditemukan. Silahkan pilih bahasa terlebih dahulu.";
        return;
    }

    const formattedLanguageName = formatLanguageName(language);
    document.title = `Cerita Bahasa ${formattedLanguageName}`;
    document.getElementById('language-name-placeholder').textContent = formattedLanguageName;
    videoSelect.disabled = true;
   
    videoTitleEl.innerHTML = `
        <div class="d-flex justify-content-center align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>Memuat judul video. Tunggu sebentar...</span>
        </div>`;
    
    api_service.fetchVideos(language)
    .then(responseData => {
        const videos = responseData.videos;
        const pageTitle = responseData.displayName || formattedLanguageName;

        // --- SOLUSI #1: Atur nama bahasa di window object ---
        window.currentLanguagePage = pageTitle;

        document.title = `Cerita Bahasa ${pageTitle}`;
        document.getElementById('language-name-placeholder').textContent = pageTitle;
            
        if (!videos || videos.length === 0) {
            videoTitleEl.textContent = "Segera hadir! Belum ada video untuk bahasa ini.";
            document.getElementById('page-loader').classList.add('hidden');
            document.getElementById('mainContent').style.display = 'block';
            return;
        }

        populateVideoDropdown(videos);
        videoTitleEl.textContent = "Silakan pilih judul video";
        videoSelect.disabled = false;
        setupShareButtons();

        document.getElementById('page-loader').classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';

        // --- SOLUSI #2: Kirim event 'video_page' di sini, SETELAH data siap TAPI SEBELUM video dipilih ---
        // Video ID sengaja dikosongkan karena belum ada yang dipilih.
        // trackVideoInteraction('video_page_loaded');

    })
    .catch(err => {
        videoTitleEl.textContent = "❌ Gagal memuat data video.";
        console.error(err);
        document.getElementById('page-loader').classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
    });
    
    initializeCommentSection();
    loadYouTubeIframeAPI();
}

/**
 * FUNGSI BARU: Mengubah slug URL (misal: toli-toli) menjadi judul (Toli Toli).
 * @param {string} slug - Teks dari URL.
 * @returns {string}
 */
function formatLanguageName(slug) {
    if (!slug) return '';
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Mengisi dropdown pilihan video.
 */
function populateVideoDropdown(videos) {
    const videoSelect = document.getElementById('videoSelect');
    const playerContainer = document.getElementById('playerContainer');
    const commentInput = document.getElementById('comment-input');
    const commentSubmitBtn = document.querySelector('#comment-form button[type="submit"]');

    videoSelect.innerHTML = '<option value="">-- Pilih Video --</option>';
    videos.forEach(video => {
        const option = document.createElement('option');
        option.value = video.videoId;
        option.textContent = video.title;
        videoSelect.appendChild(option);
    });

    videoSelect.onchange = function() {
        const videoId = this.value;
        
        if (!videoId) {
            playerContainer.classList.add('d-none');
            commentInput.disabled = true;
            commentSubmitBtn.disabled = true;
            commentInput.placeholder = "Pilih video terlebih dahulu untuk berkomentar...";
            document.getElementById('videoTitle').textContent = "✅ Silakan pilih judul video";
            document.getElementById('comment-section').innerHTML = '';
            
            // Atur ulang video ID global
            window.currentVideoId = null;
            return;
        }

        const selectedVideo = videos.find(v => v.videoId === videoId);
        
        // --- SOLUSI #3: Atur video ID di window object ---
        window.currentVideoId = videoId;
        
        document.getElementById('videoTitle').textContent = selectedVideo.title;
        playerContainer.classList.remove('d-none');
        
        commentInput.disabled = false;
        commentSubmitBtn.disabled = false;
        commentInput.placeholder = `Tulis komentar untuk video "${selectedVideo.title}"...`;
        
        // Event ini sudah benar, tidak perlu diubah
        EventTracker.videoPage.chooseVideo(selectedVideo.title, videoId);
        
        loadVideoInPlayer(videoId); 
        renderCommentsForVideo(videoId);
    };
}

// --- Bagian Logika Player YouTube ---
let lastPlayerState = null; // ✅ Tambahan: simpan state terakhir

function loadYouTubeIframeAPI() {
    if (window.YT && window.YT.Player) {
        onYouTubeIframeAPIReady();
    } else {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

window.onYouTubeIframeAPIReady = function() {
    if (ytPlayer) return; // ✅ Player dibuat hanya sekali
    ytPlayer = new YT.Player('yt-player-placeholder', {
        height: '100%',
        width: '100%',
        playerVars: { 'autoplay': 0, 'controls': 1 },
        events: { 'onStateChange': onPlayerStateChange }
    });
}

function loadVideoInPlayer(videoId) {
    if (ytPlayer && typeof ytPlayer.cueVideoById === 'function') {
        ytPlayer.cueVideoById(videoId);
    } else {
        console.error("YouTube player is not ready or cueVideoById function is not available.");
    }
}

// --- Filter Event Duplikat --- //
let lastEventKey = null;

function shouldSendEvent(videoId, action, percentage) {
    const sessionId = window.sessionId || "no-session";
    const key = `${sessionId}|${videoId}|${action}|${percentage}`;
    if (lastEventKey === key) {
        console.log("⏩ Event duplikat, dilewati:", key);
        return false;
    }
    lastEventKey = key;
    return true;
}

// --- BAGIAN BARU: Filter Event karena Tab Switching ---
let isTabSwitching = false;

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" || document.visibilityState === "visible") {
        isTabSwitching = true;
        setTimeout(() => { isTabSwitching = false; }, 800); // reset otomatis
    }
});

function onPlayerStateChange(event) {
    const state = event.data;

    // ✅ Abaikan event otomatis karena tab switching
    if (isTabSwitching) {
        console.log("⏩ Abaikan event karena tab switching:", state);
        return;
    }

    // ✅ Cegah duplikat state (buffering → play → play)
    if (state === lastPlayerState) return;
    lastPlayerState = state;

    try {
        const videoId = window.currentVideoId || "unknown";
        const percentage = Math.floor((ytPlayer.getCurrentTime() / ytPlayer.getDuration()) * 100);

        if (state === YT.PlayerState.PLAYING) {
            if (shouldSendEvent(videoId, "play", percentage)) {
                EventTracker.videoPage.play(percentage);
            }
        } else if (state === YT.PlayerState.PAUSED) {
            if (shouldSendEvent(videoId, "pause", percentage)) {
                EventTracker.videoPage.pause(percentage);
            }
        } else if (state === YT.PlayerState.ENDED) {
            if (shouldSendEvent(videoId, "ended", 100)) {
                EventTracker.videoPage.ended();
            }
        }
    } catch (err) {
        console.warn("Player state change error:", err);
    }
}

// --- BAGIAN BARU: Semua Logika Komentar Terintegrasi ---

/**
 * Menyiapkan semua event listener untuk fitur komentar.
 */
function initializeCommentSection() {
    const commentForm = document.getElementById('comment-form');
    const commentSection = document.getElementById('comment-section');

    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }

    if (commentSection) {
        commentSection.addEventListener('click', function(event) {
            const target = event.target;
            const commentCard = target.closest('.card[data-comment-id]');
            if (!commentCard) return;
            const commentId = commentCard.dataset.commentId;

            if (target.matches('.like-btn')) handleLikeClick(target, commentId);
            if (target.matches('.edit-btn')) handleEditComment(commentId, commentCard);
            if (target.matches('.delete-btn')) handleDeleteComment(commentId, commentCard);
        });
    }
}

/**
 * Mengambil dan menampilkan semua komentar untuk sebuah video.
 */
function renderCommentsForVideo(videoId) {
    const section = document.getElementById('comment-section');
    const commentInput = document.getElementById('comment-input');
    const commentSubmitBtn = document.querySelector('#comment-form button[type="submit"]');

    // --- PERUBAHAN 1: Nonaktifkan form komentar saat loading dimulai ---
    commentInput.disabled = true;
    commentSubmitBtn.disabled = true;
    
    // Tampilkan status loading
    section.innerHTML = `
        <div class="d-flex justify-content-center align-items-center text-muted py-5">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>Memuat komentar. Tunggu sebentar...</span>
        </div>
    `;

    api_service.fetchComments(videoId)
    .then(comments => {
        section.innerHTML = '';
        const user = auth.currentUser;

        if (!comments || comments.length === 0) {
            section.innerHTML = '<p class="text-muted text-center">Jadilah yang pertama berkomentar!</p>';
            return;
        }

        comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        comments.forEach(comment => {
            // ... (Kode untuk menampilkan setiap kartu komentar tetap sama) ...
            const isOwner = user && user.uid === comment.user_id;
            const isLiked = user && comment.likers_user_ids && comment.likers_user_ids.includes(user.uid);
            const photoUrl = comment.user_photo_url || 'assets/favicon-192.png';

            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.setAttribute('data-comment-id', comment.comment_id);
            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex align-items-start">
                        <img src="${photoUrl}" alt="${comment.user_name}" class="rounded-circle me-3" width="40" height="40">
                        <div class="w-100">
                            <h6 class="mb-0">${comment.user_name}</h6>
                            <small class="text-muted">${new Date(comment.timestamp).toLocaleString('id-ID')}</small>
                            <p class="card-text mt-2 comment-text" style="white-space: pre-wrap;">${comment.comments_description}</p>
                            <div class="edit-controls d-none mt-2"></div>
                            <div class="comment-actions mt-2 d-flex align-items-center">
                                <button class="btn btn-sm ${isLiked ? 'btn-primary' : 'btn-light'} like-btn">
                                    ❤️ <span class="likes-count">${comment.likes_count || 0}</span>
                                </button>
                                ${isOwner ? `
                                <button class="btn btn-sm btn-outline-secondary ms-2 edit-btn">Edit</button>
                                <button class="btn btn-sm btn-outline-danger ms-2 delete-btn">Hapus</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
            section.appendChild(card);
        });
    })
    .catch(error => {
        section.innerHTML = '<p class="text-danger text-center">Gagal memuat komentar.</p>';
        console.error("Error saat merender komentar:", error);
    })
    .finally(() => {
        // --- PERUBAHAN 2: Aktifkan kembali form setelah proses selesai (baik berhasil maupun gagal) ---
        // Kita cek apakah masih ada video yang dipilih, agar form tidak aktif jika user keburu memilih "-- Pilih Video --"
        if (currentVideoId) {
            commentInput.disabled = false;
            commentSubmitBtn.disabled = false;
        }
    });
}

/**
 * Menangani pengiriman komentar baru.
 */
async function handleCommentSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('comment-input');
    const submitBtn = document.querySelector('#comment-form button[type="submit"]');
    const text = input.value.trim();
    
    if (!text || !currentVideoId) return;
    const user = auth.currentUser;
    if (!user) return alert("Silakan login terlebih dahulu.");

    // --- PERUBAHAN 1: Nonaktifkan form saat proses dimulai ---
    input.disabled = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Mengirim...
    `;

    try {
        const videoTitle = document.getElementById('videoTitle').textContent;
        const commentData = {
            action: 'add_comment',
            videoId: currentVideoId, videoTitle, languagePage: currentLanguagePage,
            userId: user.uid, userName: user.displayName, userPhotoUrl: user.photoURL, commentText: text,
        };

        const result = await api_service.postComment(commentData);
        if (result.status === "success") {
            input.value = ''; // Kosongkan input setelah berhasil
            EventTracker.videoPage.comment.submit(videoTitle, text);
            renderCommentsForVideo(currentVideoId);
        } else {
            alert(`Gagal mengirim komentar: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error saat mengirim komentar:", error);
        alert('Terjadi kesalahan koneksi saat mengirim komentar.');
    } finally {
        // --- PERUBAHAN 2: Aktifkan kembali form, baik berhasil maupun gagal ---
        input.disabled = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Kirim';
    }
}

/**
 * Menangani klik tombol Suka/Disukai.
 */
function handleLikeClick(button, commentId) {
    const user = auth.currentUser;
    if (!user) return alert("Login untuk menyukai komentar.");

    // Ambil teks komentar dari elemen DOM (tidak berubah)
    const commentCard = button.closest('.card[data-comment-id]');
    const commentText = commentCard ? (commentCard.querySelector('.comment-text')?.textContent || '') : '';

    const wasLiked = button.classList.contains('btn-primary');

    // Kirim commentId dan commentText untuk kedua aksi (like dan unlike)
    EventTracker.videoPage.comment[wasLiked ? 'unlike' : 'like'](commentId, commentText);

    // Optimistic UI update (tidak berubah)
    const likesCountEl = button.querySelector('.likes-count');
    let currentLikes = parseInt(likesCountEl.textContent);
    button.classList.toggle('btn-primary');
    button.classList.toggle('btn-light');
    likesCountEl.textContent = wasLiked ? currentLikes - 1 : currentLikes + 1;

    api_service.postComment({ action: 'toggle_like', commentId, userId: user.uid });
}

/**
 * Menampilkan form untuk mengedit komentar.
 */
function handleEditComment(commentId, commentCard) {
    const commentTextEl = commentCard.querySelector('.comment-text');
    const editControlsEl = commentCard.querySelector('.edit-controls');
    const commentActionsEl = commentCard.querySelector('.comment-actions');
    const originalText = commentTextEl.textContent;

    // Sembunyikan teks komentar asli dan tombol-tombol aksi
    commentTextEl.classList.add('d-none');
    commentActionsEl.classList.add('d-none');
    editControlsEl.classList.remove('d-none');

    // Tampilkan form edit
    editControlsEl.innerHTML = `
        <textarea class="form-control mb-2">${originalText}</textarea>
        <button class="btn btn-sm btn-success me-2 save-edit-btn">Simpan</button>
        <button class="btn btn-sm btn-secondary cancel-edit-btn">Batal</button>
    `;

    const textarea = editControlsEl.querySelector('textarea');
    const saveBtn = editControlsEl.querySelector('.save-edit-btn');
    const cancelBtn = editControlsEl.querySelector('.cancel-edit-btn');
    
    // Fungsi kecil untuk membatalkan mode edit secara visual
    const cancelEditMode = () => {
        editControlsEl.classList.add('d-none');
        commentTextEl.classList.remove('d-none');
        commentActionsEl.classList.remove('d-none');
    };

    // --- PERUBAHAN 1: Logika Tombol SIMPAN ---
    saveBtn.onclick = async () => {
        const newText = textarea.value.trim();

        // Kondisi 1: Teks tidak berubah. Batalkan tanpa loading.
        if (!newText || newText === originalText) {
            cancelEditMode();
            return;
        }

        // Kondisi 3: Teks baru. Lanjutkan dengan proses loading.
        textarea.disabled = true;
        saveBtn.disabled = true;
        cancelBtn.disabled = true;
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Menyimpan...`;

        try {
            const result = await api_service.postComment({
                action: 'edit_comment',
                commentId,
                userId: auth.currentUser.uid,
                newCommentText: newText
            });

            if (result.status === "success") {
                EventTracker.videoPage.comment.editSave(newText);
                renderCommentsForVideo(currentVideoId); // Berhasil -> Render ulang
            } else {
                alert("Gagal menyimpan perubahan.");
                cancelEditMode(); // Gagal -> Batal tanpa render ulang
            }
        } catch (error) {
            console.error("Error saat edit komentar:", error);
            alert("Terjadi kesalahan koneksi saat menyimpan perubahan.");
            cancelEditMode(); // Gagal -> Batal tanpa render ulang
        }
    };

    // --- PERUBAHAN 2: Logika Tombol BATAL ---
    cancelBtn.onclick = () => {
        EventTracker.videoPage.comment.editCancel(originalText);
        // Kondisi 2: Batal. Langsung kembali ke tampilan semula tanpa loading.
        cancelEditMode();
    };
}

/**
 * Menampilkan modal konfirmasi untuk menghapus komentar.
 */
function handleDeleteComment(commentId, commentCard) {
    const modalEl = document.getElementById('deleteConfirmModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    // Dapatkan juga referensi tombol Batal
    const cancelBtn = modalEl.querySelector('button[data-bs-dismiss="modal"]');
    const deleteModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    
    confirmBtn.dataset.commentId = commentId;
    deleteModal.show();
    
    // Hapus event listener lama untuk menghindari penumpukan
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // Tambahkan event listener baru ke tombol konfirmasi yang baru
    newConfirmBtn.addEventListener('click', async function() {
        const commentIdToDelete = this.dataset.commentId;

        // --- PERUBAHAN 1: Nonaktifkan tombol saat proses dimulai ---
        this.disabled = true;
        cancelBtn.disabled = true;
        this.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Menghapus...`;

        try {
            const result = await api_service.postComment({
                action: 'delete_comment',
                commentId: commentIdToDelete,
                userId: auth.currentUser.uid
            });

            if (result.status === "success") {
                EventTracker.videoPage.comment.deleteConfirm(commentIdToDelete);
                renderCommentsForVideo(currentVideoId);
            } else {
                alert("Gagal menghapus komentar.");
            }
        } catch (error) {
            console.error("Error saat hapus komentar:", error);
            alert("Terjadi kesalahan koneksi saat menghapus komentar.");
        } finally {
            // --- PERUBAHAN 2: Aktifkan kembali tombol & tutup modal ---
            // 'finally' akan selalu berjalan, baik berhasil maupun gagal
            deleteModal.hide();
            this.disabled = false;
            cancelBtn.disabled = false;
            this.innerHTML = 'Hapus';
        }
    });
}

// --- Bagian Tombol Share ---
function setupShareButtons() {
    const pageUrl = window.location.href;
    const shareText = "Ayo lihat cerita menarik dalam bahasa daerah ini: " + document.title;
    
    document.getElementById('share-wa').href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + pageUrl)}`;
    document.getElementById('share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;

    document.getElementById('share-wa').onclick = () => logShare('Whatsapp');
    document.getElementById('share-fb').onclick = () => logShare('Facebook');
}

function logShare(platform) {
    const videoTitle = document.getElementById("videoTitle")?.textContent || "Tanpa Judul";
    const videoId = window.currentVideoId || "ID Tidak Diketahui";
    const eventAction = `Share ${platform}`;
    const languageDisplayName = window.currentLanguagePage || "Bahasa Tidak Diketahui";

    logUserBehavior(eventAction, languageDisplayName, videoTitle);
    trackVideoInteraction(eventAction, videoTitle, videoId);
}