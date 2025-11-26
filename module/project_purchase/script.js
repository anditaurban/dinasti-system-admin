pagemodule = "Project";
subpagemodule = "Purchase";
renderHeader();

// Pastikan global variabel user & owner_id tersedia
var projectId = window.detail_id;
var poList = [];
var currentUpdatePurchId = null;

(async function initPurchase() {
  document.getElementById("projectNameDisplay").textContent =
    window.detail_desc || "Project";

  // Set ID Project ke Hidden Input (jika ada)
  const elProjectId = document.getElementById("purchProjectId");
  if (elProjectId) elProjectId.value = projectId;

  // Set Default Date ke Hari Ini
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("purchDate").value = today;

  // Load Data Dropdown & Table
  await Promise.all([loadPoList(), loadAccountList()]);
  loadPurchaseTable(1);

  // Event Listeners
  document
    .getElementById("purchaseForm")
    .addEventListener("submit", handlePurchaseSubmit);

  document
    .getElementById("cancelUpdateBtn")
    .addEventListener("click", resetForm);

  document
    .getElementById("purchNoPo")
    .addEventListener("change", handlePoChange);

  // Format Rupiah Input
  document.querySelectorAll(".formatNumber").forEach((i) => {
    i.addEventListener("input", (e) => {
      e.target.value = finance(e.target.value.replace(/\D/g, ""));
    });
  });

  // Delegasi Event untuk Tombol Edit/Hapus di Tabel
  document.getElementById("purchaseBody").addEventListener("click", (e) => {
    if (e.target.closest(".edit-btn")) {
      const id = e.target.closest(".edit-btn").dataset.id;
      populateForm(id);
    }
    if (e.target.closest(".delete-btn")) {
      const id = e.target.closest(".delete-btn").dataset.id;
      handleDelete(id);
    }
  });
})();

// --- LOAD DATA ---

async function loadPoList() {
  const sel = document.getElementById("purchNoPo");
  sel.innerHTML = '<option value="">Memuat...</option>';

  try {
    const res = await fetch(`${baseUrl}/list/no_po/${projectId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();
    sel.innerHTML = '<option value="">-- Pilih PO --</option>';

    if (res.ok && json.success && Array.isArray(json.listData)) {
      poList = json.listData;
      poList.forEach((item) => {
        // Simpan vendor_id di dataset option agar mudah diambil (opsional)
        sel.innerHTML += `
          <option value="${item.no_po}">
            ${item.no_po}
          </option>
        `;
      });
    } else {
      sel.innerHTML = '<option value="">Tidak ada PO</option>';
    }
  } catch (err) {
    console.error("❌ Gagal load PO:", err);
    sel.innerHTML = '<option value="">Gagal Load</option>';
  }
}

async function loadAccountList() {
  const select = document.getElementById("purchAkun");
  select.innerHTML = "<option value=''>-- Pilih Akun --</option>";

  try {
    const res = await fetch(
      `${baseUrl}/list/finance_account_payment/${owner_id}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const result = await res.json();

    if (result.listData && Array.isArray(result.listData)) {
      result.listData.forEach((acc) => {
        select.innerHTML += `
          <option value="${acc.akun_id}">
            ${acc.nama_akun} - ${acc.number_account}
          </option>
        `;
      });
    } else {
      select.innerHTML = "<option value=''>Tidak ada data</option>";
    }
  } catch (err) {
    console.error("❌ Gagal load akun:", err);
  }
}

async function loadPurchaseTable(page) {
  const tbody = document.getElementById("purchaseBody");
  tbody.innerHTML =
    '<tr><td colspan="9" class="text-center py-4">Memuat...</td></tr>';

  try {
    // Endpoint Table
    const res = await fetch(
      `${baseUrl}/table/project_payable/${projectId}/${page}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const json = await res.json();
    const data = json.tableData || [];

    tbody.innerHTML = "";
    if (data.length) {
      data.forEach((d) => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50 text-sm">
                <td class="px-3 py-2 whitespace-nowrap">${
                  d.transaction_date
                }</td>
                <td class="px-3 py-2 whitespace-nowrap">${d.po_date || "-"}</td>
                <td class="px-3 py-2">${d.no_po || "-"}</td>
                <td class="px-3 py-2 font-mono text-blue-600">${
                  d.no_payable || "-"
                }</td>
                <td class="px-3 py-2">${d.vendor_name || "-"}</td>
                <td class="px-3 py-2">${d.account_name || "-"}</td>
                <td class="px-3 py-2 text-right font-semibold">${finance(
                  d.amount
                )}</td>
                <td class="px-3 py-2 text-xs text-gray-500 max-w-[150px] truncate">${
                  d.notes || "-"
                }</td>
                <td class="px-3 py-2 text-center whitespace-nowrap">
                    <button class="edit-btn text-blue-600 mr-2 hover:text-blue-800" data-id="${
                      d.payable_id
                    }" type="button">✏️</button>
                    <button class="delete-btn text-red-600 hover:text-red-800" data-id="${
                      d.payable_id
                    }" type="button">🗑️</button>
                </td>
            </tr>
        `;
      });
    } else {
      tbody.innerHTML =
        '<tr><td colspan="9" class="text-center py-4 text-gray-500">Belum ada data</td></tr>';
    }
  } catch (e) {
    console.error(e);
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center py-4 text-red-500">Gagal memuat tabel</td></tr>';
  }
}

