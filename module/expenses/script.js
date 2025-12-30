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

  // 3. Logic Tombol Preview File (Tombol Mata di Dropdown)
  let viewProofButton = "";

  // Cek apakah file ada isinya
  if (item.file && item.file !== "null" && item.file !== "") {
    // a. Ambil nama file saja (jaga-jaga jika database menyimpan full path)
    const rawFilename = item.file.split("/").pop();

    // b. Encode spasi dan karakter khusus agar URL valid
    const safeFilename = encodeURIComponent(rawFilename);

    // c. Susun URL sesuai endpoint expenses
    // Format: {{baseUrl}}/file/expenses/NAMA_FILE
    const fileUrl = `${baseUrl}/file/expenses/${safeFilename}`;

    // d. Buat tombol untuk Dropdown
    viewProofButton = `
      <button onclick="event.stopPropagation(); handlePreview('${fileUrl}')" 
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 font-medium transition duration-150 ease-in-out">
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
        
        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow-lg z-50 text-sm right-0 mt-2 py-1">
            
            <button onclick="event.stopPropagation(); handleEdit('${
              item.keuangan_id
            }', '${displayKategori}')" 
                class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 transition duration-150 ease-in-out">
                ✏️ Edit
            </button>

            ${viewProofButton}
            
            <div class="border-t my-1"></div>
            <button onclick="event.stopPropagation(); handleDelete(${
              item.keuangan_id
            })" 
                class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 transition duration-150 ease-in-out">
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
window.handlePreview = async function (fileUrl) {
  // Cek awal: Jika URL kosong/null, beri info santai atau return saja
  if (!fileUrl || fileUrl === "null" || fileUrl.trim() === "") {
    Swal.fire({
      icon: "info",
      title: "Tidak Ada File",
      text: "Transaksi ini tidak memiliki lampiran bukti.",
    });
    return;
  }

  // 1. Tampilkan Loading
  Swal.fire({
    title: "Memuat File...",
    html: "Sedang mengambil data dari server...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 2. Request File
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    // --- VALIDASI RESPONS SERVER (BAGIAN PENTING) ---

    // Kasus 1: File Tidak Ditemukan (404)
    if (response.status === 404) {
      throw new Error("FILE_NOT_FOUND");
    }

    // Kasus 2: Token Salah / Tidak Ada Izin (401 / 403)
    if (response.status === 401 || response.status === 403) {
      throw new Error("UNAUTHORIZED");
    }

    // Kasus 3: Error Lainnya (500, dll)
    if (!response.ok) {
      throw new Error("GENERIC_ERROR");
    }

    // 3. Proses File jika Sukses
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const isPdf =
      fileUrl.toLowerCase().endsWith(".pdf") || blob.type === "application/pdf";

    if (isPdf) {
      // Tampilan PDF
      await Swal.fire({
        title: "Preview Dokumen",
        html: `
          <div style="width:100%; height:500px;">
             <iframe src="${objectUrl}" style="width:100%; height:100%; border:none;"></iframe>
          </div>
          <div style="margin-top:10px;">
             <a href="${objectUrl}" download="dokumen.pdf" class="text-blue-600 hover:underline">⬇️ Download PDF</a>
          </div>
        `,
        width: 800,
        showCloseButton: true,
        showConfirmButton: false,
      });
    } else {
      // Tampilan Gambar
      await Swal.fire({
        title: "Bukti Transaksi",
        html: `
          <div style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
             <img src="${objectUrl}" 
                  alt="Bukti Transaksi" 
                  style="max-width: 100%; max-height: 500px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          </div>
          <div style="margin-top: 15px;">
             <a href="${objectUrl}" download="bukti-transaksi.png" class="text-blue-600 hover:underline font-semibold">
               ⬇️ Download Gambar
             </a>
          </div>
        `,
        width: 650,
        showCloseButton: true,
        showConfirmButton: false,
        background: "#fff",
      });
    }
  } catch (error) {
    console.warn("Preview Info:", error.message);

    // --- PENANGANAN PESAN ERROR SPESIFIK ---

    if (error.message === "FILE_NOT_FOUND") {
      // Validasi Khusus: Jika file tidak ada (404)
      Swal.fire({
        icon: "warning",
        title: "File Tidak Ditemukan",
        text: "File fisik belum diunggah atau sudah dihapus dari server.",
      });
    } else if (error.message === "UNAUTHORIZED") {
      // Validasi Khusus: Jika masalah token
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Sesi login Anda mungkin sudah berakhir. Silakan login ulang.",
      });
    } else {
      // Error Umum (Jaringan putus, Server error, dll)
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat",
        text: "Terjadi kesalahan saat mengunduh file.",
      });
    }
  }
};

// 3. Fungsi Tutup Modal
window.closePreviewModal = function () {
  document.getElementById("filePreviewModal").classList.add("hidden");
};

document.getElementById("addButton").addEventListener("click", () => {
  // showFormModal();
  showCreateExpenseModal();
  // Load kedua dropdown saat tambah baru
  loadAccountOptions();
  loadCategoryOptions();
});

// =========================================================
// NEW FUNCTION: ADD EXPENSE (Updated Logic Account & Category)
// =========================================================

async function showCreateExpenseModal() {
  // 1. Definisikan HTML Form
  const expenseFormHtml = `
    <form id="expenseForm" class="space-y-4 text-left" enctype="multipart/form-data">
      
      <input type="hidden" id="exp_owner_id" name="owner_id" value="${owner_id}">
      <input type="hidden" id="exp_user_id" name="user_id" value="${user_id}">

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
           <input type="date" id="exp_tanggal_transaksi" name="tanggal_transaksi" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
        </div>
        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Request</label>
           <input type="date" id="exp_tanggal_request" name="tanggal_request" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">No. Ref / Kwitansi</label>
           <input type="text" id="exp_no_ref" name="no_ref" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="-">
        </div>
        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
           <select id="exp_kategori" name="kategori" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">Memuat Kategori...</option>
           </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Akun Pembayaran</label>
           <select id="exp_akun" name="akun" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">Memuat Akun...</option>
           </select>
        </div>
        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
           <input type="number" id="exp_nominal" name="nominal" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0" required>
        </div>
      </div>

      <div>
         <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
         <textarea id="exp_deskripsi" name="deskripsi" rows="2" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Keterangan pengeluaran..."></textarea>
      </div>

      <div>
         <label class="block text-sm font-medium text-gray-700 mb-1">Bukti / File</label>
         <input type="file" id="exp_file" name="file" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
         <p class="text-xs text-gray-500 mt-1">*Format: JPG, PNG, PDF (Max 2MB)</p>
      </div>

    </form>
  `;

  // 2. Tampilkan Modal
  Swal.fire({
    title: "Tambah Pengeluaran (Expense)",
    html: expenseFormHtml,
    width: "700px",
    showCancelButton: true,
    confirmButtonText: "Simpan Data",
    cancelButtonText: "Batal",
    didOpen: async () => {
      // A. Set Tanggal Default
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("exp_tanggal_transaksi").value = today;
      document.getElementById("exp_tanggal_request").value = today;

      // -------------------------------------------------------------
      // B. LOAD AKUN (Menggunakan Logika loadAccountOptions kamu)
      // -------------------------------------------------------------
      const akunSelect = document.getElementById("exp_akun");
      try {
        const resAkun = await fetch(`${baseUrl}/list/finance_accounts`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const resultAkun = await resAkun.json();

        let akunOptions = "<option value=''>Pilih Akun</option>";
        if (resAkun.ok && resultAkun.listData) {
          akunOptions += resultAkun.listData
            .map((acc) => {
              return `<option value="${acc.akun_id}">
                    ${acc.nama_akun} - ${acc.number_account} (${acc.owner_account})
                </option>`;
            })
            .join("");
        }
        akunSelect.innerHTML = akunOptions;
      } catch (err) {
        console.error("Gagal load akun:", err);
        akunSelect.innerHTML = "<option value=''>Gagal memuat data</option>";
      }

      // -------------------------------------------------------------
      // C. LOAD KATEGORI (Menggunakan Logika loadCategoryOptions kamu)
      // -------------------------------------------------------------
      const catSelect = document.getElementById("exp_kategori");
      try {
        // Ambil owner_id dari variabel global (karena di script.js sudah ada const owner_id)
        // Atau ambil ulang dari localStorage untuk memastikan
        let currentOwnerId = owner_id;
        if (!currentOwnerId) {
          const userSession = JSON.parse(localStorage.getItem("user") || "{}");
          currentOwnerId = userSession.owner_id;
        }

        if (currentOwnerId) {
          const resCat = await fetch(
            `${baseUrl}/list/expenses_category/${currentOwnerId}`,
            {
              headers: { Authorization: `Bearer ${API_TOKEN}` },
            }
          );
          const resultCat = await resCat.json();

          let catOptions = "<option value=''>Pilih Kategori</option>";
          if (resCat.ok && resultCat.listData) {
            catOptions += resultCat.listData
              .map((cat) => {
                return `<option value="${cat.category}">${cat.category}</option>`;
              })
              .join("");
          }
          catSelect.innerHTML = catOptions;
        } else {
          catSelect.innerHTML =
            "<option value=''>Error: Owner ID Missing</option>";
        }
      } catch (err) {
        console.error("Gagal load kategori:", err);
        catSelect.innerHTML = "<option value=''>Gagal memuat data</option>";
      }
    },
    preConfirm: () => {
      // 3. Validasi & Ambil Data
      const form = document.getElementById("expenseForm");
      const nominal = document.getElementById("exp_nominal").value;
      const akun = document.getElementById("exp_akun").value;
      const kategori = document.getElementById("exp_kategori").value;

      if (!nominal || !akun || !kategori) {
        Swal.showValidationMessage(
          "Mohon lengkapi Kategori, Akun, dan Nominal!"
        );
        return false;
      }

      const formData = new FormData(form);
      formData.set("owner_id", owner_id);
      formData.set("user_id", user_id);

      return formData;
    },
  }).then((result) => {
    if (result.isConfirmed) {
      submitExpenseData(result.value);
    }
  });
}

// =========================================================
// FUNCTION SUBMIT DATA KE API
// =========================================================

async function submitExpenseData(formData) {
  // Tampilkan Loading
  Swal.fire({
    title: "Menyimpan Data...",
    text: "Mohon tunggu sebentar",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // Sesuaikan endpoint dengan Postman kamu
    // Asumsi: baseUrl sudah didefinisikan di script.js / api.js
    const url = `${baseUrl}/add/expenses`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        // PENTING: JANGAN SET 'Content-Type': 'multipart/form-data'
        // Biarkan browser mengaturnya otomatis agar boundary file terbaca
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok || result.status === 200 || result.response === "200") {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data pengeluaran berhasil disimpan.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // Refresh Tabel jika ada di halaman expense
        if (typeof fetchAndUpdateData === "function") {
          fetchAndUpdateData();
        }
      });
    } else {
      throw new Error(result.message || "Gagal menyimpan data");
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Terjadi kesalahan server",
    });
  }
}
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
