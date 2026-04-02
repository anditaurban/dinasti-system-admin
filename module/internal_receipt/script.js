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
    
    // Inject informasi ke Badge
    if (result.detail && result.detail.information) {
      const badge = document.getElementById("receivableInfoBadge");
      if (badge) {
        badge.innerHTML = `<span class="mr-1">💡</span> ${result.detail.information}`;
        badge.classList.remove("hidden");
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
    tableRows += window.rowTemplate(item, index);
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

// Template Baris Tabel
window.rowTemplate = function (item, index, perPage = 10) {
  const statusLabel = item.internal_receivable_status == 1 ? "SELESAI" : "PENDING";
  const statusClass = item.internal_receivable_status == 1 ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100";

  return `
  <tr class="flex flex-col sm:table-row border-b border-slate-100 hover:bg-slate-50 text-sm transition">
    
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
    
    <td class="align-top px-5 py-4 border-r border-slate-100 sm:table-cell cursor-pointer relative group">
      <div class="font-bold text-slate-800 line-clamp-1">${item.project_name || '-'}</div> 
    <div class="text-slate-700 line-clamp-3 leading-relaxed">${item.deskripsi || '-'}</div>
      
       <div class="dropdown-menu hidden fixed w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 text-sm right-0 mt-2 py-1 overflow-hidden group-hover:block">
          <button onclick="event.stopPropagation(); loadModuleContent('internal_receipt', '${item.keuangan_id}', '${item.no_ref || 'Detail'}');"
            class="block w-full text-left px-4 py-2.5 hover:bg-slate-50 transition">
            👁️ View Detail
          </button>
          
          <button onclick="event.stopPropagation(); openReceiptModal(${item.keuangan_id})" 
            class="block w-full text-left px-4 py-2.5 hover:bg-slate-50 transition">
            ✏️ Edit Data
          </button>
          
          <button onclick="event.stopPropagation(); deleteReceiptLokal('${item.keuangan_id}')" 
            class="block w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 transition font-medium">
            🗑 Delete Data
          </button>
        </div>
    </td>

    <td class="align-top px-5 py-4 border-r border-slate-100 sm:table-cell">
        <div class="text-slate-800 font-bold line-clamp-2">${typeof finance === 'function' ? finance(item.nominal) : item.nominal}</div>
    </td>

    <td class="align-middle px-5 py-4 text-center sm:table-cell">
      <span class="text-xs font-extrabold px-3 py-1.5 rounded-full ${statusClass}">
        ${statusLabel}
      </span>
    </td>
  </tr>`;
};


// ==========================================
// 4. FUNGSI MODAL FORM & SUBMIT
// ==========================================
function openReceiptModal(editId = null) {
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
          <form id="receiptDataForm" class="space-y-6" enctype="multipart/form-data">
            
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">Nominal <span class="text-red-500">*</span></label>
                  <input id="receiptFormNominal" name="nominal" type="number" required
                         class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition" placeholder="0">
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">Nominal Percent (%) <span class="text-red-500">*</span></label>
                  <input id="receiptFormNominalPercent" name="nominal_percent" type="number" step="0.01" required
                         class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition" placeholder="0">
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
              <label class="block text-sm font-bold text-slate-700 mb-2">Bukti File <span class="text-red-500">*</span></label>
              <input id="receiptFormFile" name="file" type="file" required
                     class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
            </div>
          </form>
        </div>

        <div class="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 text-sm">
          <button type="button" onclick="closeReceiptModal()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-bold transition">
            Batal
          </button>
          <button type="submit" form="receiptDataForm" id="btnSubmitReceipt" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition flex items-center gap-2">
            Simpan Data
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  loadAkunForReceiptModal();
  
  const formElement = document.getElementById("receiptDataForm");
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
  
  const isEdit = formData.get("keuangan_id") !== "";
  const endpointUrl = isEdit ? `${baseUrl}/edit/internal_receipt` : `${baseUrl}/add/internal_receipt`;

  if (!isEdit) formData.delete("keuangan_id");

  let receivableId = formData.get("internal_receivable_id");
  if (!receivableId || receivableId === "") {
    formData.set("internal_receivable_id", "0"); 
  }

  formData.append("owner_id", typeof owner_id !== "undefined" ? owner_id : "1"); 
  let userId = "4"; 
  try {
    const userSession = JSON.parse(localStorage.getItem("user"));
    if (userSession && userSession.user_id) userId = userSession.user_id;
  } catch (e) {}
  formData.append("user_id", userId);

  const submitBtn = document.getElementById("btnSubmitReceipt");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = "Menyimpan... ⏳";
  submitBtn.disabled = true;

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_TOKEN}` },
      body: formData 
    });

    const textRes = await response.text();
    let result;
    try { result = JSON.parse(textRes); } 
    catch (e) { throw new Error("Server Error 500"); }

    if (response.ok) { 
      closeReceiptModal();
      
      // Menggunakan SweetAlert Success
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data Receipt berhasil disimpan.',
        showConfirmButton: false,
        timer: 1500
      });

      fetchReceiptData(1);
    } else {
      // Menggunakan SweetAlert Error
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: result.message || "Terdapat kesalahan server."
      });
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Terjadi kesalahan jaringan atau server crash!'
    });
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// ==========================================
// 5. FUNGSI DELETE (SweetAlert2 Integration)
// ==========================================
window.deleteReceiptLokal = function(id) {
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
      
      try {
        // Sesuaikan URL endpoint DELETE ini dengan backend kamu (apakah GET, POST, DELETE dsb)
        const response = await fetch(`${baseUrl}/delete/internal_receipt/${id}`, {
          method: "DELETE", // Sesuaikan method
          headers: { "Authorization": `Bearer ${API_TOKEN}` }
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Terhapus!',
            text: 'Data berhasil dihapus.',
            showConfirmButton: false,
            timer: 1500
          });
          fetchReceiptData(1); // Refresh tabel
        } else {
          Swal.fire('Gagal!', 'Terjadi masalah saat menghapus data.', 'error');
        }
      } catch (error) {
        Swal.fire('Error!', 'Gangguan jaringan.', 'error');
      }

    }
  });
};