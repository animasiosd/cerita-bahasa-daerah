// File: js/comments.js

// Konstanta URL komentar (Google Apps Script Anda)
const WEB_APP_URL_COMMENTS = "https://script.google.com/macros/s/AKfycbwlCVUzCu9GEdi2aCZnzj-HYFXJlNX25sBEBDvivqGg2kyJrpfQZ6Jr31cknT_fcGu5_g/exec";

// Variabel status (harus global agar diisi dari video.js)
var currentVideoId = null;
var currentLanguagePage = null;

// Event form komentar
document.getElementById('comment-form').addEventListener('submit', handleCommentSubmit);

// Delegasi klik di area komentar (edit, hapus, like)
document.getElementById('comment-section').addEventListener('click', function(event) {
    if (event.target.classList.contains('edit-btn')) {
        handleEditComment(event.target.dataset.commentId, event.target.dataset.commentText);
    }
    if (event.target.classList.contains('delete-btn')) {
        handleDeleteComment(event.target.dataset.commentId, event.target.dataset.commentText);
    }
    if (event.target.classList.contains('like-btn')) {
        handleLikeClick(event.target);
    }
});

// Listener global untuk modal delete (cancel)
document.getElementById("deleteConfirmModal").addEventListener("hidden.bs.modal", function () {
    if (window.commentTextToDelete) {
        logUserBehavior("delete_comment_cancelled", "halaman-bahasa", window.commentTextToDelete);
        window.commentTextToDelete = null;
        window.commentIdToDelete = null;
    }
});

// Fungsi utama: Memuat komentar berdasarkan videoId
function loadComments(videoId) {
    const section = document.getElementById('comment-section');
    const user = auth.currentUser;

    if (!videoId) {
        section.innerHTML = '<p class="text-muted">Pilih video terlebih dahulu untuk melihat komentar.</p>';
        return;
    }

    section.innerHTML = `<div class="text-center py-5"><div class="google-spinner"></div></div>`;

    auth.currentUser.getIdToken(true).then(token => {
        fetch(`${WEB_APP_URL_COMMENTS}?video_id=${videoId}&authToken=${token}`)
            .then(res => res.json())
            .then(comments => {
                section.innerHTML = '';
                if (!comments || comments.length === 0) {
                    section.innerHTML = '<p class="text-center text-muted">Belum ada komentar. Jadilah yang pertama!</p>';
                    return;
                }

                comments.forEach(comment => {
                    const el = document.createElement('div');
                    el.className = 'd-flex mb-3';
                    const liked = user && comment.likers_user_ids && comment.likers_user_ids.includes(user.uid);
                    const isOwner = user && comment.user_id === user.uid;

                    el.innerHTML = `
                        <img src="${comment.user_photo_url}" alt="${comment.user_name}" class="rounded-circle me-3" style="width:40px;height:40px;">
                        <div class="flex-grow-1">
                            <strong>${comment.user_name}</strong>
                            <small class="text-muted">${new Date(comment.timestamp).toLocaleString('id-ID')}</small>
                            <p class="mb-1 mt-1 comment-text" data-comment-id="${comment.comment_id}" style="white-space: pre-wrap;">${comment.comments_description}</p>
                            <div class="edit-controls d-none" data-comment-id="${comment.comment_id}"></div>
                            <div class="comment-actions d-flex align-items-center small mt-1">
                            <button class="btn btn-sm ${liked ? 'btn-primary' : 'btn-outline-primary'} like-btn" 
                            data-comment-id="${comment.comment_id}">
                            ${liked ? 'Disukai' : 'Suka'}
                            </button>
                            <span class="ms-2 likes-count">${comment.likes_count > 0 ? comment.likes_count : ''}</span>

                                ${isOwner ? `
                                    <button class="btn btn-sm btn-outline-primary ms-3 edit-btn" 
                                        data-comment-id="${comment.comment_id}" 
                                        data-comment-text="${comment.comments_description}">Edit Komentar</button>
                                    <button class="btn btn-sm btn-outline-danger ms-2 delete-btn" 
                                        data-comment-id="${comment.comment_id}" 
                                        data-comment-text="${comment.comments_description}">Hapus Komentar</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                    section.appendChild(el);
                });
            })
            .catch(() => { section.innerHTML = '<p class="text-danger">Gagal memuat komentar.</p>'; });
    });
}

// Fungsi mengirim komentar baru
function handleCommentSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    const user = auth.currentUser;

    if (!text || !user) return alert("Anda harus login untuk berkomentar!");
    if (!currentVideoId) return alert("Pilih video terlebih dahulu.");

    auth.currentUser.getIdToken(true).then(token => {
        fetch(WEB_APP_URL_COMMENTS, {
            method: 'POST',
            body: JSON.stringify({
                videoId: currentVideoId,
                videoTitle: document.getElementById('videoTitle').textContent,
                languagePage: currentLanguagePage,
                userId: user.uid,
                userName: user.displayName,
                userPhotoUrl: user.photoURL,
                commentText: text,
                authToken: token
            })
        }).then(res => res.json()).then(result => {
            if (result.status === "success") {
                input.value = '';

                const currentVideoTitle = document.getElementById('videoTitle')?.textContent || "Tanpa Judul";
                logUserBehavior("comment_submit", currentVideoTitle, text);

                loadComments(currentVideoId);

                if (typeof trackVideoInteraction === "function") {
                    trackVideoInteraction("comment", { comment_id: result.comment_id });
                }
            } else {
                alert('Gagal mengirim komentar.');
            }
        });
    });
}

