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
                <td class="px-3 py-2 whitespace-nowrap">${d.payable_date}</td>
                <td class="px-3 py-2 whitespace-nowrap">${d.po_date || "-"}</td>
                <td class="px-3 py-2">${d.no_po || "-"}</td>
                <td class="px-3 py-2 font-mono text-blue-600">${
                  d.payable_number || "-"
                }</td>
                <td class="px-3 py-2">${d.vendor || "-"}</td>
                <td class="px-3 py-2">${d.vendor_pic || "-"}</td>
                <td class="px-3 py-2 text-right font-semibold">${finance(
                  d.nominal
                )}</td>
                <td class="px-3 py-2 text-xs text-gray-500 max-w-[150px] truncate">${
                  d.keterangan || "-"
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

// --- LOGIC FORM ---

function handlePoChange() {
  const selectedNoPo = document.getElementById("purchNoPo").value;
  const elNominal = document.getElementById("purchNominal");
  const elVendorId = document.getElementById("purchVendorId");
  const elInfo = document.getElementById("poInfoText");

  // Reset field jika tidak ada yang dipilih
  if (!selectedNoPo) {
    elNominal.value = "";
    elNominal.dataset.maxVal = "0"; // Reset batas max
    elVendorId.value = "0";
    elInfo.textContent = "";
    return;
  }

  // Cari data PO dari list
  const poData = poList.find((p) => p.no_po === selectedNoPo);

  if (poData) {
    // 1. Validasi Status Paid / Lunas
    // Cek jika status tertulis "Paid" ATAU total_tagihan <= 0
    const sisaTagihan = parseFloat(poData.total_tagihan);

    if (poData.status === "Paid" || sisaTagihan <= 0) {
      Swal.fire({
        icon: "warning",
        title: "PO Sudah Lunas",
        text: `Nomor PO ${selectedNoPo} sudah lunas (Paid). Tidak dapat menambah pembayaran.`,
      });

      // Reset dropdown agar user harus memilih ulang
      document.getElementById("purchNoPo").value = "";
      elInfo.textContent = "";
      elNominal.value = "";
      return;
    }

    // 2. Isi Data Form
    elVendorId.value = poData.vendor_id || 0;

    // Set Nominal sesuai sisa TAGIHAN (bukan total PO)
    elNominal.value = finance(sisaTagihan);

    // Simpan nilai max tagihan di atribut data-max-val untuk validasi submit nanti
    elNominal.dataset.maxVal = sisaTagihan;

    // Tampilkan Info text
    const vendorName = poData.vendor || "Vendor Tidak Diketahui";
    elInfo.innerHTML = `Vendor: <b>${vendorName}</b> <br> Sisa Tagihan: Rp ${finance(
      sisaTagihan
    )}`;
  }
}

async function handlePurchaseSubmit(e) {
  e.preventDefault();

  const elNominal = document.getElementById("purchNominal");
  const nominalVal = parseRupiah(elNominal.value);
  const maxVal = parseFloat(elNominal.dataset.maxVal || 0);

  // --- 1. VALIDASI ---
  if (!document.getElementById("purchAkun").value) {
    return Swal.fire("Gagal", "Silakan pilih Akun Pembayaran", "warning");
  }
  if (!document.getElementById("purchNoPo").value) {
    return Swal.fire("Gagal", "Silakan pilih No PO", "warning");
  }

  // Validasi Nominal (Hanya jika maxVal > 0)
  if (maxVal > 0 && nominalVal > maxVal) {
    return Swal.fire({
      icon: "error",
      title: "Nominal Berlebih",
      text: `Nominal pembayaran (Rp ${finance(
        nominalVal
      )}) melebihi sisa tagihan (Rp ${finance(maxVal)}).`,
    });
  }

  // --- 2. SUSUN FORMDATA ---
  const formData = new FormData();

  formData.append("owner_id", user.owner_id);
  formData.append("user_id", user.user_id);
  formData.append("project_id", projectId);
  formData.append(
    "vendor_id",
    document.getElementById("purchVendorId").value || "0"
  );
  formData.append("akun", document.getElementById("purchAkun").value);
  formData.append("payable_date", document.getElementById("purchDate").value);
  formData.append("no_po", document.getElementById("purchNoPo").value);
  formData.append("nominal", nominalVal);
  formData.append("keterangan", document.getElementById("purchNotes").value);

  // File Upload
  const fileInput = document.getElementById("purchFile");
  if (fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  }

  // --- 3. TENTUKAN URL & METHOD ---
  const url = currentUpdatePurchId
    ? `${baseUrl}/update/project_payable/${currentUpdatePurchId}`
    : `${baseUrl}/add/project_payable`;

  // UBAH DISINI: Jika Update pakai PUT, jika Add pakai POST
  const method = currentUpdatePurchId ? "PUT" : "POST";

  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(url, {
      method: method, // Method dinamis
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        // Jangan set Content-Type manual saat pakai FormData!
      },
      body: formData,
    });

    const json = await res.json();

    // --- 4. HANDLE RESPONSE ---
    // Cek response 201 (Created) atau 200 (OK)
    if (
      res.ok &&
      (json.response == "201" ||
        json.response == "200" ||
        json.data?.success === true)
    ) {
      const msg = json.data?.message || "Data berhasil disimpan";

      Swal.fire("Berhasil", msg, "success");
      resetForm();
      loadPurchaseTable(1);
    } else {
      const errorMsg =
        json.data?.message || json.message || "Gagal menyimpan data";
      throw new Error(errorMsg);
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", e.message, "error");
  }
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

  // Reset max value dataset
  document.getElementById("purchNominal").dataset.maxVal = "0";

  // Set tanggal default lagi
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("purchDate").value = today;
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

async function populateForm(id) {
  try {
    // 1. Fetch Detail Data dari API
    const res = await fetch(`${baseUrl}/detail/project_payable/${id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();

    // Validasi jika data tidak ditemukan atau gagal
    if (!json.success || !json.data) {
      throw new Error(json.message || "Gagal memuat detail data");
    }

    const data = json.data;

    // Set Global ID agar sistem tahu ini mode EDIT, bukan ADD
    currentUpdatePurchId = data.payable_id;

    // 2. Mapping Data JSON ke Input Form

    // Tanggal Transaksi
    document.getElementById("purchDate").value = data.payable_date;

    // Akun Pembayaran
    document.getElementById("purchAkun").value = data.akun_id;

    // Keterangan
    document.getElementById("purchNotes").value = data.keterangan || "";

    // Hidden Input Vendor ID
    document.getElementById("purchVendorId").value = data.vendor_id;

    // Dropdown No PO
    // Pastikan value PO ada di dalam list option.
    document.getElementById("purchNoPo").value = data.no_po;

    // 3. Handling Nominal & Validasi
    const elNominal = document.getElementById("purchNominal");

    // Format angka ke format rupiah/finance
    elNominal.value = finance(data.nominal);

    // PENTING: Update dataset maxVal
    // Kita set maxVal minimal sebesar nominal saat ini.
    // Ini bertujuan agar saat klik tombol "Update", validasi "Nominal melebihi sisa tagihan"
    // tidak memblokir data yang sedang diedit ini.
    elNominal.dataset.maxVal = data.nominal;

    // 4. Update Info Text Manual (Tanpa trigger event change)
    // Kita isi manual agar tidak memicu validasi "Status Paid" yang mungkin memblokir form
    const elInfo = document.getElementById("poInfoText");
    const vendorName = data.vendor || "Vendor";
    elInfo.innerHTML = `Vendor: <b>${vendorName}</b> <span class="text-green-600 font-semibold">(Mode Edit)</span>`;

    // 5. Ubah Tampilan Tombol (UI)
    const btn = document.getElementById("submitPurchBtn");
    btn.textContent = "Update";
    btn.classList.remove("bg-blue-600", "hover:bg-blue-700"); // Hapus warna biru
    btn.classList.add("bg-green-600", "hover:bg-green-700"); // Ganti warna hijau

    // Munculkan tombol Batal
    document.getElementById("cancelUpdateBtn").classList.remove("hidden");

    // Scroll otomatis ke form agar user melihat data yang terisi
    document
      .getElementById("purchaseForm")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (e) {
    console.error("Error populateForm:", e);
    Swal.fire("Error", "Gagal memuat data edit: " + e.message, "error");
  }
}
