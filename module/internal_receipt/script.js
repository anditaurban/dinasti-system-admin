// ==========================================
// 1. SETUP & INISIALISASI HALAMAN
// ==========================================
pagemodule = "Internal Receipt";
subpagemodule = "";
renderHeader();
colSpanCount = 13; 
setDataType("internal_receipt");

// Delay untuk fetch awal
setTimeout(() => {
  const receivableId = window.currentReceivableId || 0;
  // 1. Panggil Title Information API
  fetchReceivableDetailTitle(receivableId);
  // 2. Load Tabel
  fetchReceiptData(1);
}, 100);

// Event Listener Tombol Add
btnAdd = document.getElementById("addButton");
if (btnAdd) {
  btnAdd.onclick = () => openReceiptModal();
}


// ==========================================
// 2. FUNGSI FETCH TITLE INFORMATION
// ==========================================

async function fetchReceivableDetailTitle(id) {
  if (!id || id == 0) return;
  try {
    const res = await fetch(`${baseUrl}/detail/internal_receivable/${id}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
    });
    const result = await res.json();
    
    if (result.detail) {
      window.currentParentNominal = parseFloat(result.detail.nominal) || 0;
      window.currentRemainingAmount = parseFloat(result.detail.remaining_amount) || 0;
      
      // 🚀 SIMPAN NAMA PROJECT DARI PARENT SEBAGAI CADANGAN
      window.currentProjectName = result.detail.project_name || result.detail.nama_project || '';

      if (result.detail.information) {
        const badge = document.getElementById("receivableInfoBadge");
        if (badge) {
          badge.innerHTML = `<span class="mr-1">💡</span> ${result.detail.information}`;
          badge.classList.remove("hidden");
        }
      }
    }
  } catch (error) {
    console.warn("Gagal mengambil title info detail:", error);
  }
}

// ==========================================
// 3. FUNGSI FETCH & RENDER TABEL (Dengan Loading)
// ==========================================
async function fetchReceiptData(page = 1) {
  let receivableId = window.currentReceivableId || 0; 
  const tbody = document.getElementById("tableBody");

  // --- MUNCULKAN LOADING ANIMATION ---
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-16">
          <div class="flex justify-center items-center space-x-2">
            <div class="w-3 h-3 rounded-full animate-pulse bg-indigo-500"></div>
            <div class="w-3 h-3 rounded-full animate-pulse bg-indigo-500" style="animation-delay: 0.2s"></div>
            <div class="w-3 h-3 rounded-full animate-pulse bg-indigo-500" style="animation-delay: 0.4s"></div>
          </div>
          <p class="mt-3 text-slate-500 text-sm font-medium">Sedang memuat data...</p>
        </td>
      </tr>`;
  }

  try {
    const response = await fetch(`${baseUrl}/table/internal_receipt/${receivableId}/${page}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    renderReceiptTable(data, page); 
    
  } catch (error) {
    console.error("Gagal memuat data tabel:", error);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Gagal mengambil data dari server.</td></tr>`;
    }
  }
}

function renderReceiptTable(data, page) {
  const tbody = document.getElementById("tableBody");
  const infoText = document.getElementById("infoText");
  const pagination = document.getElementById("pagination");

  if (!tbody) return;
  tbody.innerHTML = "";

  const listData = data.tableData || [];

  if (listData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-12 text-slate-500">
          <div class="text-4xl mb-2 opacity-50">📂</div>
          <p class="font-medium">Belum ada data Internal Receipt.</p>
        </td>
      </tr>`;
    
    if (infoText) infoText.textContent = "Menampilkan 0 data";
    if (pagination) pagination.innerHTML = "";
    return;
  }

  let tableRows = "";
  listData.forEach((item, index) => {
    tableRows += rowTemplat(item, index);
  });
  
  tbody.innerHTML = tableRows;

  if (infoText) {
    const totalData = data.totalRecords || listData.length;
    infoText.textContent = `Menampilkan halaman ${page} (Total: ${totalData} data)`;
  }

  if (pagination && typeof renderPagination === "function") {
    try { renderPagination(data, page); } catch (e) {}
  }
}

function rowTemplat(item, index, perPage = 10) {
  const statusLabel = item.internal_receivable_status == 1 ? "SELESAI" : "PENDING";
  const statusClass = item.internal_receivable_status == 1 ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100";

  const previewFileAction = item.file ? `
        <button type="button" onclick="openPreviewModal('${item.file}'); closeAllDropdowns()" 
                class="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors flex items-center gap-2">
          📄 Lihat Bukti
        </button>
  ` : '';

  return `
  <tr class="flex flex-col sm:table-row border-b border-slate-100 hover:bg-slate-50 text-sm transition relative">
    
    <td class="align-top px-5 py-4 border-r border-slate-100 sm:table-cell">
       <div class="font-bold text-slate-800 line-clamp-1">${item.tanggal_transaksi || '-'}</div>
       <div class="text-xs text-slate-500 mt-1 uppercase tracking-wider">Ref: ${item.no_ref || '-'}</div>
    </td>

    <td class="align-top px-5 py-4 border-r border-slate-100 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-bold text-slate-800 line-clamp-1">${item.account || '-'}</div>
        <div class="text-xs text-slate-600">${item.owner_account || '-'}</div>
        <div class="text-xs text-slate-500 font-mono">No: ${item.number_account || '-'}</div>
      </div>
    </td>
    
    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="font-bold text-slate-800 line-clamp-1">${item.project_name || '-'}</div> 
      <div class="text-slate-700 line-clamp-3 leading-relaxed">${item.deskripsi || '-'}</div>
    </td>

    <td class="align-top px-5 py-4 border-r border-slate-100 sm:table-cell">
        <div class="text-slate-800 font-bold line-clamp-2">${typeof finance === 'function' ? finance(item.nominal) : item.nominal}</div>
    </td>

    

    <td class="align-middle px-5 py-4 text-center sm:table-cell">
      <button type="button" onclick="event.stopPropagation(); togleDropdown('dropdown-${item.keuangan_id}')" 
              class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
        </svg>
      </button>

      <div id="dropdown-${item.keuangan_id}" 
           class="dropdown-menu hidden absolute right-full mr-2 bottom-0 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] text-sm py-2 text-left origin-bottom-right transition-all">
        
        ${previewFileAction}
        
        <button type="button" onclick="openReceiptModal(${item.keuangan_id}); closeAllDropdowns()" 
                class="w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors flex items-center gap-2">
          ✏️ Edit
        </button>
        
        <button type="button" onclick="deleteReceiptLokal('${item.keuangan_id}'); closeAllDropdowns()"
                class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors flex items-center gap-2">
          🗑 Hapus
        </button>
      </div>
    </td>
  </tr>`;
}

// ==========================================
// FUNGSI MODAL PREVIEW FILE (GAMBAR VIA FETCH BLOB)
// ==========================================
async function openPreviewModal(fileUrl) {
  // Hapus modal lama jika ada
  const existingModal = document.getElementById("previewModalOverlay");
  if (existingModal) existingModal.remove();

  // Buat HTML Modal dengan state Loading
  const modalHTML = `
    <div id="previewModalOverlay" class="fixed inset-0 bg-slate-900 bg-opacity-75 z-[60] flex justify-center items-center px-4 backdrop-blur-sm" onclick="closePreviewModal()">
      
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onclick="event.stopPropagation()">
        
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 class="text-lg font-extrabold text-slate-800">Preview Bukti Receipt</h2>
          <button type="button" onclick="closePreviewModal()" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition leading-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-auto flex-1 flex flex-col justify-center items-center bg-slate-200/50 min-h-[50vh] relative">
          
          <div id="previewLoading" class="flex flex-col items-center">
             <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             <p class="mt-3 text-slate-500 font-medium">Memuat gambar rahasia...</p>
          </div>

          <div id="previewError" class="hidden flex-col items-center text-center">
             <p class="text-4xl mb-2">❌</p>
             <p class="text-red-500 font-medium">Akses ditolak atau file tidak ditemukan.</p>
          </div>

          <img id="previewImageResult" 
               alt="Bukti File" 
               class="hidden max-w-full max-h-[60vh] object-contain rounded-lg shadow-md transition-opacity duration-300">
        </div>

        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 text-sm">
          <button type="button" onclick="downloadSecureFile('${fileUrl}')" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition items-center gap-2 flex">
            ⬇️ Download File
          </button>
          <button type="button" onclick="closePreviewModal()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-bold transition">
            Tutup
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Mulai proses fetch gambar dengan Token
  const loadingEl = document.getElementById("previewLoading");
  const errorEl = document.getElementById("previewError");
  const imgEl = document.getElementById("previewImageResult");

  try {
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
    });

    if (!response.ok) throw new Error("Gagal memuat gambar");

    // Ubah response menjadi Blob
    const imageBlob = await response.blob();
    // Buat URL lokal sementara dari Blob tersebut
    const imageObjectURL = URL.createObjectURL(imageBlob);

    // Set URL lokal ke img src
    imgEl.src = imageObjectURL;
    
    // Simpan object URL di element untuk dibersihkan nanti saat modal ditutup
    imgEl.dataset.blobUrl = imageObjectURL;

    // Tampilkan gambar, sembunyikan loading
    loadingEl.classList.add("hidden");
    imgEl.classList.remove("hidden");

  } catch (error) {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
    errorEl.classList.add("flex");
  }
}

