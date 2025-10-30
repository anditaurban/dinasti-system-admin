pagemodule = "Project";
subpagemodule = "Project Costing";
// renderHeader(); // Diasumsikan sudah ada dari file lain

// ================================================================
//  VARIABEL GLOBAL
// ================================================================
projectDetailData = null;
realCalculationData = [];
currentUpdateCostId = null;

// ================================================================
// PENGATURAN TAB (LOGIKA UNTUK 3 TAB)
// ================================================================
tab1 = document.getElementById("tab1");
tab2 = document.getElementById("tab2");
tab3 = document.getElementById("tab3");
tab1Btn = document.getElementById("tab1Btn");
tab2Btn = document.getElementById("tab2Btn");
tab3Btn = document.getElementById("tab3Btn");

function switchTab(activeTab, activeBtn) {
  [tab1, tab2, tab3].forEach((tab) => tab.classList.add("hidden"));
  [tab1Btn, tab2Btn, tab3Btn].forEach((btn) => {
    btn.classList.remove("border-blue-600", "text-blue-600");
    btn.classList.add("text-gray-500");
  });
  activeTab.classList.remove("hidden");
  activeBtn.classList.add("border-blue-600", "text-blue-600");
  activeBtn.classList.remove("text-gray-500");
}

tab1Btn.addEventListener("click", () => switchTab(tab1, tab1Btn));
tab2Btn.addEventListener("click", () => switchTab(tab2, tab2Btn));
tab3Btn.addEventListener("click", () => switchTab(tab3, tab3Btn));

// ================================================================
// FUNGSI LOAD DATA UTAMA (MENGGUNAKAN API)
// ================================================================

/**
 * Memuat data utama project saat halaman dibuka
 */
async function loadDetailProject() {
  const projectId = window.detail_id || 5;

  if (!projectId) {
    alert("Project ID tidak ditemukan.");
    return;
  }
  if (typeof baseUrl === "undefined" || typeof API_TOKEN === "undefined") {
    console.error("baseUrl atau API_TOKEN tidak terdefinisi.");
    alert("Konfigurasi API tidak ditemukan.");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/detail/project/${projectId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!res.ok) {
      throw new Error(`Gagal mengambil data project: ${res.statusText}`);
    }
    const response = await res.json();
    if (!response.success || !response.detail) {
      throw new Error(response.message || "Struktur data API tidak valid");
    }

    projectDetailData = response.detail;
    renderProjectData();
    loadActualCostingTable(); // Muat tabel Tab 2
  } catch (err) {
    console.error("Gagal memuat detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail project", "error");
  }
}

/**
 * 🔽 PERBAIKAN: Mengambil detail project.
 * try/catch dihapus agar error bisa ditangkap oleh fungsi pemanggil (handleAdd, handleUpdate).
 */
