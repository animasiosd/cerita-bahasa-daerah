// ======================================================================
// File: js/events.js (VERSI BARU TERINTEGRASI ANALYTICS)
// ======================================================================

// Pastikan dataLayer ada
window.dataLayer = window.dataLayer || [];

// Impor analytics_service untuk kirim ke Google Sheets
import { logUserBehavior, updateFavoriteLanguage, logPageView, logDownloadPageInteraction, trackVideoInteraction } from './send_data/analytics_service.js';

// ------------------------------------------------------
// 1. Kumpulan Nama Events
// ------------------------------------------------------
const EVENTS = {
  // --- Autentikasi & Sesi ---
  AUTH_LOGIN_CLICK: 'login_button_clicked',
  AUTH_LOGOUT_CLICK: 'logout_button_clicked',
  
  // TAMBAHKAN EVENT BARU DI BAWAH INI
  PAGE_VIEW_TRACKED: 'page_view',

  // --- Navigasi Global (dari navbar.html) ---
  NAV_LOGO_CLICK: 'Logo',
  NAV_BERANDA_CLICK: 'Beranda',
  NAV_DOWNLOAD_CLICK: 'Download',
  NAV_LANGUAGE_SELECT: 'Pilih Bahasa',

  // --- Halaman Video & Komentar ---
  VIDEO_CHOOSE: 'video_choose_from_dropdown',
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_ENDED: 'video_completed',
  VIDEO_ENTER_FULLSCREEN: 'video_enter_fullscreen',
  VIDEO_EXIT_FULLSCREEN: 'video_exit_fullscreen',

  COMMENT_SUBMIT: 'comment_submit',
  COMMENT_LIKE: 'comment_liked',
  COMMENT_UNLIKE: 'comment_unliked',
  COMMENT_EDIT_CLICK: 'comment_edit_clicked',
  COMMENT_EDIT_SAVE: 'comment_edit_saved',
  COMMENT_EDIT_CANCEL: 'comment_edit_cancelled',
  COMMENT_DELETE_CLICK: 'comment_delete_clicked',
  COMMENT_DELETE_MODAL_SHOW: 'comment_delete_modal_shown',
  COMMENT_DELETE_CONFIRM: 'comment_delete_confirmed',
  COMMENT_DELETE_CANCEL: 'comment_delete_cancelled',

  // --- Halaman Download ---
  DOWNLOAD_FILE_CLICK: 'download_file_clicked',
  DOWNLOAD_FILTER_BAHASA: 'download_filter_by_bahasa',
  DOWNLOAD_FILTER_URUTAN: 'download_filter_by_urutan',
  DOWNLOAD_FILTER_JUDUL: 'download_filter_by_judul',
  DOWNLOAD_SORT_TABLE: 'download_sort_table',
  DOWNLOAD_RESET_FILTER: 'download_reset_filter_clicked',
  DOWNLOAD_RESET_SORT: 'download_reset_sort_clicked',

  // --- PWA ---
  PWA_INSTALL_CLICK: 'PWA Install Button Clicked',
  PWA_INSTALL_ACCEPTED: 'PWA Install Accepted',
  PWA_INSTALL_DISMISSED: 'PWA Install Dismissed',

  // --- FOOTER ---
  FOOTER_PRIVACY_CLICK: 'footer_privacy_policy_clicked',
  FOOTER_TERMS_CLICK: 'footer_terms_of_service_clicked',

  // --- Privacy Policy & Terms of Service ---
  
};

// ------------------------------------------------------
// 2. Helper Function untuk Kirim Event ke GTM / GA4
// ------------------------------------------------------
function pushEventToGTM(eventName, data = {}) {
  if (!eventName) return;
  window.dataLayer.push({
    event: eventName,
    ...data
  });
  console.log(`[EventTracker] Event terkirim: ${eventName}`, data);
}