function closePreviewModal() {
  const modal = document.getElementById("previewModalOverlay");
  if (modal) {
    // Bersihkan memory browser dari URL Blob sebelum menghapus modal
    const imgEl = document.getElementById("previewImageResult");
    if (imgEl && imgEl.dataset.blobUrl) {
      URL.revokeObjectURL(imgEl.dataset.blobUrl);
    }
    modal.remove();
  }
}

// Fungsi untuk mendownload file yang butuh Bearer Token
async function downloadSecureFile(fileUrl) {
  try {
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
    });

    if (!response.ok) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Gagal mengunduh file', showConfirmButton: false, timer: 2000 });
        return;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Buat elemen <a> sementara untuk men-trigger download
    const a = document.createElement("a");
    a.href = blobUrl;
    
    // Ambil nama file dari URL asli
    const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1) || "downloaded_file.png";
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    
    // Bersihkan
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

  } catch (error) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Terjadi kesalahan jaringan', showConfirmButton: false, timer: 2000 });
  }
}

// ==========================================
// LOGIKA DROPDOWN AKSI
// ==========================================

// Fungsi untuk membuka/menutup dropdown tertentu
function togleDropdown(dropdownId) {
  const menu = document.getElementById(dropdownId);
  const isHidden = menu.classList.contains("hidden");

  // Tutup semua dropdown terlebih dahulu
  closeAllDropdowns();

  // Jika sebelumnya hidden, maka buka (hilangkan class hidden)
  if (isHidden) {
    menu.classList.remove("hidden");
  }
}

