// File: js/ui/page_static.js

import { EventTracker } from '../events.js';

document.addEventListener('DOMContentLoaded', () => {
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            // Memanggil event tracker saat tombol diklik
            EventTracker.staticPage.backToHomeClick(document.title);
        });
    }
});