// --- SETUP HEADER ---
pagemodule = "Project";
subpagemodule = "Purchase";
renderHeader();

// Global Variables
var projectId = window.detail_id;
var poList = [];
var currentUpdatePurchId = null;

// --- 1. FUNGSI UTAMA: FETCH & RENDER (FIXED) ---
async function fetchAndRenderPurchase(isRefresh = false) {
  if (!isRefresh) {
    Swal.fire({
      title: "Memuat Data...",
      html: "Mohon tunggu...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  const elProjectId = document.getElementById("purchProjectId");
  if (elProjectId) elProjectId.value = projectId;

  if (!isRefresh) {
    const today = new Date().toISOString().split("T")[0];
    const dateEl = document.getElementById("purchDate");
    if (dateEl && !dateEl.value) dateEl.value = today;
  }

  try {
    const [resDetail, resPo, resAcc, resTable] = await Promise.all([
      fetch(`${baseUrl}/detail/project/${projectId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      fetch(`${baseUrl}/list/no_po/${projectId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      fetch(`${baseUrl}/list/finance_account_payment/${owner_id}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      fetch(`${baseUrl}/table/project_payable/${projectId}/1`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      new Promise((resolve) => setTimeout(resolve, isRefresh ? 0 : 500)),
    ]);

    const jsonDetail = await resDetail.json();
    const jsonPo = await resPo.json();
    const jsonAcc = await resAcc.json();
    const jsonTable = await resTable.json();

    // --- PERBAIKAN UTAMA DI SINI ---
    // Kita ambil array dari property 'tableData' sesuai response JSON Anda
    const tableData = jsonTable.tableData || [];

    // Debugging (Opsional: Cek console browser untuk memastikan)
    console.log("Data Tabel Diterima:", tableData);

    const detail = jsonDetail.detail || {};

    // Logic Lock
    const hasPesanan = detail.pesanan_id && detail.pesanan_id != "0";
    const isDirectSales = detail.position === "Direct Project";
    const isLocked = hasPesanan && isDirectSales;

    document.getElementById("projectNameDisplay").textContent =
      detail.project_name
        ? `${detail.project_name} (${detail.project_number || "-"})`
        : window.detail_desc || "Project";

    handleFormLockState(isLocked);
    renderPoOptions(jsonPo);
    renderAccountOptions(jsonAcc);

    // Render tabel
    renderTableHtml(tableData, isLocked);

    if (!isRefresh) Swal.close();
  } catch (err) {
    console.error(err);
    if (!isRefresh) Swal.fire("Error", "Gagal memuat data", "error");
  }
}

// --- FUNGSI MENGATUR FORM LOCK ---
function handleFormLockState(isLocked) {
  const form = document.getElementById("purchaseForm");
  const submitBtn = document.getElementById("submitPurchBtn");
  const inputs = form.querySelectorAll("input, select, textarea");

  if (isLocked) {
    // Mode Terkunci
    inputs.forEach((input) => {
      input.disabled = true;
      input.classList.add("bg-gray-100", "cursor-not-allowed");
    });

    submitBtn.disabled = true;
    submitBtn.innerHTML = "🔒 Locked (Direct Project)";
    submitBtn.classList.remove(
      "bg-blue-600",
      "hover:bg-blue-700",
      "bg-green-600",
      "hover:bg-green-700"
    );
    submitBtn.classList.add("bg-gray-400", "cursor-not-allowed");

    // Sembunyikan tombol cancel update jika ada
    document.getElementById("cancelUpdateBtn").classList.add("hidden");
  } else {
    // Mode Normal (Unlock)
    // Enable kembali input (kecuali hidden input tertentu jika perlu, tapi umumnya aman enable semua di form ini)
    inputs.forEach((input) => {
      input.disabled = false;
      input.classList.remove("bg-gray-100", "cursor-not-allowed");
    });

    // Kembalikan tombol submit ke state awal (kecuali sedang edit handled by populateForm)
    if (!currentUpdatePurchId) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "+ Tambah";
      submitBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
      submitBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
    }
  }
}

// --- FUNGSI RENDER HTML ---

function renderPoOptions(json) {
  const sel = document.getElementById("purchNoPo");
  const oldVal = sel.value;

  sel.innerHTML = '<option value="">-- Pilih PO --</option>';

  if (json.success && Array.isArray(json.listData)) {
    poList = json.listData;
    poList.forEach((item) => {
      // PERUBAHAN: value sekarang menggunakan purchase_id
      // Pastikan response API list/no_po mengembalikan field 'purchase_id'
      sel.innerHTML += `<option value="${item.purchase_id}">${item.no_po}</option>`;
    });
  } else {
    sel.innerHTML = '<option value="">Tidak ada PO</option>';
  }

  // Set ulang value jika ada (untuk kasus refresh/error)
  if (oldVal) sel.value = oldVal;
}

function renderAccountOptions(json) {
  const select = document.getElementById("purchAkun");
  const oldVal = select.value;

  select.innerHTML = "<option value=''>-- Pilih Akun --</option>";

  if (json.listData && Array.isArray(json.listData)) {
    json.listData.forEach((acc) => {
      select.innerHTML += `
        <option value="${acc.akun_id}">
          ${acc.nama_akun} - ${acc.number_account}
        </option>
      `;
    });
  } else {
    select.innerHTML = "<option value=''>Tidak ada data</option>";
  }

  if (oldVal) select.value = oldVal;
}

function renderTableHtml(data, isLocked) {
  const tbody = document.getElementById("purchaseBody");
  tbody.innerHTML = "";

  if (data.length) {
    data.forEach((d) => {
      // Logic disable tombol
      const disabledAttr = isLocked
        ? 'disabled class="text-gray-400 cursor-not-allowed mx-1"'
        : "";

      // --- PERBAIKAN LOGIC URL GAMBAR (TRUST THE API) ---
      let fileUrl = "";
      let hasFile = false;

      if (d.file && d.file !== "null" && d.file !== "") {
        hasFile = true;

        // 1. Ambil URL mentah dari API
        // Contoh: "https://dev.../file/payable/Foto Bukti.png"
        let rawUrl = d.file;

        // 2. Cukup ganti SPASI dengan %20 secara manual
        // Ini lebih aman daripada memecah string (split) karena path folder tidak akan rusak
        fileUrl = rawUrl.replace(/ /g, "%20");

        // [DEBUG]
        console.log("Image URL Final:", fileUrl);
      }

      // --- TOMBOL VIEW FILE ---
      const viewBtn = hasFile
        ? `<button class="view-proof-btn text-blue-500 hover:text-blue-700 mx-1"
                data-file="${fileUrl}" 
                type="button"
                title="Lihat Bukti">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
             </svg>
           </button>`
        : `<span class="text-gray-300 mx-1" title="Tidak ada file">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29" />
             </svg>
           </span>`;

      // Tombol Edit & Delete
      const editBtn = isLocked
        ? ""
        : `<button class="edit-btn text-yellow-600 hover:text-yellow-800 mx-1" data-id="${d.payable_id}" type="button" title="Edit">✏️</button>`;

      const deleteBtn = isLocked
        ? ""
        : `<button class="delete-btn text-red-600 hover:text-red-800 mx-1" data-id="${d.payable_id}" type="button" title="Hapus">🗑️</button>`;

      tbody.innerHTML += `
        <tr class="border-b hover:bg-gray-50 text-sm">
          <td class="px-3 py-2 text-center">${d.payable_date}</td>
          <td class="px-3 py-2 text-center">${d.po_date || "-"}</td>
          <td class="px-3 py-2 text-center">${d.no_po || "-"}</td>
          <td class="px-3 py-2 font-mono text-blue-600 font-semibold text-center">${
            d.payable_number || "-"
          }</td>
          <td class="px-3 py-2">${d.vendor || "-"}</td>
          <td class="px-3 py-2">${d.nama_akun || "-"}</td>
          <td class="px-3 py-2 text-right font-bold text-gray-700">${finance(
            d.nominal
          )}</td>
          <td class="px-3 py-2 truncate max-w-[150px]">${
            d.keterangan || "-"
          }</td>
          <td class="px-3 py-2 text-center flex justify-center items-center">
             ${viewBtn} ${editBtn} 
          </td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-gray-500 italic">Belum ada data pembayaran</td></tr>`;
  }
}

// --- UPDATE HANDLE VIEW PROOF (SOLUSI 401 UNAUTHORIZED) ---
async function handleViewProof(fileUrl) {
  if (!fileUrl || fileUrl === "null") return;

  // 1. Tampilkan Loading Dulu
  Swal.fire({
    title: "Mengambil Gambar...",
    html: "Mohon tunggu, sedang melakukan otentikasi file...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 2. Request Gambar Manual dengan Header Authorization
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`, // KUNCI: Kirim Token Authentication
      },
    });

    // Cek jika server menolak (401) atau file tidak ada (404)
    if (!response.ok) {
      throw new Error(`Gagal memuat gambar (Status: ${response.status})`);
    }

    // 3. Konversi Data Binary menjadi Blob & Object URL
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    // 4. Tampilkan Gambar menggunakan URL Sementara (Object URL)
    await Swal.fire({
      title: "Bukti Transaksi",
      html: `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
           <img src="${objectUrl}" 
                alt="Bukti Transaksi" 
                style="max-width: 100%; max-height: 500px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
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

    // (Opsional) Hapus URL dari memori setelah ditutup agar hemat RAM
    // URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Error loading image:", error);
    Swal.fire({
      icon: "error",
      title: "Gagal Membuka Gambar",
      text: "Server menolak akses (401 Unauthorized). Pastikan token login Anda masih berlaku.",
      footer: `<div class="text-xs text-gray-500">URL: ${fileUrl}</div>`,
    });
  }
}
// --- 2. HANDLE SUBMIT (CREATE / UPDATE) ---
async function handlePurchaseSubmit(e) {
  e.preventDefault();

  const btnSubmit = document.getElementById("submitPurchBtn");
  if (btnSubmit.disabled) return;

  // --- 1. DEKLARASI VARIABEL (PENTING: Jangan Lupa Baris Ini) ---
  const elNominal = document.getElementById("purchNominal");
  const elPercent = document.getElementById("purchPercent"); // <--- INI YANG KURANG

  const nominalVal = parseRupiah(elNominal.value);
  const maxVal = parseFloat(elNominal.dataset.maxVal || 0);

  // --- VALIDASI ---
  const akunVal = document.getElementById("purchAkun").value;
  const purchaseId = document.getElementById("purchNoPo").value;
  const vendorId = document.getElementById("purchVendorId").value;

  if (!akunVal)
    return Swal.fire("Gagal", "Silakan pilih Akun Pembayaran", "warning");
  if (!purchaseId) return Swal.fire("Gagal", "Silakan pilih No PO", "warning");

  // Validasi Nominal
  if (!currentUpdatePurchId && maxVal > 0 && nominalVal > maxVal) {
    return Swal.fire({
      icon: "error",
      title: "Nominal Berlebih",
      text: `Nominal pembayaran melebihi sisa tagihan.`,
    });
  }

  // --- SUSUN FORMDATA ---
  const formData = new FormData();
  formData.append("owner_id", user.owner_id);
  formData.append("user_id", user.user_id);
  formData.append("purchase_id", purchaseId);
  formData.append("project_id", projectId);
  formData.append("vendor_id", vendorId || "0");
  formData.append("akun", akunVal);
  formData.append("payable_date", document.getElementById("purchDate").value);

  formData.append("nominal", nominalVal);

  // --- 2. PENGGUNAAN VARIABEL elPercent ---
  // Pastikan elPercent sudah didefinisikan di atas (langkah 1)
  let percentVal = 0;
  if (elPercent) {
    percentVal = parseFloat(elPercent.value) || 0;
  }
  formData.append("nominal_percent", percentVal);

  formData.append("keterangan", document.getElementById("purchNotes").value);
  formData.append("no_po_file", document.getElementById("purchNoPoFile").value);

  const fileInput = document.getElementById("purchFile");
  if (fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  }

  // --- KIRIM DATA ---
  const url = currentUpdatePurchId
    ? `${baseUrl}/update/project_payable/${currentUpdatePurchId}`
    : `${baseUrl}/add/project_payable`;

  const method = currentUpdatePurchId ? "PUT" : "POST";

  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });

    const json = await res.json();

    if (
      res.ok &&
      (json.status === 200 ||
        json.success === true ||
        json.response == "200" ||
        json.response == "201")
    ) {
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data berhasil disimpan.",
        timer: 1500,
        showConfirmButton: false,
      });
      resetForm();
      fetchAndRenderPurchase(true);
    } else {
      throw new Error(
        json.message || json.data?.message || "Gagal menyimpan data"
      );
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", e.message, "error");
  }
}

// --- 3. HANDLE DELETE ---
// async function handleDelete(id) {
//   const c = await Swal.fire({
//     title: "Hapus?",
//     text: "Data tidak bisa dikembalikan",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonText: "Ya, Hapus",
//     cancelButtonText: "Batal",
//   });

//   if (!c.isConfirmed) return;

//   Swal.fire({ title: "Menghapus...", didOpen: () => Swal.showLoading() });

//   try {
//     const res = await fetch(`${baseUrl}/delete/project_payable/${id}`, {
//       method: "PUT",
//       headers: { Authorization: `Bearer ${API_TOKEN}` },
//     });

//     if (res.ok) {
//       await Swal.fire({
//         icon: "success",
//         title: "Terhapus",
//         text: "Data berhasil dihapus. Merefresh tabel...",
//         timer: 3000,
//         timerProgressBar: true,
//         showConfirmButton: false,
//       });

//       fetchAndRenderPurchase(true);
//     } else {
//       throw new Error("Gagal menghapus data");
//     }
//   } catch (e) {
//     Swal.fire("Error", "Gagal hapus data", "error");
//   }
// }

// --- 4. HELPER FUNCTIONS & LOGIC FORM (UPDATED) ---
function handlePoChange() {
  const selectedPurchaseId = document.getElementById("purchNoPo").value;

  // Element-element Input
  const elNominal = document.getElementById("purchNominal");
  const elPercent = document.getElementById("purchPercent");
  const elVendorId = document.getElementById("purchVendorId");
  const elNoPoFile = document.getElementById("purchNoPoFile");
  const elInfo = document.getElementById("poInfoText");

  // 1. Jika User Memilih "Pilih PO" (Reset/Kosong)
  if (!selectedPurchaseId) {
    resetFieldPo();
    return;
  }

  // 2. Cari Data PO di Variable Global poList
  const poData = poList.find((p) => p.purchase_id == selectedPurchaseId);

  if (poData) {
    // --- CEK APPROVAL STATUS ---
    const statusApproval = poData.approval_status
      ? poData.approval_status.toLowerCase()
      : "no";

    if (statusApproval !== "yes") {
      Swal.fire({
        icon: "warning",
        title: "Belum Disetujui",
        text: `Nomor PO ${poData.no_po} belum di-approve.`,
      });
      document.getElementById("purchNoPo").value = "";
      resetFieldPo();
      return;
    }

    // --- VARIABEL KEUANGAN ---
    const sisaTagihan = parseFloat(poData.total_tagihan) || 0;
    const totalPo = parseFloat(poData.total_po) || 0;
    const apiPercent = parseFloat(poData.nominal_percent) || 0;

    // 3. Cek Status Lunas / Sisa 0
    if (poData.status === "Paid" || sisaTagihan <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Tagihan Lunas",
        text: `Nomor PO ${poData.no_po} sudah lunas.`,
      });
      document.getElementById("purchNoPo").value = "";
      resetFieldPo();
      return;
    }

    // 4. Setup Input Dasar
    elVendorId.value = poData.vendor_id || 0;
    elNoPoFile.value = poData.no_po_file || "";

    // --- LOGIC BARU: PRIORITASKAN NOMINAL PERCENT DARI API ---
    // Logic: Jika ada nominal_percent dari API (misal 30%), gunakan itu.
    // Jika tidak ada (0/null), fallback ke 100% (pelunasan sisa).

    if (apiPercent > 0) {
      // CASE A: Menggunakan data Termin/Percent dari API (Contoh: 30%)
      elPercent.value = apiPercent; // Isi kolom persen (30.00)
      elNominal.value = finance(sisaTagihan); // Isi nominal rupiah sesuai sisa tagihan saat ini

      // PENTING: Set Base Calculation untuk Event Listener
      // Jika persen berasal dari Total Project (misal termin 1 = 30% dari Total),
      // maka base calculation-nya adalah total_po.
      elNominal.dataset.totalBase = totalPo;
    } else {
      // CASE B: Tidak ada data percent (Logic Lama / Default Pelunasan)
      elPercent.value = "100";
      elNominal.value = finance(sisaTagihan);

      // Base calculation adalah sisa tagihan itu sendiri
      elNominal.dataset.totalBase = sisaTagihan;
    }

    // Kunci Max Value agar tidak input berlebih
    elNominal.dataset.maxVal = sisaTagihan;

    // --- INFO TEXT ---
    const vendorName = poData.vendor || "Vendor Tidak Diketahui";
    const approvedBy = poData.approved_by
      ? `(Appr. by ${poData.approved_by})`
      : "";

    // Tampilkan info tambahan jika menggunakan mode persen API
    const infoPercent =
      apiPercent > 0
        ? `<span class="text-blue-600 font-bold ml-1">[Termin ${apiPercent}%]</span>`
        : "";

    elInfo.innerHTML = `
        Vendor: <b>${vendorName}</b> <span class="text-green-600 text-xs font-bold">✓ APPROVED ${approvedBy}</span> ${infoPercent}<br> 
        Total PO: Rp ${finance(totalPo)} | Sisa Tagihan: Rp ${finance(
      sisaTagihan
    )}
    `;
  }
}

// Helper untuk mereset field (copas ini juga jika belum ada)
function resetFieldPo() {
  const elNominal = document.getElementById("purchNominal");
  const elPercent = document.getElementById("purchPercent");

  elNominal.value = "";
  elNominal.dataset.maxVal = "0";
  elNominal.dataset.totalBase = "0";
  elPercent.value = "";

  document.getElementById("purchVendorId").value = "0";
  document.getElementById("purchNoPoFile").value = "";
  document.getElementById("poInfoText").textContent = "";
}
function resetForm() {
  document.getElementById("purchaseForm").reset();
  currentUpdatePurchId = null;

  const btn = document.getElementById("submitPurchBtn");
  btn.textContent = "+ Tambah";
  btn.classList.replace("bg-green-600", "bg-blue-600");
  // Pastikan class disabled hilang jika di-reset (kecuali jika locked, logic fetch akan handle ulang)
  btn.disabled = false;
  btn.classList.remove("bg-gray-400", "cursor-not-allowed");

  // Re-enable input saat reset manual
  const form = document.getElementById("purchaseForm");
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    input.disabled = false;
    input.classList.remove("bg-gray-100", "cursor-not-allowed");
  });

  document.getElementById("cancelUpdateBtn").classList.add("hidden");
  document.getElementById("poInfoText").textContent = "";
  document.getElementById("purchVendorId").value = "0";
  document.getElementById("purchNominal").dataset.maxVal = "0";
  document.getElementById("purchNoPoFile").value = "";
  document.getElementById("purchPercent").value = "";

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("purchDate").value = today;

  // NOTE: Jika project LOCKED, fetchAndRenderPurchase() akan otomatis mengunci lagi
  // karena biasanya resetForm dipanggil setelah submit sukses.
  // Jika tombol reset manual ditekan pada posisi locked, user tidak bisa menekan karena semua input disabled.
}

async function populateForm(id) {
  try {
    const res = await fetch(`${baseUrl}/detail/project_payable/${id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || "Gagal memuat detail data");
    }

    const data = json.data;
    currentUpdatePurchId = data.payable_id;

    document.getElementById("purchDate").value = data.payable_date;
    document.getElementById("purchAkun").value = data.akun_id; // Pastikan detail mengembalikan akun_id
    document.getElementById("purchNotes").value = data.keterangan || "";
    document.getElementById("purchVendorId").value = data.vendor_id;

    // PERUBAHAN: Set dropdown menggunakan purchase_id (bukan no_po string)
    // Pastikan API detail/project_payable mengembalikan field 'purchase_id'
    if (data.purchase_id) {
      document.getElementById("purchNoPo").value = data.purchase_id;
    } else {
      // Fallback jika API detail belum kirim purchase_id, tapi ini berisiko tidak match
      console.warn("API Detail tidak mengembalikan purchase_id");
    }

    document.getElementById("purchNoPoFile").value = data.no_po_file || "";

    const elNominal = document.getElementById("purchNominal");
    elNominal.value = finance(data.nominal);
    elNominal.dataset.maxVal = data.nominal; // Di mode edit, maxVal mungkin perlu logic khusus, tapi sementara disamakan

    const elPercent = document.getElementById("purchPercent");

    // Cek apakah API detail mengembalikan nominal_percent
    if (data.nominal_percent) {
      elPercent.value = data.nominal_percent;
    } else {
      elPercent.value = ""; // Biarkan kosong atau user isi ulang
    }

    const elInfo = document.getElementById("poInfoText");
    const vendorName = data.vendor || "Vendor";
    elInfo.innerHTML = `Vendor: <b>${vendorName}</b> <span class="text-green-600 font-semibold">(Mode Edit)</span>`;

    const btn = document.getElementById("submitPurchBtn");
    btn.textContent = "Update";
    btn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    btn.classList.add("bg-green-600", "hover:bg-green-700");

    document.getElementById("cancelUpdateBtn").classList.remove("hidden");
    document
      .getElementById("purchaseForm")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "Gagal memuat data edit: " + e.message, "error");
  }
}

// --- 5. EVENT LISTENERS ---

document
  .getElementById("purchaseForm")
  .addEventListener("submit", handlePurchaseSubmit);
document.getElementById("cancelUpdateBtn").addEventListener("click", resetForm);
document.getElementById("purchNoPo").addEventListener("change", handlePoChange);

document.querySelectorAll(".formatNumber").forEach((i) => {
  i.addEventListener("input", (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (rawValue === "") {
      e.target.value = "";
    } else {
      e.target.value = finance(rawValue);
    }
  });
});

// --- 5. EVENT LISTENERS ---

// Listener untuk klik di dalam tabel (Delegation)
// Listener Utama
document.getElementById("purchaseBody").addEventListener("click", (e) => {
  // [DEBUG] Cek elemen apa yang diklik
  // console.log("DEBUG: Element clicked ->", e.target);

  // 1. Handle View Proof
  const viewBtn = e.target.closest(".view-proof-btn");
  if (viewBtn) {
    e.preventDefault();

    // [DEBUG] Cek apakah tombol terdeteksi
    console.log("DEBUG: Button Detected!", viewBtn);

    // Ambil URL
    const fileUrl = viewBtn.getAttribute("data-file");

    // [DEBUG] Cek nilai atribut data-file
    console.log("DEBUG: Retrieved data-file URL ->", fileUrl);

    handleViewProof(fileUrl);
    return; // Stop eksekusi agar tidak lanjut ke bawah
  }

  // 2. Handle Edit
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    populateForm(editBtn.dataset.id);
  }

  // 3. Handle Delete
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    handleDelete(deleteBtn.dataset.id);
  }
});

// 1. Jika User mengetik Persen (Contoh: 50%)
document.getElementById("purchPercent").addEventListener("input", function (e) {
  const percent = parseFloat(this.value) || 0;
  const elNominal = document.getElementById("purchNominal");

  // Ambil total tagihan (base) dari dataset yang diset saat pilih PO
  const totalBase = parseFloat(elNominal.dataset.totalBase) || 0;

  if (totalBase > 0) {
    // Rumus: (Persen / 100) * Sisa Tagihan
    const hasilRupiah = (percent / 100) * totalBase;

    // Update kolom rupiah (gunakan fungsi finance() formatting Anda)
    elNominal.value = finance(hasilRupiah);
  }
});

// 2. Jika User mengetik Nominal Rupiah (Contoh: 1.000.000)
document.getElementById("purchNominal").addEventListener("input", function (e) {
  // Ambil value angka murni (hapus titik/koma format)
  const rawValue = parseFloat(this.value.replace(/\D/g, "")) || 0;
  const elPercent = document.getElementById("purchPercent");

  // Ambil total tagihan (base)
  const totalBase = parseFloat(this.dataset.totalBase) || 0;

  if (totalBase > 0) {
    // Rumus: (Nominal Input / Sisa Tagihan) * 100
    let hasilPersen = (rawValue / totalBase) * 100;

    // Batasi desimal biar rapi (maks 2 desimal), dan tidak lebih dari 100% secara visual
    // if(hasilPersen > 100) hasilPersen = 100; // Opsional: un-comment jika ingin melimit visual

    elPercent.value = hasilPersen.toFixed(2).replace(/\.00$/, ""); // Hapus .00 jika bulat
  }
});
// --- 6. START APPLICATION ---
fetchAndRenderPurchase();