// Fungsi untuk menutup semua dropdown
function closeAllDropdowns() {
  const allDropdowns = document.querySelectorAll(".dropdown-menu");
  allDropdowns.forEach(dropdown => {
    dropdown.classList.add("hidden");
  });
}

// Event listener global: Tutup dropdown jika klik di sembarang tempat (di luar dropdown)
document.addEventListener("click", function(event) {
  // Jika yang diklik bukan bagian dari tombol dropdown atau menu itu sendiri
  if (!event.target.closest('.dropdown-menu') && !event.target.closest('button[onclick*="togleDropdown"]')) {
    closeAllDropdowns();
  }
});


// ==========================================
// 4. FUNGSI MODAL FORM & SUBMIT
// ==========================================
async function openReceiptModal(editId = null) {
  const existingModal = document.getElementById("receiptModalOverlay");
  if (existingModal) existingModal.remove();

  const isEdit = editId !== null;
  const modalTitle = isEdit ? "Edit Internal Receipt" : "Tambah Internal Receipt";

  const modalHTML = `
    <div id="receiptModalOverlay" class="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center px-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 class="text-xl font-extrabold text-slate-800">${modalTitle}</h2>
          <button type="button" onclick="closeReceiptModal()" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition leading-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div id="modalLoading" class="${isEdit ? 'block' : 'hidden'} text-center py-8">
             <div class="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
             <p class="mt-2 text-slate-500 text-sm">Mengambil data...</p>
          </div>

          <form id="receiptDataForm" class="${isEdit ? 'hidden' : 'block'} space-y-6" enctype="multipart/form-data">
            
            <input type="hidden" id="formKeuanganId" name="keuangan_id" value="${isEdit ? editId : ''}">
            <input type="hidden" id="formReceivableId" name="internal_receivable_id" value="${window.currentReceivableId || ''}">
            
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Akun Pembayaran <span class="text-red-500">*</span></label>
              <select id="receiptFormAkun" name="akun_id" required
                      class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition appearance-none bg-no-repeat bg-right pr-10"
                      style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E'); background-size: 1.25rem;">
                <option value=''>-- Memuat Akun --</option>
              </select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">Tanggal Transaksi <span class="text-red-500">*</span></label>
                  <input id="receiptFormTanggal" name="tanggal_transaksi" type="date" required
                         class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition">
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">No. Kwitansi <span class="text-red-500">*</span></label>
                  <input id="receiptFormNoKwitansi" name="no_kwitansi" type="text" required
                         class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition" placeholder="Contoh: KWT-001">
                </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Nominal Pembayaran <span class="text-red-500">*</span></label>
              <div class="flex items-center gap-3">
                
                <input id="receiptFormNominalPercent" name="nominal_percent" type="number" step="0.01" required
                       class="w-24 sm:w-28 px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition text-center placeholder-slate-400 font-semibold" placeholder="%">
                
                <span class="text-slate-400 font-bold text-lg">%</span>
                
                <div class="relative flex-1">
                   <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                   
                   <input type="hidden" id="receiptFormNominalReal" name="nominal">
                   
                   <input id="receiptFormNominalDisplay" type="text" required autocomplete="off"
                          class="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition text-right font-bold text-slate-700 text-lg" placeholder="0">
                </div>
              </div>

              <div class="flex justify-between items-center mt-2">
                <p id="maxNominalInfo" class="text-[11px] text-slate-500 font-medium"></p>
                <p id="remainingAmountInfo" class="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100"></p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Project Name <span class="text-red-500">*</span></label>
              <input id="receiptFormProjectName" name="project_name" type="text" required
                     class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition" placeholder="Nama project...">
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Keterangan <span class="text-red-500">*</span></label>
              <textarea id="receiptFormKeterangan" name="keterangan" rows="3" required
                        class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition" 
                        placeholder="Masukkan keterangan receipt..."></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Bukti File <span class="${isEdit ? 'hidden' : 'text-red-500'}">*</span></label>
              <input id="receiptFormFile" name="file" type="file" ${isEdit ? '' : 'required'}
                     class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
              ${isEdit ? '<p class="mt-1 text-xs text-amber-600">Opsional: Biarkan kosong jika tidak ingin mengubah file bukti sebelumnya.</p>' : ''}
            </div>
          </form>
        </div>

        <div class="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 text-sm">
          <button type="button" onclick="closeReceiptModal()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-bold transition">
            Batal
          </button>
          <button type="submit" form="receiptDataForm" id="btnSubmitReceipt" class="${isEdit ? 'hidden' : 'flex'} px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition items-center gap-2">
            Simpan Data
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const formElement = document.getElementById("receiptDataForm");
  const loadingElement = document.getElementById("modalLoading");
  const btnSubmit = document.getElementById("btnSubmitReceipt");

  const formProjectName = document.getElementById("receiptFormProjectName");
  if (formProjectName) {
    formProjectName.value = window.currentProjectName || '';
  }

  // ========================================================
  // 🚀 LOGIKA SINKRONISASI NOMINAL (FORMAT RIBUAN) DAN PERSEN
  // ========================================================
  const inputNominalReal = document.getElementById("receiptFormNominalReal");
  const inputNominalDisplay = document.getElementById("receiptFormNominalDisplay");
  const inputPercent = document.getElementById("receiptFormNominalPercent");
  
  const maxNominalInfo = document.getElementById("maxNominalInfo");
  const remainingAmountInfo = document.getElementById("remainingAmountInfo");
  
  const maxNominal = window.currentParentNominal || 0;
  let limitNominalAllowed = window.currentRemainingAmount || maxNominal; 

  // Helper Format Ribuan (menggunakan titik)
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID').format(angka);
  };

  const updateHelperText = (limitVal) => {
    if (maxNominal > 0) {
      maxNominalInfo.innerHTML = `Total: Rp ${formatRupiah(maxNominal)}`;
      remainingAmountInfo.innerHTML = `Sisa: Rp ${formatRupiah(limitVal)}`;
    }
  };

  if (!isEdit) updateHelperText(limitNominalAllowed);

  if (maxNominal > 0) {
    // 1. Jika User Mengetik di Input Display
    inputNominalDisplay.addEventListener("input", function(e) {
      // Hapus semua karakter selain angka
      let rawString = this.value.replace(/[^0-9]/g, '');
      let val = parseInt(rawString) || 0;
      
      // Cegah melebihi batas SISA PEMBAYARAN
      if (val > limitNominalAllowed) {
        val = limitNominalAllowed;
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Nominal melebihi sisa pembayaran', showConfirmButton: false, timer: 1500 });
      }

      // Update isi input (Display Format & Real Value)
      this.value = val === 0 ? '' : formatRupiah(val);
      inputNominalReal.value = val;
      
      // Kalkulasi persen
      let pct = (val / maxNominal) * 100;
      inputPercent.value = Number.isInteger(pct) ? pct : pct.toFixed(2);
    });

    // 2. Jika User Mengetik di Input Persentase
    inputPercent.addEventListener("input", function() {
      let pct = parseFloat(this.value) || 0;
      let val = Math.round((pct / 100) * maxNominal);

      // Cegah melebihi SISA PEMBAYARAN
      if (val > limitNominalAllowed) {
        val = limitNominalAllowed;
        pct = (val / maxNominal) * 100; 
        this.value = Number.isInteger(pct) ? pct : pct.toFixed(2);
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Persentase melebihi sisa pembayaran', showConfirmButton: false, timer: 1500 });
      }
      
      // Update isi input (Display Format & Real Value)
      inputNominalDisplay.value = val === 0 ? '' : formatRupiah(val);
      inputNominalReal.value = val;
    });
  }

  // ========================================================
  // 🚀 LOGIKA FETCH DATA UNTUK MODE EDIT
  // ========================================================
  if (isEdit) {
    try {
      const res = await fetch(`${baseUrl}/detail/internal_receipt/${editId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      });
      const result = await res.json();
      
      if (res.ok && result.detail) {
        const data = result.detail;
        
        const sisaDariAPI = parseFloat(data.remaining_amount) || window.currentRemainingAmount;
        const nominalReceiptIni = parseFloat(data.nominal) || 0;
        limitNominalAllowed = sisaDariAPI + nominalReceiptIni;
        updateHelperText(limitNominalAllowed);

        document.getElementById("receiptFormTanggal").value = data.tanggal_transaksi || '';
        document.getElementById("receiptFormNoKwitansi").value = data.no_kwitansi || data.no_ref || ''; 
        
        // 🚀 Set Nilai Real dan Display Format saat load data
        inputNominalReal.value = nominalReceiptIni;
        inputNominalDisplay.value = nominalReceiptIni === 0 ? '' : formatRupiah(nominalReceiptIni);
        
        document.getElementById("receiptFormNominalPercent").value = data.nominal_percent || '';
        
        if (data.project_name) {
          formProjectName.value = data.project_name;
        }

        document.getElementById("receiptFormKeterangan").value = data.keterangan || '';
        
        await loadAkunForReceiptModal(data.akun || data.akun_id);
      } else {
        throw new Error(result.message || "Data tidak ditemukan");
      }
    } catch (error) {
      Swal.fire('Error', 'Gagal memuat data lama dari server.', 'error');
      closeReceiptModal();
      return;
    } finally {
      loadingElement.classList.add('hidden');
      formElement.classList.remove('hidden');
      btnSubmit.classList.remove('hidden');
      btnSubmit.classList.add('flex');
    }
  } else {
    loadAkunForReceiptModal();
  }

  formElement.addEventListener("submit", submitReceiptDataLokal);
}