async function fetchProjectDetail(projectId) {
  const res = await fetch(`${baseUrl}/detail/project/${projectId}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
  }
  const result = await res.json();

  if (result.success && result.detail) {
    projectDetailData = result.detail;
    return true;
  } else {
    // Biarkan error ini "melempar" agar ditangkap catch block pemanggil
    throw new Error(
      result.message ||
        "Data project tidak ditemukan atau format respons salah."
    );
  }
}

/**
 * 🔽 BARU: Helper untuk me-refresh semua data setelah C/U/D
 * Me-refresh tabel Tab 2, dan semua header card + tabel Tab 1.
 */
async function refreshAllProjectData() {
  if (!projectDetailData || !projectDetailData.project_id) return;
  const projectId = projectDetailData.project_id;

  // 1. Muat ulang tabel actual costing (Tab 2)
  await loadActualCostingTable();
  // 2. Muat ulang data project (untuk header card)
  await fetchProjectDetail(projectId);
  // 3. Render ulang data di Tab 1
  await renderProjectData();
}

// ================================================================
// FUNGSI RENDER PROJECT (TAB 1)
// ================================================================
async function renderProjectData() {
  // Fungsi ini biarkan memiliki try/catch sendiri
  try {
    const data = projectDetailData;
    if (!data) throw new Error("Data project belum dimuat");

    // ---- (1) UPDATE CARD RINGKASAN ----
    document.getElementById("projectNameDisplay").textContent =
      data.project_name || "Project Detail";
    document.getElementById("projectAmount").innerHTML = formatNumber(
      data.project_value
    );
    document.getElementById("plan_costing").innerHTML = formatNumber(
      data.plan_costing
    );
    document.getElementById("actual_costing").innerHTML = formatNumber(
      data.actual_cost
    );
    document.getElementById("margin").innerHTML = formatNumber(data.margin);

    // ---- (2) UPDATE INFO DETAIL PROJECT ----
    document.getElementById("detailNoQO").textContent = data.no_qtn;
    document.getElementById("detailNoInv").textContent = data.inv_number;
    document.getElementById("detailNoPO").textContent = data.po_number || "---";
    document.getElementById("detailPIC").textContent =
      data.project_manager_name || "---";

    // ---- (3) RENDER TABEL ITEM (TAB 1) ----
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";
    if (data.items?.length) {
      const groups = {};
      data.items.forEach((item) => {
        if (!groups[item.sub_category]) groups[item.sub_category] = [];
        groups[item.sub_category].push(item);
      });

      let nomor = 1;
      Object.keys(groups).forEach((subCat) => {
        tbody.innerHTML += `
          <tr class="bg-gray-200 font-semibold">
            <td colspan="10" class="px-3 py-2 uppercase">${subCat || "-"}</td>
          </tr>
        `;
        groups[subCat].forEach((item) => {
          const item_actual_costing = item.actual_total || 0;
          const tr = document.createElement("tr");
          tr.className = "border-b";
          tr.dataset.itemId = item.project_item_id;
          tr.innerHTML = `
            <td class="px-3 py-2 text-center">${nomor++}</td>
            <td class="px-3 py-2 align-top">
              <div class="font-medium">${item.product ?? ""}</div>
              <div class="text-xs text-gray-500">${item.description ?? ""}</div>
              ${
                item.materials?.length
                  ? `<ul class="text-xs text-gray-600 list-disc ml-4">
                      ${item.materials
                        .map(
                          (mat) =>
                            `<li>${
                              mat.name ?? ""
                            } <span class="text-gray-500">${mat.qty ?? ""} ${
                              mat.unit ?? ""
                            }</span></li>`
                        )
                        .join("")}
                    </ul>`
                  : ""
              }
            </td>
            <td class="px-3 py-2 text-right">${formatNumber(
              item.item_total
            )}</td>
            <td class="px-3 py-2 text-center">
              <input class="plancosting text-right border rounded px-2 py-1 w-full"
                type="number" placeholder="0" value="${item.plan_total}">
            </td>
            <td class="px-3 py-2 text-right font-bold text-red-600">
              <div class="flex items-center justify-end gap-2">
                <span>${formatNumber(item.actual_total)}</span>
                <button class="view-actual-cost-btn" data-korelasi="${
                  item.product
                }">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7
                      c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4
                      4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </td>
            <td class="px-3 py-2 text-center">${data.start_date || "N/A"}</td>
            <td class="px-3 py-2 text-center">
              <button class="update-plan bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">Update</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      });
    }

    // ---- (4) EVENT UPDATE PLAN COSTING (TAB 1) ----
    document.querySelectorAll(".update-plan").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const tr = e.target.closest("tr");
        const itemId = tr.dataset.itemId;
        const input = tr.querySelector(".plancosting");
        const planTotal = parseFloat(input.value) || 0;

        const confirm = await Swal.fire({
          title: "Yakin Update?",
          text: `Update Plan Costing untuk item ID ${itemId}?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya, Update",
        });
        if (!confirm.isConfirmed) return;

        Swal.fire({
          title: "Memproses...",
          text: "Sedang mengupdate data plan costing...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const response = await fetch(
            `${baseUrl}/update/plan_costing/${itemId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_TOKEN}`,
              },
              body: JSON.stringify({
                project_id: projectDetailData.project_id,
                plan_total: planTotal,
              }),
            }
          );
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.message || "Gagal memperbarui data.");

          // 🔽 PERBAIKAN: Refresh data project *sebelum* notif sukses
          await fetchProjectDetail(projectDetailData.project_id);
          // Update kartu ringkasan
          document.getElementById("plan_costing").innerHTML = formatNumber(
            projectDetailData.plan_costing
          );
          document.getElementById("actual_costing").innerHTML = formatNumber(
            projectDetailData.actual_cost
          );
          document.getElementById("margin").innerHTML = formatNumber(
            projectDetailData.margin
          );

          Swal.fire(
            "Berhasil!",
            "Plan Costing berhasil diperbarui ✅",
            "success"
          );
        } catch (error) {
          console.error("Error update plan costing:", error);
          Swal.fire("Gagal!", error.message || "Terjadi kesalahan.", "error");
        }
      });
    });

    // ---- (5) POPULASI DROPDOWN KORELASI (TAB 2) ----
    populateCorrelationDropdown(data.items);
  } catch (err) {
    console.error("Gagal me-render data:", err);
    Swal.fire("Error", "Gagal me-render data project: " + err.message, "error");
  }
}

// ================================================================
// FUNGSI UNTUK TAB 2 (REAL CALCULATION)
// ================================================================

/**
 * Mengisi dropdown "Korelasi (Pekerjaan)" di form Tab 2
 */
function populateCorrelationDropdown(projectItems) {
  const select = document.getElementById("calcKorelasi");
  select.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>';
  if (!projectItems) return;
  projectItems.forEach((item) => {
    select.innerHTML += `<option value="${item.project_item_id}">${item.product}</option>`;
  });
}

/**
 * 🔽 PERBAIKAN: Memuat tabel actual costing (Tab 2).
 * try/catch dihapus agar error bisa ditangkap oleh fungsi pemanggil.
 */
async function loadActualCostingTable() {
  if (!projectDetailData || !projectDetailData.project_id) {
    console.warn("Project ID belum ada, load actual cost ditunda.");
    return;
  }
  const projectId = projectDetailData.project_id;
  const currentPage = 1;

  const res = await fetch(
    `${baseUrl}/table/actual_costing/${projectId}/${currentPage}`,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );
  if (!res.ok) {
    throw new Error(`Gagal mengambil data actual costing: ${res.statusText}`);
  }
  const result = await res.json();
  if (result.success && result.tableData) {
    realCalculationData = result.tableData;
    loadRealCalculationDetails(realCalculationData); // Panggil render
  } else {
    // Biarkan error ini "melempar"
    throw new Error(result.message || "Data actual costing tidak ditemukan");
  }
}

/**
 * Merender baris-baris data di tabel Tab 2
 */
function loadRealCalculationDetails(details) {
  const tbody = document.getElementById("realCalcBody");
  tbody.innerHTML = "";
  if (details && details.length > 0) {
    details.forEach((data) => {
      tbody.innerHTML += `
        <tr class="border-b" id="cost-row-${data.cost_id}">
          <td class="px-3 py-2">${data.cost_name}</td>
          <td class="px-3 py-2">${data.product}</td>
          <td class="px-3 py-2 text-center">${data.qty}</td>
          <td class="px-3 py-2 text-center">${data.unit}</td>
          <td class="px-3 py-2 text-right">${formatNumber(data.unit_price)}</td>
          <td class="px-3 py-2 text-right">${formatNumber(data.total)}</td>
          <td class="px-3 py-2 text-center space-x-2">
            <button class="update-cost-btn text-lg" data-cost-id="${
              data.cost_id
            }" title="Update">✏️</button>
            <button class="delete-cost-btn text-lg" data-cost-id="${
              data.cost_id
            }" title="Delete">🗑️</button>
          </td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>';
  }
}

