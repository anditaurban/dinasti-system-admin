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
        <div class="flex flex-col gap-1">
        <div class="text-xs text-gray-500">Pay.Req <span class="text-gray-900">${
          item.tanggal_request
        }</span></div>
        <div class="text-xs text-gray-500">Paid <span class="text-gray-900">${
          item.tanggal_transaksi
        }</span></div>
      </div>
      </td>
      
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">No. Ref</span>
        ${displayNoRef}
      </td>
    
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Category</span>
        ${displayKategori}
      </td>

      <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Nominal</span>
        ${finance(item.nominal)}
        
        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow-lg z-50 text-sm right-0 mt-2 py-1">
            
<button onclick="event.stopPropagation(); showExpenseModal('${
    item.keuangan_id
  }')"
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
    
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Description</span>
        <div class="max-w-xs break-words truncate" title="${displayDeskripsi}">
            ${displayDeskripsi}
        </div>
      </td>

      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Bank Account</span>
        ${
          item.account !== "-"
            ? `<span class="font-semibold">${item.account} (${item.number_account})</span>`
            : "-"
        }
        <br>
        <span class="text-xs text-gray-500">${
          item.owner_account !== "-" ? item.owner_account : ""
        }</span>
      </td>
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Status</span>   
        ${item.status || "Paid"}
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
  showExpenseModal();
  // Load kedua dropdown saat tambah baru
  loadAccountOptions();
  loadCategoryOptions();
});