function closeReceiptModal() {
  const modal = document.getElementById("receiptModalOverlay");
  if (modal) modal.remove();
}

async function loadAkunForReceiptModal(selectedId = null) {
  const elSelect = document.getElementById("receiptFormAkun");
  if (!elSelect) return;

  try {
    const res = await fetch(`${baseUrl}/list/finance_accounts`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }, 
    });
    const result = await res.json();
    let akunOptions = "<option value=''>-- Pilih Akun --</option>";

    if (res.ok && result.listData) {
      akunOptions += result.listData.map((acc) => {
          const isSelected = selectedId && String(acc.akun_id) === String(selectedId) ? "selected" : "";
          return `<option value="${acc.akun_id}" ${isSelected}>${acc.nama_akun} - ${acc.number_account} (${acc.owner_account})</option>`;
        }).join("");
    }
    elSelect.innerHTML = akunOptions;
  } catch (err) {
    elSelect.innerHTML = "<option value=''>Gagal memuat data</option>";
  }
}

async function submitReceiptDataLokal(event) {
  event.preventDefault(); 
  const form = document.getElementById("receiptDataForm");
  const formData = new FormData(form);
  
  const keuanganId = formData.get("keuangan_id");
  const isEdit = keuanganId !== "";
  
  const endpointUrl = isEdit ? `${baseUrl}/update/internal_receipt/${keuanganId}` : `${baseUrl}/add/internal_receipt`;
  const fetchMethod = isEdit ? "PUT" : "POST";

  // 1. Bersihkan Payload ID (HANYA keuangan_id yang dibuang, internal_receivable_id TETAP DIKIRIM)
  formData.delete("keuangan_id");

  // 2. Tangani File Upload (Jangan kirim file kosong saat mode Edit/PUT)
  const fileField = formData.get("file");
  if (isEdit && (!fileField || fileField.size === 0)) {
    formData.delete("file");
  }

  // 3. Set owner_id dan user_id
  formData.set("owner_id", typeof owner_id !== "undefined" ? owner_id : "1"); 
  let userId = "4"; 
  try {
    const userSession = JSON.parse(localStorage.getItem("user"));
    if (userSession && userSession.user_id) userId = userSession.user_id;
  } catch (e) {}
  formData.set("user_id", userId);

  const submitBtn = document.getElementById("btnSubmitReceipt");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = "Menyimpan... ⏳";
  submitBtn.disabled = true;

  try {
    const response = await fetch(endpointUrl, {
      method: fetchMethod, 
      headers: { "Authorization": `Bearer ${API_TOKEN}` },
      body: formData 
    });

    const textRes = await response.text();
    let result;
    try { result = JSON.parse(textRes); } 
    catch (e) { throw new Error("Server Error 500"); }

    if (response.ok) { 
      closeReceiptModal();
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: isEdit ? 'Data Receipt berhasil diperbarui.' : 'Data Receipt berhasil ditambahkan.',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        // Tampilkan pesan error asli dari backend agar kita tahu kalau ada masalah lain
        text: result.message || "Terdapat kesalahan di sisi server." 
      });
    }
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Terjadi kesalahan jaringan atau server crash!'
    });
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    fetchReceiptData(1);
  }
}

