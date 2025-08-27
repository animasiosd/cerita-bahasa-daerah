// ======================================================================
// File: js/load_data/api_service.js
// Deskripsi: Bertanggung jawab untuk MENGAMBIL semua data dari API
//            Google Apps Script (bahasa, video, download, komentar).
// ======================================================================

const api_service = {
    /**
     * Mengambil daftar bahasa dari API untuk navbar.
     * Asal Kode: main.js
     */
    async fetchLanguages() {
        const BAHASA_API_URL = "https://script.google.com/macros/s/AKfycbz0r5Tvw0M2ptBsD4oKDtuCe8Hi1ygfVfM2ubDObGEWMuv04N382-Y0dZFCsBi9RUpv/exec";
        try {
            const response = await fetch(BAHASA_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Gagal mengambil daftar bahasa:", error);
            return []; // Kembalikan array kosong jika gagal
        }
    },

    /**
     * Mengambil daftar video yang bisa diunduh.
     * Asal Kode: download.html (inline script)
     */
    async fetchDownloadableContent() {
        const DOWNLOAD_API_URL = 'https://script.google.com/macros/s/AKfycbyVZHGfb2xf-uPtKzqZ0bD4oIDttsBgF-n_aNXB0-h_Xy-oxYChmT-a4SYDV3MwiUpI/exec';
        try {
            const response = await fetch(DOWNLOAD_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                 throw new Error("Format data unduhan tidak sesuai.");
            }
            return data;
        } catch (error) {
            console.error("Gagal mengambil konten unduhan:", error);
            return []; // Kembalikan array kosong jika gagal
        }
    }

    // Catatan: Fungsi untuk mengambil video dan komentar akan ditambahkan di sini
    // saat kita merefaktor halaman bahasa.html, agar file ini lengkap.
};