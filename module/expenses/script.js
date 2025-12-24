pagemodule = "Internal Expenses";
subpagemodule = "";
renderHeader();
colSpanCount = 9;
setDataType("expenses");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];

  // 1. Cek Data Akun
  let akunDisplay = "-";
  if (item.nama_akun) {
    akunDisplay = `<span class="font-semibold text-blue-600">${item.nama_akun}</span>`;
    if (item.number_account) akunDisplay += ` - ${item.number_account}`;
  }

  // 2. Format Data Lain
  const displayNoRef = item.no_ref || item.no_kwitansi || "-";
  const displayKategori = item.kategori || item.project_name || "-";
  const displayDeskripsi = item.deskripsi || item.keterangan || "-";

  // 3. Logic Tombol Preview File (New Feature)
  // Cek apakah item.file ada isinya (tidak null, tidak undefined, tidak string kosong)
  let previewButtonHtml = "";
  if (item.file && item.file !== "null" && item.file !== "") {
    previewButtonHtml = `
      <button onclick="event.stopPropagation(); handlePreview('${item.file}')" 
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 font-medium">
          👁️ Lihat Bukti
      </button>
    `;
  }

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">    
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Date</span>   
        ${item.tanggal_transaksi}
      </td>
      
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">No. Ref</span>
        ${displayNoRef}
      </td>
    
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Category</span>
        ${displayKategori}
      </td>
    
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Description</span>
        <div class="max-w-xs break-words truncate" title="${displayDeskripsi}">
            ${displayDeskripsi}
        </div>
      </td>

      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Via</span>
        ${item.account}
      </td>

      <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Nominal</span>
        ${finance(item.nominal)}
        
        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow-lg z-50 text-sm right-0 mt-2">
            
            <button onclick="event.stopPropagation(); handleEdit('${
              item.keuangan_id
            }', '${displayKategori}')" 
                class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                ✏️ Edit
            </button>
            
         

            <button onclick="event.stopPropagation(); handleDelete(${
              item.keuangan_id
            })" 
                class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 border-t">
                🗑 Delete
            </button>
        </div>
      </td>
  </tr>`;
};

// --- FITUR PREVIEW FILE ---

// 1. Inject Modal HTML ke dalam body (dijalankan sekali saat script load)
previewModalHtml = `
<div id="filePreviewModal" class="fixed inset-0 z-[100] hidden bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity" onclick="closePreviewModal()">
    <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onclick="event.stopPropagation()">
        
        <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-semibold text-gray-800">Bukti Transaksi</h3>
            <button onclick="closePreviewModal()" class="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div id="previewContent" class="p-4 overflow-auto flex justify-center bg-gray-100 h-full">
            <p class="text-gray-500">Memuat...</p>
        </div>

        <div class="p-4 border-t flex justify-end bg-gray-50">
             <a id="downloadLink" href="#" target="_blank" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2">
                ⬇️ Download / Buka Full
             </a>
        </div>
    </div>