// ==========================================
// 5. FUNGSI DELETE (SweetAlert2 Integration)
// ==========================================
async function deleteReceiptLokal(id) {
  Swal.fire({
    title: 'Hapus Data?',
    text: "Data receipt ini akan dihapus secara permanen!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true
  }).then(async (result) => {
    if (result.isConfirmed) {
      
      Swal.fire({
        title: 'Menghapus...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const response = await fetch(`${baseUrl}/delete/internal_receipt/${id}`, {
          method: "PUT", // Pastikan metode API-mu memang PUT
          headers: { 
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json"
          }
        });

        let resData = {};
        try { resData = await response.json(); } catch (e) {}

        if (response.ok) {
          // 🚀 PERBAIKAN: Gunakan AWAIT agar nunggu pop-up selesai
          await Swal.fire({
            icon: 'success',
            title: 'Terhapus!',
            text: resData.message || 'Data berhasil dihapus.',
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          await Swal.fire(
            'Gagal!', 
            resData.message || 'Terjadi masalah saat menghapus data di server.', 
            'error'
          );
        }
      } catch (error) {
        console.error("Gagal Delete:", error);
        await Swal.fire('Error!', 'Gangguan jaringan atau server tidak merespon.', 'error');
      } finally {
        // 🚀 Tabel di-reload SETELAH semua animasi alert beres
        fetchReceiptData(1);
      }

    }
  });
}