/**
 * Menghitung total (Qty * Harga Satuan) di form secara otomatis
 */
function updateCalcTotal() {
  const qty = parseFloat(document.getElementById("calcQty").value) || 0;
  const unitPrice =
    parseFloat(document.getElementById("calcUnitPrice").value) || 0;
  const total = qty * unitPrice;

  if (typeof formatNumber === "function") {
    document.getElementById("calcTotalDisplay").value = formatNumber(total);
  } else {
    document.getElementById("calcTotalDisplay").value = total;
  }
}

/**
 * Mengembalikan form Tab 2 ke mode "Tambah Data"
 */
function resetCalcForm() {
  document.getElementById("realCalcForm").reset();
  document.getElementById("calcQty").value = "1";
  currentUpdateCostId = null;

  const submitBtn = document.getElementById("submitCalcFormBtn");
  submitBtn.textContent = "+ Tambah Data";
  submitBtn.classList.remove("bg-green-600", "hover:bg-green-700");
  submitBtn.classList.add("bg-blue-600", "hover:bg-blue-700");

  document.getElementById("cancelUpdateBtn").classList.add("hidden");
  updateCalcTotal();
}

/**
 * Mengisi form Tab 2 dengan data untuk "Mode Update"
 */
function populateFormForUpdate(costId) {
  const item = realCalculationData.find((d) => d.cost_id === costId);
  if (!item) {
    Swal.fire("Error", "Data item tidak ditemukan.", "error");
    return;
  }

  currentUpdateCostId = costId;

  document.getElementById("calcTanggal").value =
    item.payment_date || new Date().toISOString().split("T")[0];
  document.getElementById("calcProduct").value = item.cost_name;
  document.getElementById("calcKorelasi").value = item.project_item_id;
  document.getElementById("calcQty").value = item.qty;
  document.getElementById("calcUnit").value = item.unit;
  document.getElementById("calcUnitPrice").value = item.unit_price;

  const submitBtn = document.getElementById("submitCalcFormBtn");
  submitBtn.textContent = "💾 Update Data";
  submitBtn.classList.add("bg-green-600", "hover:bg-green-700");
  submitBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");

  document.getElementById("cancelUpdateBtn").classList.remove("hidden");

  updateCalcTotal();
  document
    .getElementById("realCalcForm")
    .scrollIntoView({ behavior: "smooth" });
}

