// ======================================================================
// File: js/load_data/api_service.js (VERSI FIX)
// ======================================================================
import { auth } from "../ui/page_auth.js";

const api_service = {
    _URL_LANGUAGES_VIDEOS: "https://script.google.com/macros/s/AKfycbw7D1aaLBZqymwF5arZ_n2gY2we02ZPaF4cOTpBMp9WB8zdT3b4SLtx7rRNm8v_6kJn/exec",
    _URL_DOWNLOADS: "https://script.google.com/macros/s/AKfycbyVZHGfb2xf-uPtKzqZ0bD4oIDttsBgF-n_aNXB0-h_Xy-oxYChmT-a4SYDV3MwiUpI/exec",
    _URL_ANALYTICS_WEB_APP: "https://script.google.com/macros/s/AKfycbxTYwR2u_KgHLLGXpwH8I6vFRKF6Gi2jfW2HroHuS0kNi0YmDq89N2CvhNqER4Y6rg4Mw/exec",
    _URL_COMMENTS: "https://script.google.com/macros/s/AKfycbyMPttPRKP1VMzSOEqesIR1thmb7iLqklziJRhGs25vXg6sIvd4yhogTJmUig5yYl8dQg/exec",

    async fetchLanguages() {
        try {
            const res = await fetch(this._URL_LANGUAGES_VIDEOS);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("❌ fetchLanguages:", err);
            return [];
        }
    },

    async fetchVideos(language) {
        try {
            const res = await fetch(`${this._URL_LANGUAGES_VIDEOS}?action=getVideos&lang=${encodeURIComponent(language)}`);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("❌ fetchVideos:", err);
            return { videos: [], displayName: language };
        }
    },

    async fetchDownloadableContent() {
        try {
            const res = await fetch(this._URL_DOWNLOADS);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("Format data unduhan tidak sesuai");
            return data;
        } catch (err) {
            console.error("❌ fetchDownloadableContent:", err);
            return [];
        }
    },

    async fetchComments(videoId) {
        try {
            const token = await auth.currentUser.getIdToken(true);
            const res = await fetch(`${this._URL_COMMENTS}?video_id=${videoId}&authToken=${token}`);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("❌ fetchComments:", err);
            return [];
        }
    },

    async postComment(commentData) {
        commentData.authToken = await auth.currentUser.getIdToken(true);
        const res = await fetch(this._URL_COMMENTS, {
            method: "POST",
            body: JSON.stringify(commentData),
        });
        return await res.json();
    }
};

export { api_service };