// --- LOGIC FORM ---

function handlePoChange() {
  const selectedNoPo = document.getElementById("purchNoPo").value;
  const elNominal = document.getElementById("purchNominal");
  const elVendorId = document.getElementById("purchVendorId");
  const elPoDate = document.getElementById("purchPoDate");
  const elInfo = document.getElementById("poInfoText");

  if (!selectedNoPo) {
    elNominal.value = "";
    elVendorId.value = "0";
    elPoDate.value = "";
    elInfo.textContent = "";
    return;
  }

  // Cari data detail PO dari list yang sudah di-load
  const poData = poList.find((p) => p.no_po === selectedNoPo);

  if (poData) {
    elNominal.value = finance(poData.total_po || 0);
    // PENTING: API List PO harus return vendor_id
    elVendorId.value = poData.vendor_id || 0;
    elPoDate.value = poData.po_date || ""; // Pastikan format YYYY-MM-DD

    const vendorName = poData.vendor || "Vendor Tidak Diketahui";
    elInfo.textContent = `Vendor: ${vendorName}`;
  }
}

async function handlePurchaseSubmit(e) {
  e.preventDefault();

  // 1. Validasi Input Dasar
  if (!document.getElementById("purchAkun").value) {
    return Swal.fire("Gagal", "Silakan pilih Akun Pembayaran", "warning");
  }
  if (!document.getElementById("purchNoPo").value) {
    return Swal.fire("Gagal", "Silakan pilih No PO", "warning");
  }

  // 2. Susun FormData (Sesuai Postman Image)
  const formData = new FormData();

  // Field statis/hidden
  formData.append("owner_id", user.owner_id);
  formData.append("user_id", user.user_id);
  formData.append("project_id", projectId);
  formData.append(
    "vendor_id",
    document.getElementById("purchVendorId").value || "0"
  );

  // Field dari Form
  formData.append("akun", document.getElementById("purchAkun").value);
  formData.append("payable_date", document.getElementById("purchDate").value);
  formData.append("po_date", document.getElementById("purchPoDate").value);
  formData.append("no_po", document.getElementById("purchNoPo").value);
  const elPayableNumber = document.getElementById("purchPayableNumber");
  formData.append(
    "payable_number",
    elPayableNumber ? elPayableNumber.value : "-"
  ); // Optional?
  formData.append(
    "nominal",
    parseRupiah(document.getElementById("purchNominal").value)
  );
  formData.append("keterangan", document.getElementById("purchNotes").value);

  // File Upload
  const fileInput = document.getElementById("purchFile");
  if (fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  }

  // 🔍 DEBUG: Cek isi FormData di Console sebelum dikirim
  console.group("🚀 Submitting Project Payable");
  for (var pair of formData.entries()) {
    console.log(pair[0] + ": " + pair[1]);
  }
  console.groupEnd();

  // Tentukan URL & Method
  const url = currentUpdatePurchId
    ? `${baseUrl}/update/project_payable/${currentUpdatePurchId}`
    : `${baseUrl}/add/project_payable`;

  // Method POST untuk add/update jika menggunakan FormData (biasanya update juga POST di CI/Laravel tertentu untuk handle file, tapi kalau RESTful murni pakai PUT/POST spoofing)
  // Berdasarkan postman, endpoint add pakai POST.

  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(url, {
      method: "POST", // Selalu POST untuk FormData (kecuali ada _method PUT)
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        // JANGAN set Content-Type: application/json saat pakai FormData!
        // Browser otomatis set Content-Type: multipart/form-data boundary...
      },
      body: formData,
    });

    const json = await res.json();

    if (res.ok && (json.success || json.response == "200")) {
      Swal.fire("Berhasil", "Data tersimpan", "success");
      resetForm();
      loadPurchaseTable(1);
    } else {
      throw new Error(json.message || "Gagal menyimpan data");
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", e.message, "error");
  }
}

async function handleDelete(id) {
  const c = await Swal.fire({
    title: "Hapus?",
    text: "Data tidak bisa dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
  });

  if (!c.isConfirmed) return;

  try {
    // Perbaikan Endpoint: project_payable (bukan project_purchase)
    await fetch(`${baseUrl}/delete/project_payable/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    loadPurchaseTable(1);
    Swal.fire("Terhapus", "Data berhasil dihapus", "success");
  } catch (e) {
    Swal.fire("Error", "Gagal hapus data", "error");
  }
}

function populateForm(id) {
  // Ambil data sementara dari tabel (karena endpoint detail belum tentu ada)
  // Cara yang lebih aman adalah fetch detail by ID jika endpoint tersedia
  Swal.fire(
    "Info",
    "Fitur Edit akan segera hadir (Memerlukan endpoint detail)",
    "info"
  );
}

function resetForm() {
  document.getElementById("purchaseForm").reset();
  currentUpdatePurchId = null;

  const btn = document.getElementById("submitPurchBtn");
  btn.textContent = "+ Tambah";
  btn.classList.replace("bg-green-600", "bg-blue-600");

  document.getElementById("cancelUpdateBtn").classList.add("hidden");
  document.getElementById("poInfoText").textContent = "";
  document.getElementById("purchVendorId").value = "0";

  // Set tanggal default lagi
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("purchDate").value = today;
}
