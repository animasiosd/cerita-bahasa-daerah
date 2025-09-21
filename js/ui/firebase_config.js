// Import modul firebase app
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCsWkjQp6LxyZX6NZ9Z4rlnY4ygKHJDspU",
  authDomain: "ceritabahasadaerah.firebaseapp.com",
  databaseURL: "https://ceritabahasadaerah-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ceritabahasadaerah",
  storageBucket: "ceritabahasadaerah.firebasestorage.app",
  messagingSenderId: "619825814461",
  appId: "1:619825814461:web:c4b6a51097fc8648d650d4",
  measurementId: "G-ENLD2274X0"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Export app untuk dipakai di file lain
export { app };
