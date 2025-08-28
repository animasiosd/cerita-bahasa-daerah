// ======================================================================
// File: js/events.js (VERSI MANDIRI - TANPA analytics.js)
// Deskripsi: Tracking custom events langsung ke Google Tag Manager (GTM)
// ======================================================================

// Pastikan dataLayer ada
window.dataLayer = window.dataLayer || [];

// ------------------------------------------------------
// 1. Kumpulan Nama Events
// ------------------------------------------------------
const EVENTS = {
  // --- Autentikasi & Sesi ---
  AUTH_LOGIN_CLICK: 'login_button_clicked',
  AUTH_LOGOUT_CLICK: 'logout_button_clicked',

  // --- Navigasi Global (dari navbar.html) ---
  NAV_LOGO_CLICK: 'navbar_logo_clicked',
  NAV_BERANDA_CLICK: 'navbar_beranda_clicked',
  NAV_DOWNLOAD_CLICK: 'navbar_download_clicked',
  NAV_LANGUAGE_SELECT: 'navbar_language_selected',

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
  PWA_INSTALL_CLICK: 'pwa_install_button_clicked'
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

  auth: {
    loginClick: () => pushEventToGTM(EVENTS.AUTH_LOGIN_CLICK),
    logoutClick: () => pushEventToGTM(EVENTS.AUTH_LOGOUT_CLICK)
  },

  navigation: {
    logoClick: () => pushEventToGTM(EVENTS.NAV_LOGO_CLICK, { location: 'navbar' }),
    berandaClick: () => pushEventToGTM(EVENTS.NAV_BERANDA_CLICK, { location: 'navbar' }),
    downloadClick: () => pushEventToGTM(EVENTS.NAV_DOWNLOAD_CLICK, { location: 'navbar' }),
    languageSelect: (languageName) => pushEventToGTM(EVENTS.NAV_LANGUAGE_SELECT, { selected_language: languageName })
  },

  videoPage: {
    chooseVideo: (videoTitle, videoId) => pushEventToGTM(EVENTS.VIDEO_CHOOSE, { video_title: videoTitle, video_id: videoId }),
    play: (watchPercentage) => pushEventToGTM(EVENTS.VIDEO_PLAY, { video_watch_percentage: watchPercentage }),
    pause: (watchPercentage) => pushEventToGTM(EVENTS.VIDEO_PAUSE, { video_watch_percentage: watchPercentage }),
    ended: () => pushEventToGTM(EVENTS.VIDEO_ENDED, { video_watch_percentage: 100 }),
    enterFullscreen: (watchPercentage) => pushEventToGTM(EVENTS.VIDEO_ENTER_FULLSCREEN, { video_watch_percentage: watchPercentage }),
    exitFullscreen: (watchPercentage) => pushEventToGTM(EVENTS.VIDEO_EXIT_FULLSCREEN, { video_watch_percentage: watchPercentage }),

    comment: {
      submit: (videoTitle, commentText) => pushEventToGTM(EVENTS.COMMENT_SUBMIT, { video_title: videoTitle, comment_text: commentText }),
      like: (commentText) => pushEventToGTM(EVENTS.COMMENT_LIKE, { comment_text: commentText }),
      unlike: (commentText) => pushEventToGTM(EVENTS.COMMENT_UNLIKE, { comment_text: commentText }),
      editClick: (commentText) => pushEventToGTM(EVENTS.COMMENT_EDIT_CLICK, { comment_text: commentText }),
      editSave: (newCommentText) => pushEventToGTM(EVENTS.COMMENT_EDIT_SAVE, { comment_text: newCommentText }),
      editCancel: (originalCommentText) => pushEventToGTM(EVENTS.COMMENT_EDIT_CANCEL, { comment_text: originalCommentText }),
      deleteClick: (commentText) => pushEventToGTM(EVENTS.COMMENT_DELETE_CLICK, { comment_text: commentText }),
      deleteModalShow: (commentText) => pushEventToGTM(EVENTS.COMMENT_DELETE_MODAL_SHOW, { comment_text: commentText }),
      deleteConfirm: (commentText) => pushEventToGTM(EVENTS.COMMENT_DELETE_CONFIRM, { comment_text: commentText }),
      deleteCancel: (commentText) => pushEventToGTM(EVENTS.COMMENT_DELETE_CANCEL, { comment_text: commentText }),
    }
  },

  downloadPage: {
    clickDownload: (bahasa, title, urutan) => pushEventToGTM(EVENTS.DOWNLOAD_FILE_CLICK, { bahasa, title, urutan }),
    filterByBahasa: (language) => pushEventToGTM(EVENTS.DOWNLOAD_FILTER_BAHASA, { bahasa: language || 'Semua' }),
    filterByUrutan: (sequence) => pushEventToGTM(EVENTS.DOWNLOAD_FILTER_URUTAN, { urutan: sequence || 'Semua' }),
    filterByJudul: (title) => pushEventToGTM(EVENTS.DOWNLOAD_FILTER_JUDUL, { judul: title || 'Semua' }),
    sortTable: (key, direction) => pushEventToGTM(EVENTS.DOWNLOAD_SORT_TABLE, { sort_by: key, sort_direction: direction }),
    resetFilter: () => pushEventToGTM(EVENTS.DOWNLOAD_RESET_FILTER),
    resetSort: () => pushEventToGTM(EVENTS.DOWNLOAD_RESET_SORT)
  },

  pwa: {
    installClick: () => pushEventToGTM(EVENTS.PWA_INSTALL_CLICK, { location: 'navbar' })
  }
};
