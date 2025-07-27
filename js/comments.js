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
        handleDeleteComment(event.target.dataset.commentId);
    }
    if (event.target.classList.contains('like-btn')) {
        handleLikeClick(event.target);
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
                                <span class="like-btn ${liked ? 'liked' : ''}" data-comment-id="${comment.comment_id}">👍</span>
                                <span class="ms-2 likes-count">${comment.likes_count > 0 ? comment.likes_count : ''}</span>
                                ${isOwner ? `
                                    <button class="btn btn-sm btn-outline-primary ms-3 edit-btn" data-comment-id="${comment.comment_id}" data-comment-text="${comment.comments_description}">Edit</button>
                                    <button class="btn btn-sm btn-outline-danger ms-2 delete-btn" data-comment-id="${comment.comment_id}">Hapus</button>
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
                loadComments(currentVideoId);  // Reload komentar
                // 🧠 Tracking komentar untuk video_interaction
                if (typeof trackVideoInteraction === "function") {
                    trackVideoInteraction("comment", { comment_id: result.comment_id });
                }
            } else {
                alert('Gagal mengirim komentar.');
            }
        });
    });
}

// Fungsi edit komentar (tanpa perubahan dari sebelumnya)
function handleEditComment(commentId, currentText) {
    const commentTextEl = document.querySelector(`.comment-text[data-comment-id="${commentId}"]`);
    const editControlsEl = document.querySelector(`.edit-controls[data-comment-id="${commentId}"]`);

    editControlsEl.innerHTML = `
        <textarea class="form-control mb-2">${currentText}</textarea>
        <button class="btn btn-sm btn-success me-2">Simpan</button>
        <button class="btn btn-sm btn-secondary">Batal</button>
    `;

    const [textarea, saveBtn, cancelBtn] = editControlsEl.children;

    saveBtn.onclick = () => {
        const newText = textarea.value.trim();
        if (!newText) return;
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

    cancelBtn.onclick = () => loadComments(currentVideoId);

    commentTextEl.classList.add('d-none');
    editControlsEl.classList.remove('d-none');
}

// Fungsi hapus komentar (tanpa perubahan)
function handleDeleteComment(commentId) {
    if (!confirm("Yakin ingin menghapus komentar ini?")) return;

    auth.currentUser.getIdToken(true).then(token => {
        fetch(WEB_APP_URL_COMMENTS, {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete_comment',
                commentId: commentId,
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
}

// Fungsi like komentar (tanpa perubahan)
function handleLikeClick(buttonElement) {
    const user = auth.currentUser;
    if (!user) return alert("Login terlebih dahulu untuk menyukai komentar.");

    const commentId = buttonElement.dataset.commentId;
    const likesCountEl = buttonElement.nextElementSibling;
    const liked = buttonElement.classList.toggle('liked');
    let likes = parseInt(likesCountEl.textContent || '0');
    likesCountEl.textContent = liked ? likes + 1 : (likes - 1 > 0 ? likes - 1 : '');

    auth.currentUser.getIdToken(true).then(token => {
        fetch(WEB_APP_URL_COMMENTS, {
            method: 'POST',
            body: JSON.stringify({
                action: 'toggle_like',
                commentId: commentId,
                userId: user.uid,
                authToken: token
            })
        }).catch(() => loadComments(currentVideoId)); // fallback reload
    });
}