/**
 * 🔽 BARU: Helper untuk mengambil & memvalidasi data form Tab 2
 * Mengembalikan 'payload' jika valid, atau 'null' jika tidak.
 */
function getAndValidateCalcForm() {
  const tanggal = document.getElementById("calcTanggal").value;
  const name = document.getElementById("calcProduct").value;
  const project_item_id = document.getElementById("calcKorelasi").value;
  const qty = document.getElementById("calcQty").value;
  const unit = document.getElementById("calcUnit").value;
  const unit_price = document.getElementById("calcUnitPrice").value;

  const project_id = projectDetailData.project_id;
  const total = (parseFloat(qty) || 0) * (parseFloat(unit_price) || 0);

  if (!name || !project_item_id || !qty || !unit || !unit_price || total <= 0) {
    Swal.fire(
      "Gagal",
      "Harap isi semua field (Nama, Korelasi, Qty, Unit, Harga Satuan) dengan benar.",
      "warning"
    );
    return null;
  }

  return {
    project_id: project_id,
    project_item_id: parseInt(project_item_id),
    name: name,
    unit: unit,
    qty: qty.toString(),
    unit_price: unit_price.toString(),
    total: total.toString(),
    payment_date: tanggal,
  };
}

/**
 * 🔽 PERBAIKAN: Logika untuk Submit (Create)
 * Disederhanakan dengan helper dan logika Swal yang diperbaiki.
 */