// Fungsi edit komentar
function handleEditComment(commentId, currentText) {
    logUserBehavior("edit_comment_clicked", "halaman-bahasa", currentText);
    const commentTextEl = document.querySelector(`.comment-text[data-comment-id="${commentId}"]`);
    const editControlsEl = document.querySelector(`.edit-controls[data-comment-id="${commentId}"]`);
    const actionsEl = editControlsEl.parentElement.querySelector('.comment-actions');

    const editBtn = actionsEl.querySelector(`.edit-btn[data-comment-id="${commentId}"]`);
    if (editBtn) editBtn.classList.add("d-none");

    editControlsEl.innerHTML = `
        <textarea class="form-control mb-2">${currentText}</textarea>
        <button class="btn btn-sm btn-success me-2">Simpan Komentar</button>
        <button class="btn btn-sm btn-secondary">Batal Edit</button>
    `;

    const [textarea, saveBtn, cancelBtn] = editControlsEl.children;

    saveBtn.onclick = () => {
        const newText = textarea.value.trim();
        if (!newText) return;
        logUserBehavior("edit_comment_saved", "halaman-bahasa", newText);

        auth.currentUser.getIdToken(true).then(token => {
            fetch(WEB_APP_URL_COMMENTS, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'edit_comment',
                    commentId: commentId,
                    userId: auth.currentUser.uid,
                    newCommentText: newText,
                    authToken: token
                })
            }).then(res => res.json()).then(result => {
                if (result.status === "success") {
                    loadComments(currentVideoId);
                } else {
                    alert("Gagal menyimpan perubahan.");
                }
            });
        });
    };

    cancelBtn.onclick = () => {
        logUserBehavior("edit_comment_cancelled", "halaman-bahasa", currentText);
        loadComments(currentVideoId);
    };

    commentTextEl.classList.add('d-none');
    editControlsEl.classList.remove('d-none');
}

// Fungsi hapus komentar
function handleDeleteComment(commentId, commentText) {
    logUserBehavior("delete_comment_clicked", "halaman-bahasa", commentText);
    window.commentIdToDelete = commentId;
    window.commentTextToDelete = commentText;

    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();

    logUserBehavior("delete_comment_modal_shown", "halaman-bahasa", commentText);

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = () => {
        logUserBehavior("delete_comment_confirmed", "halaman-bahasa", window.commentTextToDelete);

        auth.currentUser.getIdToken(true).then(token => {
            fetch(WEB_APP_URL_COMMENTS, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete_comment',
                    commentId: window.commentIdToDelete,
                    userId: auth.currentUser.uid,
                    authToken: token
                })
            }).then(res => res.json()).then(result => {
                if (result.status === "success") {
                    loadComments(currentVideoId);
                } else {
                    alert("Gagal menghapus komentar.");
                }
            });
        });

        modal.hide();
    };
}

// Fungsi like komentar
function handleLikeClick(buttonElement) {
    const user = auth.currentUser;
    if (!user) return alert("Login terlebih dahulu untuk menyukai komentar.");

    const commentId = buttonElement.dataset.commentId;

    // Ambil teks komentar untuk log
    const commentTextEl = document.querySelector(`.comment-text[data-comment-id="${commentId}"]`);
    const commentText = commentTextEl ? commentTextEl.textContent.trim() : "(Komentar tidak ditemukan)";

    const likesCountEl = buttonElement.nextElementSibling;

    // Toggle liked (cek apakah sebelumnya liked atau tidak)
    const wasLiked = buttonElement.classList.contains('btn-primary');
    const liked = !wasLiked;

    // Ubah tampilan tombol
    if (liked) {
        buttonElement.classList.remove("btn-outline-primary");
        buttonElement.classList.add("btn-primary");
        buttonElement.textContent = "Disukai";
    } else {
        buttonElement.classList.remove("btn-primary");
        buttonElement.classList.add("btn-outline-primary");
        buttonElement.textContent = "Suka";
    }

    // Tracking log
    const eventName = liked ? "liked_comment" : "unliked_comment";
    logUserBehavior(eventName, "halaman-bahasa", commentText);

    // Update jumlah likes (UI saja, biar terasa responsif)
    let likes = parseInt(likesCountEl.textContent || '0');
    likesCountEl.textContent = liked ? likes + 1 : (likes - 1 > 0 ? likes - 1 : '');

    // Kirim ke server
    auth.currentUser.getIdToken(true).then(token => {
        fetch(WEB_APP_URL_COMMENTS, {
            method: 'POST',
            body: JSON.stringify({
                action: 'toggle_like',
                commentId: commentId,
                userId: user.uid,
                authToken: token
            })
        }).catch(() => loadComments(currentVideoId));
    });
}
