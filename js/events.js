// ======================================================================
// File: js/events.js
// Deskripsi: Modul terpusat untuk definisi dan pemanggilan semua 
//            event tracking di aplikasi Cerita Bahasa Daerah.
// ======================================================================

// Asumsi: Fungsi logUserBehavior(), trackVideoInteraction(), dan
// logDownloadPageInteraction() dari analytics.js tersedia secara global.

// ======================================================================
// 1. DEFINISI NAMA-NAMA EVENT (Mencegah Typo & Sentralisasi)
// ======================================================================

const EVENTS = {
  // --- Autentikasi & Sesi ---
  AUTH_LOGIN_CLICK: 'login_button_clicked',
  AUTH_LOGOUT_CLICK: 'logout_button_clicked',

  // --- Navigasi Global (dari navbar.html) ---
  NAV_LOGO_CLICK: 'navbar_logo_clicked',
  NAV_BERANDA_CLICK: 'navbar_beranda_clicked',
  NAV_DOWNLOAD_CLICK: 'navbar_download_clicked',
  NAV_LANGUAGE_SELECT: 'navbar_language_selected',

  // --- Halaman Video & Komentar (dari video.js & comments.js) ---
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

  // --- Halaman Download (dari download.html) ---
  DOWNLOAD_FILE_CLICK: 'download_file_clicked',
  DOWNLOAD_FILTER_BAHASA: 'download_filter_by_bahasa',
  DOWNLOAD_FILTER_URUTAN: 'download_filter_by_urutan',
  DOWNLOAD_FILTER_JUDUL: 'download_filter_by_judul',
  DOWNLOAD_SORT_TABLE: 'download_sort_table',
  DOWNLOAD_RESET_FILTER: 'download_reset_filter_clicked',
  DOWNLOAD_RESET_SORT: 'download_reset_sort_clicked',
  
  // --- PWA (dari main.js) ---
  PWA_INSTALL_CLICK: 'pwa_install_button_clicked'
};


// ======================================================================
// 2. OBJEK TRACKER (Wrapper Functions untuk pemanggilan yang bersih)
// ======================================================================

const EventTracker = {

  /**
   * @description Melacak event terkait autentikasi dan sesi pengguna.
   */
  auth: {
    loginClick: () => logUserBehavior(EVENTS.AUTH_LOGIN_CLICK),
    logoutClick: () => logUserBehavior(EVENTS.AUTH_LOGOUT_CLICK),
  },

  /**
   * @description Melacak interaksi pengguna pada elemen navigasi utama (navbar).
   */
  navigation: {
    logoClick: () => logUserBehavior(EVENTS.NAV_LOGO_CLICK, 'navbar'),
    berandaClick: () => logUserBehavior(EVENTS.NAV_BERANDA_CLICK, 'navbar'),
    downloadClick: () => logUserBehavior(EVENTS.NAV_DOWNLOAD_CLICK, 'navbar'),
    languageSelect: (languageName) => logUserBehavior(EVENTS.NAV_LANGUAGE_SELECT, languageName),
  },

  /**
   * @description Melacak semua interaksi di halaman video.
   */
  videoPage: {
    chooseVideo: (videoTitle, videoId) => logUserBehavior(EVENTS.VIDEO_CHOOSE, videoTitle, videoId),
    
    // --- Interaksi Player ---
    play: (watchPercentage) => trackVideoInteraction('play', { video_watch_percentage: watchPercentage }),
    pause: (watchPercentage) => trackVideoInteraction('pause', { video_watch_percentage: watchPercentage }),
    ended: () => trackVideoInteraction('video_completed', { video_watch_percentage: 100 }),
    enterFullscreen: (watchPercentage) => trackVideoInteraction('enter_fullscreen', { video_watch_percentage: watchPercentage }),
    exitFullscreen: (watchPercentage) => trackVideoInteraction('exit_fullscreen', { video_watch_percentage: watchPercentage }),
    
    // --- Interaksi Komentar ---
    comment: {
      submit: (videoTitle, commentText) => logUserBehavior(EVENTS.COMMENT_SUBMIT, videoTitle, commentText),
      like: (commentText) => logUserBehavior(EVENTS.COMMENT_LIKE, 'bahasa_page', commentText),
      unlike: (commentText) => logUserBehavior(EVENTS.COMMENT_UNLIKE, 'bahasa_page', commentText),
      editClick: (commentText) => logUserBehavior(EVENTS.COMMENT_EDIT_CLICK, 'bahasa_page', commentText),
      editSave: (newCommentText) => logUserBehavior(EVENTS.COMMENT_EDIT_SAVE, 'bahasa_page', newCommentText),
      editCancel: (originalCommentText) => logUserBehavior(EVENTS.COMMENT_EDIT_CANCEL, 'bahasa_page', originalCommentText),
      deleteClick: (commentText) => logUserBehavior(EVENTS.COMMENT_DELETE_CLICK, 'bahasa_page', commentText),
      deleteModalShow: (commentText) => logUserBehavior(EVENTS.COMMENT_DELETE_MODAL_SHOW, 'bahasa_page', commentText),
      deleteConfirm: (commentText) => logUserBehavior(EVENTS.COMMENT_DELETE_CONFIRM, 'bahasa_page', commentText),
      deleteCancel: (commentText) => logUserBehavior(EVENTS.COMMENT_DELETE_CANCEL, 'bahasa_page', commentText),
    }
  },

  /**
   * @description Melacak semua interaksi di halaman download.
   */
  downloadPage: {
    clickDownload: (bahasa, title, urutan) => logDownloadPageInteraction(EVENTS.DOWNLOAD_FILE_CLICK, bahasa, title, urutan),
    filterByBahasa: (language) => logDownloadPageInteraction(EVENTS.DOWNLOAD_FILTER_BAHASA, 'bahasa', language || 'Semua'),
    filterByUrutan: (sequence) => logDownloadPageInteraction(EVENTS.DOWNLOAD_FILTER_URUTAN, 'urutan', sequence || 'Semua'),
    filterByJudul: (title) => logDownloadPageInteraction(EVENTS.DOWNLOAD_FILTER_JUDUL, 'judul', title || 'Semua'),
    sortTable: (key, direction) => logDownloadPageInteraction(EVENTS.DOWNLOAD_SORT_TABLE, key, direction),
    resetFilter: () => logDownloadPageInteraction(EVENTS.DOWNLOAD_RESET_FILTER, 'Filter', 'Default'),
    resetSort: () => logDownloadPageInteraction(EVENTS.DOWNLOAD_RESET_SORT, 'Urutan', 'Default'),
  },

  /**
   * @description Melacak interaksi terkait Progressive Web App (PWA).
   */
  pwa: {
    installClick: () => logUserBehavior(EVENTS.PWA_INSTALL_CLICK, 'navbar')
  }
};