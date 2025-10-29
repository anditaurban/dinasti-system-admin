pagemodule = "Project";
subpagemodule = "Project Costing";
// renderHeader(); // Diasumsikan sudah ada dari file lain

// ================================================================
// VARIABEL GLOBAL (PENGGANTI MOCK DATA)
// ================================================================
// Variabel ini akan diisi oleh data dari API saat load
projectDetailData = null;
// Variabel ini akan dibangun dari data API, lalu bisa ditambah/dimodifikasi
realCalculationData = [];

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
async function loadDetailProject() {
  // Ambil ID dari window (diasumsikan di-set oleh skrip global)
  // Fallback ke '5' sesuai contoh endpoint Anda untuk testing
  const projectId = window.detail_id || 5;

  if (!projectId) {
    alert("Project ID tidak ditemukan.");
    return;
  }

  // Asumsi baseUrl dan API_TOKEN tersedia secara global
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

    // Simpan data API ke variabel global
    projectDetailData = response.detail;

    // Panggil fungsi render yang sekarang terpisah
    renderProjectData();
  } catch (err) {
    console.error("Gagal memuat detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail project", "error");
  }
}

// ================================================================
// FUNGSI RENDER (MENGGUNAKAN DATA DARI VARIABEL GLOBAL)
// ================================================================
function renderProjectData() {
  try {
    const data = projectDetailData; // Baca dari variabel global
    if (!data) throw new Error("Data project belum dimuat");

    // 1. (RE)BUILD ARRAY REAL CALCULATION
    // Ini penting agar modal & Tab 2 selalu update
    realCalculationData = []; // Kosongkan array global
    if (data.items) {
      data.items.forEach((item) => {
        if (item.materials && item.materials.length > 0) {
          // Jika item punya material, ambil dari material
          item.materials.forEach((mat) => {
            realCalculationData.push({
              id: mat.project_materials_id,
              tanggal: mat.payment_date || data.start_date || "N/A",
              product: mat.name,
              korelasi: item.product, // Korelasi ke nama item induk
              harga: mat.actual_total || 0,
            });
          });
        } else if (item.actual_total > 0) {
          // Jika item tidak punya material tapi punya nilai, item itu sendiri adalah biayanya
          realCalculationData.push({
            id: item.project_item_id,
            tanggal: item.payment_date || data.start_date || "N/A",
            product: item.product,
            korelasi: item.product, // Korelasi ke dirinya sendiri
            harga: item.actual_total || 0,
          });
        }
      });
    }

    // 2. UPDATE KARTU RINGKASAN ATAS
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

    // 3. UPDATE INFO DETAIL PROJECT
    document.getElementById("detailNoQO").textContent = "---"; // API tidak menyediakan
    document.getElementById("detailNoInv").textContent = "---"; // API tidak menyediakan
    document.getElementById("detailNoPO").textContent =
      data.project_number || "---";
    document.getElementById("detailPIC").textContent =
      data.project_manager_name || "---";

    // 4. RENDER TABEL ITEM DI TAB 1
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
        tbody.innerHTML += `<tr class="bg-gray-200 font-semibold"><td colspan="10" class="px-3 py-2 uppercase">${
          subCat || "-"
        }</td></tr>`;

        groups[subCat].forEach((item) => {
          const tr = document.createElement("tr");
          tr.className = "border-b";
          tr.dataset.itemId = item.project_item_id; // Gunakan ID dari API

          // Hitung total plan dan actual per item (dari material atau dari item itu sendiri)
          const item_plan_costing =
            item.temp_plan_costing !== undefined
              ? item.temp_plan_costing // Gunakan nilai yg diedit jika ada
              : item.materials.reduce((s, m) => s + (m.costing || 0), 0) ||
                item.costing ||
                0;

          const item_actual_costing =
            item.materials.reduce((s, m) => s + (m.actual_total || 0), 0) ||
            item.actual_total ||
            0;
          const item_project_value =
            item.materials.reduce((s, m) => s + (m.total || 0), 0) ||
            item.total ||
            0;

          tr.innerHTML = `
            <td class="px-3 py-2 text-center align-top">${nomor++}</td>
            <td class="px-3 py-2 align-top">
              <div class="font-medium">${item.product || "-"}</div>
              <div class="text-xs text-gray-500">${item.description || ""}</div>
            </td>
            <td class="px-3 py-2 text-right align-top">${item.qty || 0}</td>
            <td class="px-3 py-2 text-left align-top">${item.unit || ""}</td>
            <td class="px-3 py-2 text-right align-top">${formatNumber(
              item.unit_price
            )}</td> 
            <td class="px-3 py-2 text-right align-top">${formatNumber(
              item.item_total
            )}</td>
            <td class="px-3 py-2 text-center align-top">
              <input class="plancosting text-right border rounded px-2 py-1 w-full" type="number" placeholder="0" value="${
                item.plan_total
              }">
            </td>
            
            <td class="px-3 py-2 text-right font-bold text-red-600 align-top">
              <div class="flex items-center justify-end gap-2">
                <span>${formatNumber(item_actual_costing)}</span>
                <button class="view-actual-cost-btn" data-korelasi="${
                  item.product
                }" title="Lihat Detail">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                </button>
              </div>
            </td>
            
            <td class="px-3 py-2 text-center align-top">${
              data.start_date || "N/A"
            }</td>
            
            <td class="px-3 py-2 text-center align-top">
              <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">Update</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
    }

    // 5. PANGGIL FUNGSI UNTUK TAB 2 & 3
    populateCorrelationDropdown(data.items);
    loadRealCalculationDetails(realCalculationData); // Render Tab 2 dengan data yg baru dibangun
    loadNewProjectCustomerList();
    setNewProjectTodayDate();
  } catch (err) {
    console.error("Gagal me-render data:", err);
    alert("Gagal me-render data project: " + err.message);
  }
}

// ================================================================
// FUNGSI UNTUK TAB 2
// ================================================================
function populateCorrelationDropdown(projectItems) {
  const select = document.getElementById("calcKorelasi");
  select.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>';
  if (!projectItems) return;
  projectItems.forEach((item) => {
    select.innerHTML += `<option value="${item.product}">${item.product}</option>`;
  });
}

function loadRealCalculationDetails(details) {
  const tbody = document.getElementById("realCalcBody");
  tbody.innerHTML = "";
  if (details && details.length > 0) {
    details.forEach((data) => {
      tbody.innerHTML += `
        <tr class="border-b">
          <td class="px-3 py-2">${data.tanggal}</td>
          <td class="px-3 py-2">${data.product}</td>
          <td class="px-3 py-2">${data.korelasi}</td>
          <td class="px-3 py-2 text-right">${formatNumber(data.harga)}</td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>';
  }
}

// ================================================================
// FUNGSI UNTUK MENGHITUNG ULANG ACTUAL COST (CLIENT-SIDE)
// ================================================================
function updateActualCosting() {
  let totalActualCost = 0;

  if (!projectDetailData || !projectDetailData.items) return;

  // Loop melalui item di data global
  projectDetailData.items.forEach((item) => {
    // Filter dari array realCalculationData global
    const relatedExpenses = realCalculationData.filter(
      (expense) => expense.korelasi === item.product
    );
    // Hitung total untuk item ini
    const totalActualCostForItem = relatedExpenses.reduce(
      (sum, expense) => sum + expense.harga,
      0
    );

    // Update HTML di tabel Tab 1 secara manual
    const row = document.querySelector(
      `button[data-korelasi="${item.product}"]`
    );
    if (row) {
      const span = row.closest("td").querySelector("span");
      if (span) {
        span.textContent = formatNumber(totalActualCostForItem);
      }
    }
    totalActualCost += totalActualCostForItem;
  });

  // Update kartu header
  document.getElementById("actual_costing").innerHTML =
    formatNumber(totalActualCost);
  const margin = (projectDetailData.project_value || 0) - totalActualCost;
  document.getElementById("margin").innerHTML = formatNumber(margin);
}

// ================================================================
// FUNGSI MODAL (TOMBOL MATA)
// ================================================================
function showActualCostDetail(korelasi) {
  // Baca dari array global yang sudah di-update
  const details = realCalculationData.filter(
    (item) => item.korelasi === korelasi
  );

  let htmlContent = "";
  if (details.length === 0) {
    htmlContent =
      '<p class="text-center text-gray-500">Tidak ada data detail untuk item ini.</p>';
  } else {
    htmlContent = `
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-100">
          <tr><th class="px-3 py-2">Tanggal</th><th class="px-3 py-2">Product / Item</th><th class="px-3 py-2 text-right">Harga</th></tr>
        </thead>
        <tbody>
    `;
    let total = 0;
    details.forEach((item) => {
      htmlContent += `
        <tr class="border-b">
          <td class="px-3 py-2">${item.tanggal}</td>
          <td class="px-3 py-2">${item.product}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.harga)}</td>
        </tr>
      `;
      total += item.harga;
    });
    htmlContent += `
        </tbody>
        <tfoot class="font-bold">
          <tr><td colspan="2" class="px-3 py-2 text-right">Total:</td><td class="px-3 py-2 text-right">${formatNumber(
            total
          )}</td></tr>
        </tfoot>
      </table>
    `;
  }

  if (typeof Swal === "undefined") {
    alert("Library SweetAlert2 (Swal) tidak ditemukan.");
    return;
  }

  Swal.fire({
    title: `Detail Actual Costing: "${korelasi}"`,
    html: htmlContent,
    width: "600px",
    confirmButtonText: "Tutup",
  });
}

// ================================================================
// EVENT LISTENERS UNTUK INTERAKSI
// ================================================================

// Listener Form Input Tab 2
document
  .getElementById("realCalcForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const tanggal = document.getElementById("calcTanggal").value;
    const product = document.getElementById("calcProduct").value;
    const korelasi = document.getElementById("calcKorelasi").value;
    const harga = parseInt(document.getElementById("calcHarga").value) || 0;
    if (!tanggal || !product || !korelasi || harga <= 0) {
      alert("Harap isi semua field dengan benar.");
      return;
    }

    // Tambahkan ke array global
    realCalculationData.push({
      id: Date.now(),
      tanggal,
      product,
      korelasi,
      harga,
    });
    this.reset();

    const notif = document.getElementById("notification");
    notif.textContent = "Detail pengeluaran berhasil ditambahkan!";
    notif.classList.remove("hidden");
    setTimeout(() => notif.classList.add("hidden"), 2000);

    // Render ulang tabel Tab 2
    loadRealCalculationDetails(realCalculationData);
    // Hitung ulang dan update nilai di Tab 1
    updateActualCosting();
  });

// Listener Tabel Tab 1 (Input Plan Costing & Tombol Mata)
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
      const inputElement = event.target;
      const newCost = parseInt(inputElement.value) || 0;
      const itemId = parseInt(inputElement.closest("tr").dataset.itemId);

      if (!projectDetailData || !projectDetailData.items) return;

      const itemToUpdate = projectDetailData.items.find(
        (item) => item.project_item_id === itemId
      );
      if (itemToUpdate) {
        // Simpan nilai yang diedit ke properti sementara
        itemToUpdate.temp_plan_costing = newCost;
      }

      // Hitung ulang total Plan Costing
      const totalPlanCost = projectDetailData.items.reduce((sum, item) => {
        if (item.temp_plan_costing !== undefined) {
          return sum + item.temp_plan_costing;
        }
        // Jika belum diedit, hitung dari data asli
        const itemCost =
          item.materials.reduce((s, m) => s + (m.costing || 0), 0) ||
          item.costing ||
          0;
        return sum + itemCost;
      }, 0);

      // Update kartu header
      projectDetailData.plan_costing = totalPlanCost; // Update data global
      document.getElementById("plan_costing").textContent =
        formatNumber(totalPlanCost);
    }
  });

// ================================================================
// FUNGSI-FUNGSI UNTUK TAB 3
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
      switchTab(tab1, tab1Btn); // Kembali ke Tab 1

      // Jika ini adalah bagian dari sistem modul, idealnya panggil fungsi global
      // untuk me-refresh daftar project, contoh: loadModuleContent('project_list');
    } else {
      Swal.fire("Gagal", json.message || "Gagal menyimpan data", "error");
    }
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Error", err.message || "Terjadi kesalahan", "error");
  }
}

document
  .getElementById("saveProjectBtn")
  .addEventListener("click", saveNewProject);

// ================================================================
// PEMANGGILAN FUNGSI AWAL
// ================================================================
// Panggil fungsi ini saat script pertama kali dimuat
loadDetailProject();