async function showExpenseModal(id = null) {
  const isEdit = id !== null;

  // 1. Loading Data Awal
  Swal.fire({
    title: "Memuat Data...",
    html: "Sedang mengambil data akun & kategori...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 2. Fetch Data Paralel
    const requests = [
      fetch(`${baseUrl}/list/finance_accounts`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      fetch(`${baseUrl}/list/expenses_category/${owner_id}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
    ];

    if (isEdit) {
      requests.push(
        fetch(`${baseUrl}/detail/expenses/${id}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        }),
      );
    }

    const responses = await Promise.all(requests);
    const akunData = await responses[0].json();
    const katData = await responses[1].json();

    let detailData = {};
    if (isEdit) {
      const detailRes = await responses[2].json();
      detailData = detailRes.detail || {};
    }

    // 3. Siapkan Value Default
    const valNoRef = detailData.no_ref || "";
    const valTglTransaksi =
      detailData.tanggal_transaksi || new Date().toISOString().split("T")[0];
    const valTglRequest =
      detailData.tanggal_request || new Date().toISOString().split("T")[0];

    // FORMAT NOMINAL SAAT EDIT:
    // Jika data dari DB 25000, kita ubah jadi format rupiah (25.000) agar enak dilihat saat form dibuka
    // Pastikan fungsi finance() atau sejenisnya tersedia, jika tidak biarkan raw
    let valNominal = detailData.nominal || "";
    // Opsional: jika Anda punya fungsi format rupiah manual, bisa dipasang di sini.
    // Contoh sederhana regex ribuan:
    if (valNominal)
      valNominal = valNominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    const valDeskripsi = detailData.deskripsi || "";
    const valFile = detailData.file || "";
    const selectedAkunId = detailData.akun_id || "";
    const selectedKategori = detailData.kategori || "";

    // 4. Susun HTML Opsi Akun
    let akunOptionsHtml = `<option value="">-- Pilih Akun --</option>`;
    if (akunData.listData) {
      akunData.listData.forEach((acc) => {
        const realId = acc.akun_id || acc.account_id || acc.id;
        const isSelected =
          isEdit && String(realId) === String(selectedAkunId) ? "selected" : "";
        akunOptionsHtml += `<option value="${realId}" ${isSelected}>
                              ${acc.nama_akun} - ${acc.number_account}
                            </option>`;
      });
    }

    // 5. Susun HTML Opsi Kategori
    let katOptionsHtml = `<option value="">-- Pilih Kategori --</option>`;
    if (katData.listData) {
      katData.listData.forEach((cat) => {
        const isSelected =
          isEdit && cat.category === selectedKategori ? "selected" : "";
        katOptionsHtml += `<option value="${cat.category}" ${isSelected}>${cat.category}</option>`;
      });
    }

    Swal.close();

    // 6. Form HTML
    const modalTitle = isEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran";
    const btnText = isEdit ? "Update Data" : "Simpan Data";

    const formHtml = `
      <form id="expenseForm" class="space-y-4 text-left" enctype="multipart/form-data">
        <input type="hidden" name="owner_id" value="${
          detailData.owner_id || owner_id
        }">
        <input type="hidden" name="user_id" value="${
          detailData.user_id || user_id
        }">
        ${
          isEdit
            ? `<input type="hidden" name="existing_file" value="${valFile}">`
            : ""
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Pengajuan <span class="text-red-500">*</span></label>
             <input type="date" name="tanggal_request" value="${valTglRequest}" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
          </div>
          <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
             <input type="date" name="tanggal_transaksi" value="${valTglTransaksi}" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" >
          </div>
          
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">No. Ref / Kwitansi <span class="text-red-500">*</span></label>
             <input type="text" name="no_ref" value="${valNoRef}" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="-">
          </div>
          <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Kategori <span class="text-red-500">*</span></label>
             <select id="input_kategori" name="kategori" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                ${katOptionsHtml}
             </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Akun Pembayaran <span class="text-red-500">*</span></label>
             <select id="input_akun" name="akun_id" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                ${akunOptionsHtml}
             </select>
          </div>
          <div>
             <label class="block text-sm font-medium text-gray-700 mb-1"> Total Amount <span class="text-red-500">*</span></label>
             <input type="text" name="nominal" value="${valNominal}" onkeyup="formatCurrencyInput(this)" class="formatNumber w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0" required>
          </div>
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi <span class="text-red-500">*</span></label>
           <textarea name="deskripsi" rows="2" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Keterangan...">${valDeskripsi}</textarea>
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Bukti / File</label>
           ${
             isEdit && valFile && valFile !== "-"
               ? `<p class="text-xs text-blue-600 mb-1">File saat ini: ${valFile
                   .split("/")
                   .pop()}</p>`
               : ""
           }
           <input type="file" name="file" class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
           <p class="text-xs text-gray-500 mt-1">*Maksimal 2MB</p>
        </div>
      </form>
    `;

    // 7. Render SweetAlert dengan PRECONFIRM yang SUDAH DIPERBAIKI
    Swal.fire({
      title: modalTitle,
      html: formHtml,
      width: "700px",
      showCancelButton: true,
      confirmButtonText: btnText,
      cancelButtonText: "Batal",
      preConfirm: () => {
        const form = document.getElementById("expenseForm");
        const akunVal = document.getElementById("input_akun").value;
        const katVal = document.getElementById("input_kategori").value;

        // Ambil value nominal mentah (masih ada titiknya, misal: "25.000")
        const rawNominal = form.querySelector('[name="nominal"]').value;

        // VALIDASI INPUT
        if (!akunVal || !katVal || !rawNominal) {
          Swal.showValidationMessage(
            "Mohon lengkapi Akun, Kategori, dan Nominal!",
          );
          return false;
        }

        // --- BAGIAN INI YANG MEMPERBAIKI BUG ---
        // Kita hapus semua titik sebelum dimasukkan ke FormData
        // Contoh: "25.000" -> jadi "25000" (String angka murni)
        const cleanNominal = rawNominal.replace(/\./g, "");

        console.log("Nominal Original:", rawNominal); // Cek console browser (F12)
        console.log("Nominal Clean:", cleanNominal); // Harusnya tanpa titik

        // Buat FormData
        const formData = new FormData(form);

        // TIMPA field 'nominal' dengan yang sudah bersih
        formData.set("nominal", cleanNominal);

        // Pastikan akun_id dan kategori terset dengan benar
        formData.set("akun_id", akunVal);
        formData.set("kategori", katVal);

        return formData;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const url = isEdit
          ? `${baseUrl}/update/expenses/${id}`
          : `${baseUrl}/add/expenses`;
        const method = isEdit ? "PUT" : "POST";
        submitUnifiedExpense(url, method, result.value);
      }
    });
  } catch (error) {
    console.error(error);
    Swal.fire("Gagal", "Terjadi kesalahan sistem saat memuat data.", "error");
  }
}
async function submitUnifiedExpense(url, method, formData) {
  Swal.fire({
    title: "Menyimpan Data...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  // Debugging: Pastikan method yang dikirim benar
  console.log(`Submitting to ${url} with method ${method}`);

  try {
    const response = await fetch(url, {
      method: method, // Akan otomatis jadi 'PUT' saat edit
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        // PENTING: Jangan set Content-Type manual untuk FormData
      },
      body: formData,
    });

    const result = await response.json();
    console.log("SERVER RESPONSE:", result);

    // Cek sukses (Handle berbagai format response backend)
    if (
      response.ok ||
      result.status === 200 ||
      result.response === "200" ||
      result.success === true
    ) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data berhasil disimpan",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        if (typeof fetchAndUpdateData === "function") fetchAndUpdateData();
      });
    } else {
      throw new Error(result.message || "Gagal menyimpan data");
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Gagal", error.message, "error");
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
      },
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

