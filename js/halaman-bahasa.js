// js/halaman-bahasa.js

document.addEventListener('DOMContentLoaded', function () {
    const videoTitle = document.getElementById('videoTitle');
    const videoSelect = document.getElementById('videoSelect');
    const videoPlayer = document.getElementById('videoPlayer');
    const languageNamePlaceholder = document.getElementById('language-name-placeholder');

    const urlParams = new URLSearchParams(window.location.search);
    const bahasa = urlParams.get('bahasa') || 'tidak-diketahui';

    languageNamePlaceholder.textContent = bahasa;

    // Contoh daftar video (harus diganti dengan data nyata dari server atau API)
    const videos = {
        sasak: [
            { id: 'abcd1234', title: 'Cerita Sasak 1' },
            { id: 'efgh5678', title: 'Cerita Sasak 2' }
        ],
        jawa: [
            { id: 'ijkl9012', title: 'Cerita Jawa 1' },
            { id: 'mnop3456', title: 'Cerita Jawa 2' }
        ]
    };

    const daftarVideo = videos[bahasa];

    if (!daftarVideo) {
        videoTitle.textContent = 'Bahasa tidak ditemukan.';
        return;
    }

    daftarVideo.forEach(video => {
        const option = document.createElement('option');
        option.value = video.id;
        option.textContent = video.title;
        videoSelect.appendChild(option);
    });

    function updateVideoPlayer(videoId) {
        videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
        const selectedVideo = daftarVideo.find(v => v.id === videoId);
        videoTitle.textContent = selectedVideo ? selectedVideo.title : 'Memuat Video...';
    }

    videoSelect.addEventListener('change', () => {
        updateVideoPlayer(videoSelect.value);
    });

    // Otomatis tampilkan video pertama
    if (daftarVideo.length > 0) {
        updateVideoPlayer(daftarVideo[0].id);
        videoSelect.value = daftarVideo[0].id;
    }
});