</div>
`;

// Masukkan modal ke body jika belum ada
if (!document.getElementById("filePreviewModal")) {
  document.body.insertAdjacentHTML("beforeend", previewModalHtml);
}

// 2. Fungsi Handle Click Preview
// Fungsi Preview menggunakan SweetAlert2
window.handlePreview = function (url) {
  const ext = url.split(".").pop().toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext);

  if (isImage) {
    // TAMPILAN JIKA GAMBAR (Preview Besar & Jelas)
    Swal.fire({
      imageUrl: url,
      imageAlt: "Bukti Transaksi",
      // Opsi Tampilan
      width: "600px", // Lebar modal pas
      padding: "1em",
      background: "#fff",
      showCloseButton: true,
      showConfirmButton: false, // Hilangkan tombol OK biar fokus ke gambar
      backdrop: `
                rgba(0,0,123,0.4)
            `,
      // Tambahkan tombol download/buka asli di bawah gambar
      footer: `<a href="${url}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1" style="text-decoration:none;">
                🔍 Buka / Download Gambar Asli
            </a>`,
    });
  } else {
    // TAMPILAN JIKA PDF / FILE LAIN
    Swal.fire({
      title: "<strong>Preview File</strong>",
      html: `
                <div class="w-full h-96">
                    <iframe src="${url}" class="w-full h-full border rounded shadow-sm"></iframe>
                </div>
            `,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: "Tutup",
      confirmButtonColor: "#3085d6",
      width: "800px", // Lebih lebar buat PDF
      footer: `<a href="${url}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">
                ⬇️ Download File
            </a>`,
    });
  }
};

// 3. Fungsi Tutup Modal
window.closePreviewModal = function () {
  document.getElementById("filePreviewModal").classList.add("hidden");
};

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  // Load kedua dropdown saat tambah baru
  loadAccountOptions();
  loadCategoryOptions();
});

// Update struktur form sesuai payload baru
formHtml = `
<form id="dataform" class="space-y-3" enctype="multipart/form-data">

  <input type="hidden" id="formOwnerId" name="owner_id">
  <input type="hidden" id="formUserId" name="user_id">
  <input type="hidden" name="tanggal_request" value="">

  <div class="form-group">
      <label for="formTanggal" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal Transaksi</label>
      <input id="formTanggal" name="tanggal_transaksi" type="date" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" required>
  </div>

    <div class="form-group">
      <label for="formNoRef" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">No. Ref / Kwitansi</label>
      <input id="formNoRef" name="no_ref" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="-">
  </div>

 <div class="form-group">
      <label for="formCategory" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Kategori</label>
      <select id="formCategory" name="kategori" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" required>
          <option value="">Pilih Kategori</option>
      </select>
  </div>

  <div class="form-group">
      <label for="formDeskripsi" class="block text-left  text-sm font-medium text-gray-700 dark:text-gray-200">Deskripsi / Keterangan</label>
      <textarea id="formDeskripsi" name="deskripsi" rows="2" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" required></textarea>
  </div>

  <div class="form-group">
    <label for="formAkun" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Akun Pembayaran</label>
    <select id="formAkun" name="akun_id" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" required>
        <option value="">Pilih Akun</option>
    </select>
</div>

  <div class="form-group">
      <label for="formNominal" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Nominal (Rp)</label>
      <input id="formNominal" name="nominal" type="number" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="0" required>
  </div>


  <div class="form-group">
      <label for="formFile" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Bukti Transfer / File</label>
      <input id="formFile" name="file" type="file" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500">
  </div>

</form>
`;
// Fungsi Baru: Load Kategori Expenses
async function loadCategoryOptions(selectedCategoryName = null) {
  const elSelect = document.getElementById("formCategory");
  let catOptions = "<option value=''>Pilih Kategori</option>";

  // Ambil user/owner ID dari localStorage untuk URL
  let currentOwnerId = "";
  const userSessionStr = localStorage.getItem("user");
  if (userSessionStr) {
    const userSession = JSON.parse(userSessionStr);
    currentOwnerId = userSession.owner_id;
  }

  if (!currentOwnerId) {
    console.error("Owner ID not found for categories");
    elSelect.innerHTML = "<option value=''>Error: No Owner ID</option>";
    return;
  }

  try {
    const res = await fetch(
      `${baseUrl}/list/expenses_category/${currentOwnerId}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const result = await res.json();

    if (res.ok && result.listData) {
      catOptions += result.listData
        .map((cat) => {
          // LOGIC: Ambil value category nya langsung (String), bukan ID
          const isSelected =
            selectedCategoryName && cat.category === selectedCategoryName
              ? "selected"
              : "";
          return `<option value="${cat.category}" ${isSelected}>${cat.category}</option>`;
        })
        .join("");
    }
    elSelect.innerHTML = catOptions;
  } catch (err) {
    console.error("❌ Gagal load kategori:", err);
    elSelect.innerHTML = "<option value=''>Gagal memuat data</option>";
  }
}