// ------------------------------------------------------
// 3. EventTracker Object
// ------------------------------------------------------
export const EventTracker = {

  // -------------------
  // KUNJUNGAN HALAMAN
  // -------------------
  page: {
    view: (user) => {
      // Kirim event ke GTM / GA4
      // pushEventToGTM(EVENTS.PAGE_VIEW_TRACKED, { page_path: window.location.pathname });
      
      // Kirim event ke Google Sheets melalui analytics_service
      logPageView(user);
    }
  },

  // -------------------
  // AUTENTIKASI
  // -------------------
  auth: {
    loginClick: () => {
      pushEventToGTM(EVENTS.AUTH_LOGIN_CLICK);
      logUserBehavior('Login Button Clicked', 'Navbar', 'Login');
    },
    logoutClick: () => {
      pushEventToGTM(EVENTS.AUTH_LOGOUT_CLICK);
      logUserBehavior('Logout Button Clicked', 'Navbar', 'Logout');
    }
  },

  // -------------------
  // NAVIGASI GLOBAL
  // -------------------
  navigation: {
    logoClick: () => {
      pushEventToGTM(EVENTS.NAV_LOGO_CLICK, { location: 'navbar' });
      logUserBehavior('Logo', 'Navbar', 'Logo');
    },
    berandaClick: () => {
      pushEventToGTM(EVENTS.NAV_BERANDA_CLICK, { location: 'navbar' });
      logUserBehavior('Beranda', 'Navbar', 'Beranda');
    },
    downloadClick: () => {
      pushEventToGTM(EVENTS.NAV_DOWNLOAD_CLICK, { location: 'navbar' });
      logUserBehavior('Download', 'Navbar', 'Download');
    },

    languageSelect: (languageName) => {
      // Validasi input
      if (!languageName || languageName.trim() === "") {
        console.warn("⚠️ Bahasa tidak valid, event dibatalkan");
        return;
      }

      // Ambil nama lengkap bahasa (displayName), fallback ke slug
      const displayName = window.currentLanguageDisplayName || languageName;

      // Kirim ke GTM
      pushEventToGTM(EVENTS.NAV_LANGUAGE_SELECT, { selected_language: displayName });

      // Kirim ke Google Sheets (user_behavior)
      logUserBehavior('Pilih Bahasa', 'Navbar', displayName);

      // Update user_list (favorite_languages & last_accessed_language)
      updateFavoriteLanguage(displayName);

      console.log(`✅ Bahasa berhasil dipilih: ${displayName}`);
    }
},

  // -------------------
  // HALAMAN VIDEO
  // -------------------
  videoPage: {
    chooseVideo: (videoTitle, videoId) => {
      pushEventToGTM(EVENTS.VIDEO_CHOOSE, { video_title: videoTitle, video_id: videoId });
      trackVideoInteraction('Pilih Video', videoTitle, videoId);
    },
    play: (watchPercentage) => {
      pushEventToGTM(EVENTS.VIDEO_PLAY, { video_watch_percentage: watchPercentage });
      trackVideoInteraction('Video Play', 'video_page', `${watchPercentage}%`);
    },
    pause: (watchPercentage) => {
      pushEventToGTM(EVENTS.VIDEO_PAUSE, { video_watch_percentage: watchPercentage });
      trackVideoInteraction('Video Pause', 'video_page', `${watchPercentage}%`);
    },
    ended: () => {
      pushEventToGTM(EVENTS.VIDEO_ENDED, { video_watch_percentage: 100 });
      trackVideoInteraction('Video Completed', 'video_page', '100%');
    },
    enterFullscreen: (watchPercentage) => {
      pushEventToGTM(EVENTS.VIDEO_ENTER_FULLSCREEN, { video_watch_percentage: watchPercentage });
      trackVideoInteraction('Video Enter Fullscreen', 'video_page', `${watchPercentage}%`);
    },
    exitFullscreen: (watchPercentage) => {
      pushEventToGTM(EVENTS.VIDEO_EXIT_FULLSCREEN, { video_watch_percentage: watchPercentage });
      trackVideoInteraction('Video Exit Fullscreen', 'video_page', `${watchPercentage}%`);
    },
    comment: {
      submit: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_SUBMIT, { video_title: videoTitle, comment_text: commentText });
        trackVideoInteraction('Comment Submit', commentId, commentText);
      },
      like: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_LIKE, { comment_text: commentText });
        trackVideoInteraction('Comment Liked', commentId, commentText);
      },
      unlike: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_UNLIKE, { comment_text: commentText });
        trackVideoInteraction('Comment Unliked', commentId, commentText);
      },
      editClick: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_EDIT_CLICK, { comment_text: commentText });
        trackVideoInteraction('Comment Edit Clicked', commentId, commentText);
      },
      editSave: (commentId, newCommentText) => {
        pushEventToGTM(EVENTS.COMMENT_EDIT_SAVE, { comment_text: newCommentText });
        trackVideoInteraction('Comment Edit Saved', commentId, newCommentText);
      },
      editCancel: (commentId, originalCommentText) => {
        pushEventToGTM(EVENTS.COMMENT_EDIT_CANCEL, { comment_text: originalCommentText });
        trackVideoInteraction('Comment Edit Cancelled', commentId, originalCommentText);
      },
      deleteClick: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_DELETE_CLICK, { comment_text: commentText });
        trackVideoInteraction('Comment Delete Clicked', commentId, commentText);
      },
      deleteModalShow: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_DELETE_MODAL_SHOW, { comment_text: commentText });
        trackVideoInteraction('Comment Delete Shown', commentId, commentText);
      },
      deleteConfirm: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_DELETE_CONFIRM, { comment_text: commentText });
        trackVideoInteraction('Comment Delete Confirmed', commentId, commentText);
      },
      deleteCancel: (commentId, commentText) => {
        pushEventToGTM(EVENTS.COMMENT_DELETE_CANCEL, { comment_text: commentText });
        trackVideoInteraction('Comment Delete Cancelled', commentId, commentText);
      },
    }
  },

  // -------------------
  // HALAMAN DOWNLOAD
  // -------------------
  downloadPage: {
    clickDownload: (bahasa, title, urutan) => {
      pushEventToGTM(EVENTS.DOWNLOAD_FILE_CLICK, { bahasa, title, urutan });
      logDownloadPageInteraction('Download File', bahasa, title, urutan);
    },
    filterChanged: (action, language, title, sequence) => {
        pushEventToGTM('download_filter_changed', { filter_action: action, language, title, sequence });
        logDownloadPageInteraction(action, language, title, sequence);
    },
    sortTable: (key, direction) => {
    const keyTranslator = {
        'bahasa': 'Bahasa',
        'title': 'Judul Cerita',
        'urutan': 'Urutan Cerita',
        'sequence': 'Urutan Cerita'
    };
    const translatedKey = keyTranslator[key] || key;
    pushEventToGTM(EVENTS.DOWNLOAD_SORT_TABLE, { sort_by: translatedKey, sort_direction: direction });
    logDownloadPageInteraction('Sortir Kolom', translatedKey, direction);
},
    resetFilter: () => {
      pushEventToGTM(EVENTS.DOWNLOAD_RESET_FILTER);
      logDownloadPageInteraction('Reset Filter');
    },
    resetSort: () => {
      pushEventToGTM(EVENTS.DOWNLOAD_RESET_SORT);
      logDownloadPageInteraction('Reset Urutan');
    }
  },

  // -------------------
  // PWA INSTALL
  // -------------------
  pwa: {
    installClick: () => {
      pushEventToGTM(EVENTS.PWA_INSTALL_CLICK, { location: 'navbar' });
      logUserBehavior('PWA Install Clicked', 'Navbar', 'PWA Install Button');
    },
    // TAMBAHKAN DUA FUNGSI BARU DI BAWAH INI
    installAccepted: () => {
      pushEventToGTM(EVENTS.PWA_INSTALL_ACCEPTED);
      logUserBehavior('PWA Install Accepted', 'PWA Prompt', 'PWA Prompt Accepted');
    },
    installDismissed: () => {
      pushEventToGTM(EVENTS.PWA_INSTALL_DISMISSED);
      logUserBehavior('PWA Install Dismissed', 'PWA Prompt', 'PWA Prompt Dismissed');
    }
  },

  // -------------------
  // FOOTER
  // -------------------
  footer: {
    privacyPolicyClick: () => {
      pushEventToGTM(EVENTS.FOOTER_PRIVACY_CLICK, { link_location: 'footer' });
      logUserBehavior('Footer Kebijakan Privasi', 'Footer', 'Kebijakan Privasi');
    },
    termsOfServiceClick: () => {
      pushEventToGTM(EVENTS.FOOTER_TERMS_CLICK, { link_location: 'footer' });
      logUserBehavior('Footer Ketentuan Layanan', 'Footer', 'Ketentuan Layanan');
    }
  },

  staticPage: {
    backToHomeClick: (pageTitle) => {
      // Kirim event ke Google Sheets
      logUserBehavior('Kembali ke Beranda', 'Static Page', pageTitle);
    }
  }
};