async function handleAddActualCost() {
  const payload = getAndValidateCalcForm();
  if (!payload) return; // Validasi gagal

  Swal.fire({
    title: "Menyimpan...",
    text: "Menambahkan data actual cost...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 1. Kirim data
    const res = await fetch(`${baseUrl}/add/actual_costing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok)
      throw new Error(result.message || "Gagal menyimpan data ke server.");

    // 2. Refresh semua data (await)
    await refreshAllProjectData();

    // 3. Tampilkan sukses HANYA JIKA SEMUA berhasil
    Swal.fire("Berhasil!", "Data pengeluaran berhasil ditambahkan.", "success");
    resetCalcForm();
  } catch (error) {
    console.error("Gagal submit actual cost:", error);
    Swal.fire("Gagal!", error.message || "Terjadi kesalahan.", "error");
  }
}

/**
 * 🔽 PERBAIKAN: Logika untuk Submit (Update)
 * Disederhanakan dengan helper dan logika Swal yang diperbaiki.
 */
async function handleUpdateActualCost(costId) {
  const payload = getAndValidateCalcForm();
  if (!payload) return; // Validasi gagal

  Swal.fire({
    title: "Mengupdate...",
    text: "Menyimpan perubahan data...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 1. Kirim data
    const res = await fetch(`${baseUrl}/update/actual_costing/${costId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal mengupdate data.");

    // 2. Refresh semua data (await)
    await refreshAllProjectData();

    // 3. Tampilkan sukses HANYA JIKA SEMUA berhasil
    Swal.fire("Berhasil!", "Data berhasil diperbarui.", "success");
    resetCalcForm();
  } catch (error) {
    console.error("Gagal update actual cost:", error);
    Swal.fire("Gagal!", error.message || "Terjadi kesalahan.", "error");
  }
}

/**
 * 🔽 PERBAIKAN: Logika untuk Delete
 * Logika Swal diperbaiki.
 */
async function handleDeleteActualCost(costId) {
  const confirm = await Swal.fire({
    title: "Yakin Hapus Data?",
    text: "Data yang dihapus tidak dapat dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    confirmButtonColor: "#d33",
    cancelButtonText: "Batal",
  });
  if (!confirm.isConfirmed) return;

  Swal.fire({
    title: "Menghapus...",
    text: "Sedang menghapus data...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 1. Kirim data
    const res = await fetch(`${baseUrl}/delete/actual_costing/${costId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal menghapus.");

    // 2. Refresh semua data (await)
    await refreshAllProjectData();

    // 3. Tampilkan sukses HANYA JIKA SEMUA berhasil
    Swal.fire("Terhapus!", "Data berhasil dihapus.", "success");
    // (Tidak perlu reset form saat delete)
  } catch (error) {
    console.error("Gagal delete actual cost:", error);
    Swal.fire("Gagal!", error.message || "Terjadi kesalahan.", "error");
  }
}

// ================================================================
// FUNGSI MODAL (TOMBOL MATA)
// ================================================================
function showActualCostDetail(korelasi) {
  const details = realCalculationData.filter(
    (item) => item.product === korelasi
  );

  let htmlContent = "";
  if (details.length === 0) {
    htmlContent =
      '<p class="text-center text-gray-500">Tidak ada data detail untuk item ini.</p>';
  } else {
    htmlContent = `
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-3 py-2">Nama Item / Jasa</th>
            <th class="px-3 py-2 text-center">Qty</th>
            <th class="px-3 py-2 text-center">Unit</th>
            <th class="px-3 py-2 text-right">Harga Satuan</th>
            <th class="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    let total = 0;
    details.forEach((item) => {
      htmlContent += `
        <tr class="border-b">
          <td class="px-3 py-2">${item.cost_name}</td>
          <td class="px-3 py-2 text-center">${item.qty}</td>
          <td class="px-3 py-2 text-center">${item.unit}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.unit_price)}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.total)}</td>
        </tr>
      `;
      total += item.total;
    });
    htmlContent += `
        </tbody>
        <tfoot class="font-bold">
          <tr><td colspan="4" class="px-3 py-2 text-right">Total:</td>
          <td class="px-3 py-2 text-right">${formatNumber(total)}</td></tr>
        </tfoot>
      </table>
    `;
  }

  Swal.fire({
    title: `Detail Actual Costing: "${korelasi}"`,
    html: htmlContent,
    width: "800px",
    confirmButtonText: "Tutup",
  });
}

// ================================================================
// FUNGSI-FUNGSI UNTUK TAB 3 (Tidak berubah)
// ================================================================
function setNewProjectTodayDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("new_tanggal").value = today;
}

async function loadNewProjectCustomerList() {
  try {
    const response = await fetch(`${baseUrl}/client/sales/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Gagal mengambil data client");
    const result = await response.json();
    const customerList = result.data || [];

    const select = document.getElementById("new_client");
    select.innerHTML = `<option value="">-- Pilih Client --</option>`;

    customerList.forEach((item) => {
      select.innerHTML += `<option value="${item.client_id}">${item.nama_client} (${item.alias})</option>`;
    });

    select.addEventListener("change", function () {
      document.getElementById("new_client_id").value = this.value;
    });
  } catch (error) {
    console.error("Error load client untuk Tab 3:", error);
    const select = document.getElementById("new_client");
    select.innerHTML = `<option value="">Gagal load client</option>`;
  }
}

async function saveNewProject() {
  try {
    const project_name = document.getElementById("new_project_name").value;
    const client_id = document.getElementById("new_client_id").value;
    const pic_name = document.getElementById("new_pic_name").value;
    const start_date = document.getElementById("new_tanggal").value;

    if (!project_name || !client_id) {
      Swal.fire("Gagal", "Nama Project dan Client wajib diisi", "error");
      return;
    }

    Swal.fire({
      title: "Menyimpan...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const formData = new FormData();
    formData.append("owner_id", user.owner_id);
    formData.append("user_id", user.user_id);
    formData.append("project_name", project_name);
    formData.append("pelanggan_id", client_id);
    formData.append("pic_name", pic_name);
    formData.append("start_date", start_date);
    formData.append("status_project", "Baru");

    const res = await fetch(`${baseUrl}/add/project`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });

    const json = await res.json();

    if (res.ok) {
      Swal.fire("Sukses", "Project baru berhasil dibuat", "success");
      document.getElementById("new_project_name").value = "";
      document.getElementById("new_client").value = "";
      document.getElementById("new_pic_name").value = "";
      setNewProjectTodayDate();
      switchTab(tab1, tab1Btn);
    } else {
      Swal.fire("Gagal", json.message || "Gagal menyimpan data", "error");
    }
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Error", err.message || "Terjadi kesalahan", "error");
  }
}

// ================================================================
// EVENT LISTENERS
// ================================================================

// Listener untuk auto-calculate total di form Tab 2
document.getElementById("calcQty").addEventListener("input", updateCalcTotal);
document
  .getElementById("calcUnitPrice")
  .addEventListener("input", updateCalcTotal);

// Listener untuk tombol Batal di form Tab 2
document
  .getElementById("cancelUpdateBtn")
  .addEventListener("click", resetCalcForm);

// Listener untuk submit form Tab 2 (Create / Update)
document
  .getElementById("realCalcForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    if (currentUpdateCostId) {
      await handleUpdateActualCost(currentUpdateCostId);
    } else {
      await handleAddActualCost();
    }
  });

// Listener untuk klik di dalam tabel Tab 2 (Update / Delete)
document
  .getElementById("realCalcBody")
  .addEventListener("click", function (event) {
    const updateBtn = event.target.closest(".update-cost-btn");
    const deleteBtn = event.target.closest(".delete-cost-btn");

    if (updateBtn) {
      const costId = parseInt(updateBtn.dataset.costId);
      populateFormForUpdate(costId);
    }

    if (deleteBtn) {
      const costId = parseInt(deleteBtn.dataset.costId);
      handleDeleteActualCost(costId);
    }
  });

// Listener untuk klik di dalam tabel Tab 1 (Tombol Mata / Plan Costing)
document
  .getElementById("tabelItem")
  .addEventListener("click", function (event) {
    const eyeButton = event.target.closest(".view-actual-cost-btn");
    if (eyeButton) {
      const korelasi = eyeButton.dataset.korelasi;
      showActualCostDetail(korelasi);
    }
  });

document
  .getElementById("tabelItem")
  .addEventListener("input", function (event) {
    if (event.target.classList.contains("plancosting")) {
      // (Logika untuk 'temp_plan_costing' tetap sama)
      const inputElement = event.target;
      const newCost = parseInt(inputElement.value) || 0;
      const itemId = parseInt(inputElement.closest("tr").dataset.itemId);
      if (!projectDetailData || !projectDetailData.items) return;
      const itemToUpdate = projectDetailData.items.find(
        (item) => item.project_item_id === itemId
      );
      if (itemToUpdate) {
        itemToUpdate.temp_plan_costing = newCost;
      }
    }
  });

// Listener untuk tombol Simpan di Tab 3
document
  .getElementById("saveProjectBtn")
  .addEventListener("click", saveNewProject);

// ================================================================
// PEMANGGILAN FUNGSI AWAL
// ================================================================
loadDetailProject();
updateCalcTotal();
