// File: js/footer.js
// Skrip ini akan secara otomatis membuat dan menambahkan footer ke halaman.

document.addEventListener('DOMContentLoaded', function() {
    // 1. Buat elemen-elemen untuk footer
    const footer = document.createElement('footer');
    const container = document.createElement('div');
    const termsLink = document.createElement('a');
    const privacyLink = document.createElement('a');
    const separator1 = document.createElement('span');
    const separator2 = document.createElement('span');
    const brandText = document.createElement('span');

    // 2. Atur atribut dan konten untuk link Ketentuan Layanan
    termsLink.href = 'https://animasiosd.github.io/beta/terms_of_service.html';
    termsLink.textContent = 'Ketentuan Layanan';
    termsLink.style.color = '#ffffff';
    termsLink.style.textDecoration = 'underline';
    termsLink.style.margin = '0 10px';

    // 3. Atur atribut dan konten untuk link Kebijakan Privasi
    privacyLink.href = 'https://animasiosd.github.io/beta/privacy_policy.html';
    privacyLink.textContent = 'Kebijakan Privasi';
    privacyLink.style.color = '#ffffff';
    privacyLink.style.textDecoration = 'underline';
    privacyLink.style.margin = '0 10px';

    // 4. Atur konten untuk pemisah dan nama brand
    separator1.textContent = '|';
    separator1.style.margin = '0 10px';
    separator2.textContent = '|';
    separator2.style.margin = '0 10px';
    
    brandText.textContent = '© 2025 Cerita Bahasa Daerah';
    brandText.style.margin = '0 10px';

    // 5. Atur style untuk container dan elemen footer utama
    container.className = 'container text-center';
    
    footer.style.backgroundColor = '#212529'; // Warna gelap seperti navbar
    footer.style.color = '#ffffff';
    footer.style.padding = '20px 0';
    footer.style.marginTop = 'auto'; // Mendorong footer ke bawah halaman

    // 6. Gabungkan semua elemen menjadi satu dalam urutan yang benar
    container.appendChild(termsLink);
    container.appendChild(separator1);
    container.appendChild(privacyLink);
    container.appendChild(separator2);
    container.appendChild(brandText);
    footer.appendChild(container);

    // 7. Tambahkan footer ke bagian akhir dari <body>
    document.body.appendChild(footer);

    // 8. (Opsional) Beri sedikit style pada body agar footer selalu di bawah
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.minHeight = '100vh';
});
