// ======================================================================
// File: js/ui/page_download.js
// Deskripsi: Menangani semua logika UI di halaman download:
//            merender tabel, filter, dan sorting.
// Asal Kode: download.html (inline script)
// ======================================================================
import { api_service } from '../load_data/api_service.js';
import { EventTracker } from '../events.js';

let fullData = [];
let sortKey = '';
let sortAsc = true;

/**
 * Fungsi utama untuk inisialisasi halaman download.
 */
export async function initializeDownloadPage() {
    const tbody = document.querySelector('#downloadTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Memuat data...</td></tr>';

    try {
        const data = await api_service.fetchDownloadableContent();
        
        if (data && data.length > 0) {
            fullData = data;
            populateFilters(data);
            renderTable(data);
            setupEventListeners();

            // ✅ Sembunyikan loader, tampilkan konten
            document.getElementById('page-loader').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
        } else {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Data kosong.</td></tr>';
        }
    } catch (err) {
        console.error("❌ Gagal memuat data:", err);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Gagal memuat data.</td></tr>';
    }
}

function populateFilters(data) {
    const bahasaSet = new Set(data.map(item => item.bahasa));
    const urutanSet = new Set(data.map(item => item.urutan));
    const judulSet = new Set(data.map(item => item.title));

    populateSelect('filterBahasa', [...bahasaSet].sort());
    populateSelect('filterUrutan', [...urutanSet].sort((a, b) => a - b));
    populateSelect('filterJudul', [...judulSet].sort());
}

function populateSelect(id, items) {
    const select = document.getElementById(id);
    select.length = 1; // Hapus opsi lama kecuali yang pertama
    items.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    });
}

function renderTable(data) {
    const tbody = document.querySelector('#downloadTable tbody');
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Tidak ada data yang cocok dengan filter.</td></tr>';
        return;
    }
    
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

function applyFiltersAndSort() {
    const bahasa = document.getElementById('filterBahasa').value;
    const urutan = document.getElementById('filterUrutan').value;
    const judul = document.getElementById('filterJudul').value;

    let filteredData = fullData.filter(item => 
        (!bahasa || item.bahasa === bahasa) &&
        (!urutan || item.urutan.toString() === urutan) &&
        (!judul || item.title === judul)
    );

    if (sortKey) {
        filteredData.sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });
    }
    renderTable(filteredData);
}

function handleSort(event) {
    const key = event.target.getAttribute('data-key');
    if (!key) return;

    if (sortKey === key) {
        sortAsc = !sortAsc;
    } else {
        sortKey = key;
        sortAsc = true;
    }
    
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
        if (th.getAttribute('data-key') === sortKey) {
            th.classList.add(sortAsc ? 'asc' : 'desc');
        }
    });

    EventTracker.downloadPage.sortTable(key, sortAsc ? "asc" : "desc");
    applyFiltersAndSort();
}

function setupEventListeners() {
    document.getElementById('filterBahasa').addEventListener('change', (e) => {
        EventTracker.downloadPage.filterByBahasa(e.target.value);
        applyFiltersAndSort();
    });
    document.getElementById('filterUrutan').addEventListener('change', (e) => {
        EventTracker.downloadPage.filterByUrutan(e.target.value);
        applyFiltersAndSort();
    });
    document.getElementById('filterJudul').addEventListener('change', (e) => {
        EventTracker.downloadPage.filterByJudul(e.target.value);
        applyFiltersAndSort();
    });
    
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', handleSort);
    });
    
    document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('filterBahasa').value = '';
        document.getElementById('filterUrutan').value = '';
        document.getElementById('filterJudul').value = '';
        EventTracker.downloadPage.resetFilter();
        applyFiltersAndSort();
    });
    
    document.getElementById('resetSort').addEventListener('click', () => {
        sortKey = '';
        sortAsc = true;
        document.querySelectorAll('th.sortable').forEach(th => th.classList.remove('asc', 'desc'));
        EventTracker.downloadPage.resetSort();
        applyFiltersAndSort();
    });
}