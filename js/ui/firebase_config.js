// Import modul firebase app
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCAOg2aMzFVCQVx07t85lFpTXv3c2ugL1E",
  authDomain: "animasiosd-github.firebaseapp.com",
  projectId: "animasiosd-github",
  storageBucket: "animasiosd-github.firebasestorage.app",
  messagingSenderId: "424179260770",
  appId: "1:424179260770:web:2f4a04a8c9643027bca03b",
  measurementId: "G-SFLNYPDQ04"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Export app untuk dipakai di file lain
export { app };