document.getElementById("importButton").addEventListener("click", () => {
  showImportModal();
});

function showImportModal() {
  const templateInfo = `
        <div class="text-left text-sm p-3 bg-blue-50 border border-blue-200 rounded mb-4">
            <p class="font-semibold text-blue-800 mb-1">💡 Ketentuan Format Excel:</p>
            <ul class="list-disc ml-4 text-blue-700">
                <li>Kolom: <b>akun_id, kategori, tanggal_request, tanggal_transaksi, nominal, deskripsi, no_ref</b></li>
                <li><b>akun_id</b> harus berupa angka (ID Akun yang terdaftar).</li>
                <li><b>nominal</b> hanya angka tanpa titik/koma.</li>
                <li>Format tanggal: <b>YYYY-MM-DD</b>.</li>
            </ul>
            <a href="#" onclick="downloadTemplate()" class="mt-2 inline-block text-blue-600 underline font-bold">⬇️ Download Template Excel</a>
        </div>
        <input type="file" id="excelFile" accept=".xlsx, .xls, .csv" class="w-full border p-2 rounded">
    `;

  Swal.fire({
    title: "Import Internal Expenses",
    html: templateInfo,
    showCancelButton: true,
    confirmButtonText: "🚀 Upload & Proses",
    preConfirm: () => {
      const fileInput = document.getElementById("excelFile");
      if (!fileInput.files[0]) {
        Swal.showValidationMessage("Silakan pilih file terlebih dahulu!");
        return false;
      }
      return fileInput.files[0];
    },
  }).then((result) => {
    if (result.isConfirmed) {
      processExcel(result.value);
    }
  });
}
async function processExcel(file) {
  const reader = new FileReader();

  // Tampilkan loading
  Swal.fire({
    title: "Memproses File...",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
  });

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

      if (jsonData.length === 0) throw new Error("File Excel kosong.");

      let successCount = 0;
      let failCount = 0;

      // Loop dan kirim data satu per satu ke endpoint add
      for (const row of jsonData) {
        const formData = new FormData();

        // Data dari Excel
        formData.append("akun_id", row.akun_id);
        formData.append("kategori", row.kategori);
        formData.append("tanggal_request", row.tanggal_request);
        formData.append("tanggal_transaksi", row.tanggal_transaksi);
        formData.append("nominal", String(row.nominal).replace(/\./g, "")); // Pastikan bersih
        formData.append("deskripsi", row.deskripsi);
        formData.append("no_ref", row.no_ref);

        // Data Otomatis dari Session (Sesuai request kamu)
        formData.append("owner_id", owner_id);
        formData.append("user_id", user_id);

        try {
          const response = await fetch(`${baseUrl}/add/expenses`, {
            method: "POST",
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            body: formData,
          });
          if (response.ok) successCount++;
          else failCount++;
        } catch (err) {
          failCount++;
        }
      }

      Swal.fire({
        icon: successCount > 0 ? "success" : "error",
        title: "Import Selesai",
        text: `${successCount} data berhasil, ${failCount} data gagal.`,
      }).then(() => {
        if (typeof fetchAndUpdateData === "function") fetchAndUpdateData();
      });
    } catch (error) {
      Swal.fire("Gagal", "Format file tidak valid: " + error.message, "error");
    }
  };
  reader.readAsArrayBuffer(file);
}
window.downloadTemplate = function () {
  const templateData = [
    {
      akun_id: "10",
      kategori: "Operasional",
      tanggal_request: "2026-01-27",
      tanggal_transaksi: "2026-01-27",
      nominal: 500000,
      deskripsi: "Pembelian ATK Kantor",
      no_ref: "REF-001",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "Template_Internal_Expenses.xlsx");
};
