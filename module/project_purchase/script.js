// --- SETUP HEADER ---
pagemodule = "Project";
subpagemodule = "Purchase";
renderHeader();

// Global Variables
var projectId = window.detail_id;
var poList = [];
var currentUpdatePurchId = null;

// --- 1. FUNGSI UTAMA: FETCH & RENDER (REVISI HANDLING ID 0) ---
async function fetchAndRenderPurchase(isRefresh = false) {
  if (!isRefresh) {
    Swal.fire({
      title: "Memuat Data...",
      html: "Mohon tunggu, sedang mengambil data terbaru...",
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
      new Promise((resolve) => setTimeout(resolve, isRefresh ? 0 : 3000)),
    ]);

    const jsonDetail = await resDetail.json();
    const jsonPo = await resPo.json();
    const jsonAcc = await resAcc.json();
    const jsonTable = await resTable.json();

    const detail = jsonDetail.detail || {};

    // ============================================================
    // LOGIKA LOCK / KUNCI (REVISI PESANAN ID 0)
    // ============================================================
    // Jika pesanan_id = "0" atau 0, anggap UNLOCKED
    const hasPesanan =
      detail.pesanan_id != null &&
      detail.pesanan_id !== "" &&
      detail.pesanan_id != "0" &&
      detail.pesanan_id !== 0;
    const isDirectSales = detail.position === "Direct Project";

    // Status Lock:
    const isLocked = hasPesanan && isDirectSales;

    document.getElementById("projectNameDisplay").textContent =
      detail.project_name
        ? `${detail.project_name} (${detail.project_number || "-"})`
        : window.detail_desc || "Project";

    handleFormLockState(isLocked);
    renderPoOptions(jsonPo);
    renderAccountOptions(jsonAcc);
    renderTableHtml(jsonTable.tableData || [], isLocked);

    if (!isRefresh) Swal.close();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data", "error");
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
      sel.innerHTML += `<option value="${item.no_po}">${item.no_po}</option>`;
    });
  } else {
    sel.innerHTML = '<option value="">Tidak ada PO</option>';
  }

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
      // Logic Tombol Aksi
      let actionButtons = "";
      if (isLocked) {
        actionButtons = `<span class="text-xs text-gray-400 italic font-semibold">Locked</span>`;
      } else {
        actionButtons = `
            <button class="edit-btn text-blue-600 mr-2 hover:text-blue-800" data-id="${d.payable_id}" type="button">✏️</button>
            <button class="delete-btn text-red-600 hover:text-red-800" data-id="${d.payable_id}" type="button">🗑️</button>
          `;
      }

      tbody.innerHTML += `
        <tr class="border-b hover:bg-gray-50 text-sm">
            <td class="px-3 py-2 whitespace-nowrap">${d.payable_date}</td>
            <td class="px-3 py-2 whitespace-nowrap">${d.po_date || "-"}</td>
            <td class="px-3 py-2">${d.no_po || "-"}</td>
            <td class="px-3 py-2 font-mono text-blue-600">${
              d.payable_number || "-"
            }</td>
            <td class="px-3 py-2">${d.vendor || "-"}</td>
            <td class="px-3 py-2">${d.nama_akun || "-"}</td>
            <td class="px-3 py-2 text-right font-semibold">${finance(
              d.nominal
            )}</td>
            <td class="px-3 py-2 text-xs text-gray-500 max-w-[150px] truncate">${
              d.keterangan || "-"
            }</td>
            <td class="px-3 py-2 text-center whitespace-nowrap">
                ${actionButtons}
            </td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center py-4 text-gray-500">Belum ada data</td></tr>';
  }
}

// --- 2. HANDLE SUBMIT (CREATE / UPDATE) ---
async function handlePurchaseSubmit(e) {
  e.preventDefault();

  // Safety Check: Blokir jika tombol disabled (Locked)
  const btnSubmit = document.getElementById("submitPurchBtn");
  if (btnSubmit.disabled) return;

  const elNominal = document.getElementById("purchNominal");
  const nominalVal = parseRupiah(elNominal.value);
  const maxVal = parseFloat(elNominal.dataset.maxVal || 0);

  // --- VALIDASI ---
  if (!document.getElementById("purchAkun").value) {
    return Swal.fire("Gagal", "Silakan pilih Akun Pembayaran", "warning");
  }
  if (!document.getElementById("purchNoPo").value) {
    return Swal.fire("Gagal", "Silakan pilih No PO", "warning");
  }

  // Validasi Nominal
  if (maxVal > 0 && nominalVal > maxVal) {
    return Swal.fire({
      icon: "error",
      title: "Nominal Berlebih",
      text: `Nominal pembayaran (Rp ${finance(
        nominalVal
      )}) melebihi sisa tagihan (Rp ${finance(maxVal)}).`,
    });
  }

  // --- SUSUN FORMDATA ---
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

  const fileInput = document.getElementById("purchFile");
  if (fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  }

  const url = currentUpdatePurchId
    ? `${baseUrl}/update/project_payable/${currentUpdatePurchId}`
    : `${baseUrl}/add/project_payable`;
  const method = currentUpdatePurchId ? "PUT" : "POST";

  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(url, {
      method: method,
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });

    const json = await res.json();

    if (
      res.ok &&
      (json.response == "201" ||
        json.response == "200" ||
        json.data?.success === true)
    ) {
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data berhasil disimpan. Merefresh tabel...",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      resetForm();
      fetchAndRenderPurchase(true);
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

// --- 3. HANDLE DELETE ---
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

  Swal.fire({ title: "Menghapus...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${baseUrl}/delete/project_payable/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Terhapus",
        text: "Data berhasil dihapus. Merefresh tabel...",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      fetchAndRenderPurchase(true);
    } else {
      throw new Error("Gagal menghapus data");
    }
  } catch (e) {
    Swal.fire("Error", "Gagal hapus data", "error");
  }
}

// --- 4. HELPER FUNCTIONS & LOGIC FORM ---

function handlePoChange() {
  const selectedNoPo = document.getElementById("purchNoPo").value;
  const elNominal = document.getElementById("purchNominal");
  const elVendorId = document.getElementById("purchVendorId");
  const elInfo = document.getElementById("poInfoText");

  if (!selectedNoPo) {
    elNominal.value = "";
    elNominal.dataset.maxVal = "0";
    elVendorId.value = "0";
    elInfo.textContent = "";
    return;
  }

  const poData = poList.find((p) => p.no_po === selectedNoPo);

  if (poData) {
    const sisaTagihan = parseFloat(poData.total_tagihan);

    if (poData.status === "Paid" || sisaTagihan <= 0) {
      Swal.fire({
        icon: "warning",
        title: "PO Sudah Lunas",
        text: `Nomor PO ${selectedNoPo} sudah lunas (Paid). Tidak dapat menambah pembayaran.`,
      });
      document.getElementById("purchNoPo").value = "";
      elInfo.textContent = "";
      elNominal.value = "";
      return;
    }

    elVendorId.value = poData.vendor_id || 0;
    elNominal.value = finance(sisaTagihan);
    elNominal.dataset.maxVal = sisaTagihan;

    const vendorName = poData.vendor || "Vendor Tidak Diketahui";
    elInfo.innerHTML = `Vendor: <b>${vendorName}</b> <br> Sisa Tagihan: Rp ${finance(
      sisaTagihan
    )}`;
  }
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
    document.getElementById("purchAkun").value = data.akun_id;
    document.getElementById("purchNotes").value = data.keterangan || "";
    document.getElementById("purchVendorId").value = data.vendor_id;
    document.getElementById("purchNoPo").value = data.no_po;

    const elNominal = document.getElementById("purchNominal");
    elNominal.value = finance(data.nominal);
    elNominal.dataset.maxVal = data.nominal;

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

// --- 6. START APPLICATION ---
fetchAndRenderPurchase();