async function fillFormData(data) {
  let source = data.detail ? data.detail : data;
  const item = Array.isArray(source) ? source[0] : source;

  console.log("🔄 Isi form dengan data:", item);

  // Logic User ID (sama seperti sebelumnya)
  let userId = item.user_id;
  if (!userId || userId == 0 || userId == "0") {
    const userSessionStr = localStorage.getItem("user");
    if (userSessionStr) {
      try {
        const userSession = JSON.parse(userSessionStr);
        userId = userSession.user_id;
      } catch (e) {
        userId = "";
      }
    } else {
      userId = "";
    }
  }

  document.getElementById("formOwnerId").value = item.owner_id ?? "";
  document.getElementById("formUserId").value = userId;

  // Load Akun
  await loadAccountOptions(item.akun_id);

  // Load Kategori (Penting: Kirim nama kategorinya untuk selected state)
  // Mapping: Cek apakah data source menggunakan 'kategori' atau 'project_name'
  const categoryValue = item.kategori || item.project_name || "";
  await loadCategoryOptions(categoryValue);

  document.getElementById("formTanggal").value = item.tanggal_transaksi || "";

  // Mapping Description
  document.getElementById("formDeskripsi").value =
    item.deskripsi || item.keterangan || "";

  document.getElementById("formNominal").value = item.nominal || "";

  // Mapping No Ref
  document.getElementById("formNoRef").value =
    item.no_ref || item.no_kwitansi || "-";
}

requiredFields = [
  // UBAH key 'akun' menjadi 'akun_id'
  { field: "akun_id", message: "Silakan pilih Akun Pembayaran!" },

  { field: "tanggal_transaksi", message: "Tanggal Transaksi wajib diisi!" },
  { field: "kategori", message: "Kategori Expenses wajib dipilih!" },
  { field: "deskripsi", message: "Deskripsi wajib diisi!" },
  { field: "nominal", message: "Nominal wajib diisi!" },
];

function validateFormData(formData) {
  console.log("✅ Validasi Form dimulai...", formData);
  for (const { field, message } of requiredFields) {
    const value = formData.get ? formData.get(field) : formData[field];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      alert(message);
      return false;
    }
  }
  const nominal = formData.get ? formData.get("nominal") : formData["nominal"];
  if (nominal <= 0) {
    alert("Nominal harus lebih dari 0!");
    return false;
  }
  return true;
}

// Fungsi load opsi akun
async function loadAccountOptions(selectedId = null) {
  const elSelect = document.getElementById("formAkun");

  // Default option
  let akunOptions = "<option value=''>Pilih Akun</option>";

  try {
    // URL sesuai contoh yang berhasil kamu berikan
    const res = await fetch(`${baseUrl}/list/finance_accounts`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }, // Pastikan API_TOKEN tersedia
    });

    const result = await res.json();

    if (res.ok && result.listData) {
      // Loop data dan susun string HTML
      akunOptions += result.listData
        .map((acc) => {
          // LOGIC TAMBAHAN: Cek apakah ini akun yang harus dipilih (untuk mode Edit)
          const isSelected =
            selectedId && String(acc.akun_id) === String(selectedId)
              ? "selected"
              : "";

          // Return string option
          return `<option value="${acc.akun_id}" ${isSelected}>
              ${acc.nama_akun} - ${acc.number_account} (${acc.owner_account})
          </option>`;
        })
        .join("");
    }

    // Inject string HTML yang sudah jadi ke dalam element select
    elSelect.innerHTML = akunOptions;
  } catch (err) {
    console.error("❌ Gagal load akun:", err);
    elSelect.innerHTML = "<option value=''>Gagal memuat data</option>";
  }
}

// Tambahkan fungsi ini agar error "is not defined" hilang
window.loadDropdownCall = async function () {
  console.log("Memanggil loadDropdownCall (alias ke loadAccountOptions)...");
  // Kita arahkan supaya dia menjalankan logika load akun yang sudah kita buat
  await loadAccountOptions();
};
