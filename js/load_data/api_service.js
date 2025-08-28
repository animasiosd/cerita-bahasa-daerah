// ======================================================================
// File: js/load_data/api_service.js (VERSI FINAL)
// Deskripsi: Bertanggung jawab untuk MENGAMBIL & MENGIRIM semua data dari/ke API
//            Google Apps Script (bahasa, video, download, komentar).
// ======================================================================
import { auth } from "../ui/page_auth.js";

export { api_service };

const api_service = {
    // URL Endpoints
    _URL_LANGUAGES_VIDEOS: "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec",
    _URL_DOWNLOADS: 'https://script.google.com/macros/s/AKfycbyVZHGfb2xf-uPtKzqZ0bD4oIDttsBgF-n_aNXB0-h_Xy-oxYChmT-a4SYDV3MwiUpI/exec',
    _URL_COMMENTS: "https://script.google.com/macros/s/AKfycbyMPttPRKP1VMzSOEqesIR1thmb7iLqklziJRhGs25vXg6sIvd4yhogTJmUig5yYl8dQg/exec",


    /** Mengambil daftar bahasa dari API untuk navbar. */
    async fetchLanguages() {
        try {
            const response = await fetch(this._URL_LANGUAGES_VIDEOS);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Gagal mengambil daftar bahasa:", error);
            return [];
        }
    },

    /** Mengambil daftar video berdasarkan bahasa yang dipilih. */
    async fetchVideos(language) {
        try {
            const response = await fetch(`${this._URL_LANGUAGES_VIDEOS}?action=getVideos&lang=${encodeURIComponent(language)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Gagal mengambil daftar video:", error);
            return { videos: [], displayName: language }; // Return default object on error
        }
    },

    /** Mengambil daftar video yang bisa diunduh. */
    async fetchDownloadableContent() {
        try {
            const response = await fetch(this._URL_DOWNLOADS);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Format data unduhan tidak sesuai.");
            return data;
        } catch (error) {
            console.error("Gagal mengambil konten unduhan:", error);
            return [];
        }
    },

    /** Mengambil komentar untuk videoId tertentu. */
    async fetchComments(videoId) {
        try {
            const token = await auth.currentUser.getIdToken(true);
            const response = await fetch(`${this._URL_COMMENTS}?video_id=${videoId}&authToken=${token}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Gagal mengambil komentar:", error);
            return [];
        }
    },
    
    /** Mengirim komentar baru. */
    async postComment(commentData) {
        commentData.authToken = await auth.currentUser.getIdToken(true);
        const response = await fetch(this._URL_COMMENTS, {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
        return await response.json();
    }

    // CATATAN: Fungsi untuk edit, hapus, dan like komentar juga akan menggunakan
    // endpoint _URL_COMMENTS dengan body yang berbeda, sama seperti postComment.
    // Untuk mempersingkat, mereka dapat digabungkan di sini jika diperlukan.
};