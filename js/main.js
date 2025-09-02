// File: js/main.js
import { managePageAccess, initializeLoginPage } from './ui/page_auth.js';
import './footer.js'; // Impor footer jika Anda ingin tetap menggunakannya

document.addEventListener('DOMContentLoaded', () => {
    managePageAccess(() => {
        initializeLoginPage();
    });
});