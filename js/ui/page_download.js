// ======================================================================
// File: js/ui/page_download.js
// Deskripsi: Menangani semua logika UI di halaman download, termasuk
//            rendering tabel, filter, dan sorting.
// ======================================================================

let fullData = [];
let sortKey = '';
let sortAsc = true;

/**
 * Fungsi utama untuk inisialisasi halaman download.
 */
function initializeDownloadPage() {
    const tbody = document.querySelector('#downloadTable tbody');
    tbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

    // ASUMSI: `api_service.fetchDownloadableContent()` ada di 'load_data/api_service.js'
    api_service.fetchDownloadableContent()
        .then(data => {
            fullData = data;
            populateFilters(data);
            renderTable(data);
            setupEventListeners();
        })
        .catch(err => {
            tbody.innerHTML = '<tr><td colspan="3" class="text-danger">Gagal memuat data.</td></tr>';
            console.error(err);
        });
}

/**
 * Mengisi dropdown filter dengan data unik.
 * @param {Array} data 
 */
function populateFilters(data) {
    const bahasaSet = new Set(data.map(item => item.bahasa));
    // ... (logika populate filter lainnya) ...
    // Ini murni manipulasi DOM, jadi tetap di sini.
}

/**
 * Merender data ke dalam tabel HTML.
 * @param {Array} data 
 */
function renderTable(data) {
    const tbody = document.querySelector('#downloadTable tbody');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.bahasa}</td><td>${row.urutan}</td><td>${row.title}</td>`;
        tr.onclick = () => {
            EventTracker.downloadPage.clickDownload(row.bahasa, row.title, row.urutan);
            window.open(row.link_download, '_blank');
        };
        tbody.appendChild(tr);
    });
}

/**
 * Memasang semua event listener untuk filter dan sorting.
 */
function setupEventListeners() {
    document.querySelectorAll('.filter-group select').forEach(select => {
        select.addEventListener('change', applyFiltersAndSort);
    });
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', handleSort);
    });
    document.getElementById('resetFilters').addEventListener('click', () => {
        // ... (reset filter logic) ...
        EventTracker.downloadPage.resetFilter();
        applyFiltersAndSort();
    });
    // ... (event listener untuk reset sort) ...
}

function applyFiltersAndSort() {
    // Logika untuk memfilter dan mengurutkan `fullData` berdasarkan pilihan UI
    // ...
    // Lalu panggil renderTable(filteredData)
}

function handleSort(event) {
    // Logika untuk menentukan sortKey dan sortAsc
    // ...
    EventTracker.downloadPage.sortTable(key, sortAsc ? "asc" : "desc");
    applyFiltersAndSort();
}