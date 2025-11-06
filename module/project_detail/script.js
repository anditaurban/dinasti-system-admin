pagemodule = "Project";
subpagemodule = "Project Costing";
renderHeader();

// ================================================================
// VARIABEL GLOBAL
// ================================================================
projectDetailData = null; // Menyimpan data /detail/project/{id}
realCalculationData = []; // Menyimpan data untuk tabel Tab 2
dataItemDropdown = [];
actualCostCurrentPage = 1;
currentUpdateCostId = null;
currentMode = "view";
customerList = [];

// ================================================================
// PENGATURAN TAB
// ================================================================
tab1 = document.getElementById("tab1");
tab2 = document.getElementById("tab2");
tab1Btn = document.getElementById("tab1Btn");
tab2Btn = document.getElementById("tab2Btn");
document
  .getElementById("cancelUpdateBtn")
  .addEventListener("click", resetCalcForm);

function switchTab(activeTab, activeBtn) {
  [tab1, tab2].forEach((tab) => tab.classList.add("hidden"));
  [tab1Btn, tab2Btn].forEach((btn) => {
    btn.classList.remove("border-blue-600", "text-blue-600");
    btn.classList.add("text-gray-500");
  });
  activeTab.classList.remove("hidden");
  activeBtn.classList.add("border-blue-600", "text-blue-600");
  activeBtn.classList.remove("text-gray-500");
}
tab1Btn.addEventListener("click", () => switchTab(tab1, tab1Btn));
tab2Btn.addEventListener("click", () => switchTab(tab2, tab2Btn));

// ================================================================
// FUNGSI UTAMA (LOAD DATA)
// ================================================================
loadDetailSales(window.detail_id, window.detail_desc);

async function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  if (Id) {
    currentMode = "view";
  } else {
    currentMode = "add";
  }

  // Ambil elemen-elemen UI
  const addProjectForm = document.getElementById("addProjectForm");
  const viewProjectCards = document.getElementById("viewProjectCards");
  const savePlanCostBtn = document.getElementById("saveAllPlanCostBtn");
  const addItemBtn = document.getElementById("addItemBtn");
  const saveNewProjectBtn = document.getElementById("saveNewProjectBtn");
  const viewModeContainer = document.getElementById("viewModeContainer");
  const addModeContainer = document.getElementById("addModeContainer");

  // ----------------------------------------------------------------
  // ➡️ A. LOGIKA MODE TAMBAH (ADD MODE)
  // ----------------------------------------------------------------
  if (currentMode === "add") {
    // Atur visibilitas UI
    tab2Btn.classList.add("hidden");
    if (addProjectForm) addProjectForm.classList.remove("hidden");
    if (viewProjectCards) viewProjectCards.classList.add("hidden");
    if (savePlanCostBtn) savePlanCostBtn.classList.add("hidden");
    // if (addItemBtn) addItemBtn.classList.remove("hidden"); // Tombol dari QO
    if (saveNewProjectBtn) saveNewProjectBtn.classList.remove("hidden");
    if (viewModeContainer) viewModeContainer.classList.add("hidden");
    if (addModeContainer) addModeContainer.classList.remove("hidden");

    // Pastikan Tab 1 aktif
    switchTab(tab1, tab1Btn);

    // Ganti teks judul
    document.getElementById("projectNameDisplay").textContent =
      "Buat Project Baru";

    // Kosongkan tabel 'add mode'
    document.getElementById("tabelItemAdd").innerHTML = "";

    // Inisialisasi form 'add mode' (dari QO)
    setTodayDate("add_tanggal"); // Set tanggal ke input baru
    loadSalesType("add_type_id"); // Load tipe ke select baru
    loadCustomerList("add_client"); // Load client ke select baru

    // Tambahkan listener untuk diskon & ppn (dari QO)
    document
      .getElementById("discount")
      ?.addEventListener("input", calculateTotals);
    document
      .getElementById("cekPpn")
      ?.addEventListener("change", calculateTotals);
  }
  // ----------------------------------------------------------------
  // ➡️ B. LOGIKA MODE LIHAT (VIEW MODE)
  // ----------------------------------------------------------------
  else {
    // Atur visibilitas UI
    tab2Btn.classList.remove("hidden");
    if (addProjectForm) addProjectForm.classList.add("hidden");
    if (viewProjectCards) viewProjectCards.classList.remove("hidden");
    if (savePlanCostBtn) savePlanCostBtn.classList.remove("hidden");
    if (addItemBtn) addItemBtn.classList.add("hidden");
    if (saveNewProjectBtn) saveNewProjectBtn.classList.add("hidden");
    if (viewModeContainer) viewModeContainer.classList.remove("hidden");
    if (addModeContainer) addModeContainer.classList.add("hidden");

    Swal.fire({
      title: "Memuat Data Project...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // 🔹 Fetch detail project dari API (Kode asli Anda)
      const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      const response = await res.json();
      if (!response.success || !response.detail) {
        throw new Error(response.message || "Struktur data API tidak valid");
      }
      projectDetailData = response.detail;
      const data = projectDetailData;

      // 🔹 Tampilkan info card
      document.getElementById("projectNameDisplay").textContent =
        data.project_name || "Project Detail";
      document.getElementById("projectAmount").innerHTML =
        finance(data.project_value) || 0;
      document.getElementById("plan_costing").innerHTML =
        finance(data.plan_costing) || 0;
      document.getElementById("actual_costing").innerHTML =
        finance(data.actual_cost) || 0;
      document.getElementById("margin").innerHTML = finance(data.margin) || 0;

      // 🔹 Render tabel 'view mode'
      const tbody = document.getElementById("tabelItemView");
      tbody.innerHTML = "";

      if (data.items?.length) {
        const groups = {};
        data.items.forEach((item) => {
          if (!groups[item.sub_category]) groups[item.sub_category] = [];
          groups[item.sub_category].push(item);
        });
        let nomor = 1;
        Object.keys(groups).forEach((subCat) => {
          const trHeader = document.createElement("tr");
          trHeader.className = "bg-gray-200 font-semibold";
          trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase">${
            subCat || "-"
          }</td>`;
          tbody.appendChild(trHeader);

          groups[subCat].forEach((item) => {
            const tr = document.createElement("tr");
            tr.className = "border-b bg-gray-50";
            tr.dataset.itemId = item.project_item_id;
            tr.innerHTML = `
              <td class="px-3 py-2 align-top text-sm font-semibold">${nomor++}</td>
              <td class="px-3 py-2 align-top">
                <div class="font-medium">${item.product || "-"}</div>
                <div class="text-xs text-gray-500">${
                  item.description || ""
                }</div>
              </td>
              ${
                item.materials?.length
                  ? `<td colspan="6" class="px-3 py-2 text-left text-gray-500 italic text-xs"></td>`
                  : `
                    <td class="px-3 py-2 text-right align-top">${
                      item.qty || 0
                    }</td>
                    <td class="px-3 py-2 text-center align-top">${
                      item.unit || ""
                    }</td>
                    <td class="px-3 py-2 text-right align-top">${formatNumber(
                      item.unit_price
                    )}</td>
                    <td class="px-3 py-2 text-right align-top">${formatNumber(
                      item.item_total
                    )}</td>
                    <td class="px-3 py-2 text-center align-top">
                      <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${formatNumber(
                        item.plan_total
                      )}">
                    </td>
                    <td class="px-3 py-2 text-center align-top">
                      <div class="formatNumber flex items-center justify-end gap-2 text-red-600 font-bold">
                        <span>${formatNumber(item.actual_total)}</span>
                        <button class="view-actual-cost-btn" data-korelasi="${
                          item.product
                        }" title="Lihat Detail">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                        </button>
                      </div>
                    </td>
                  `
              }
            `;
            tbody.appendChild(tr);

            if (item.materials?.length) {
              item.materials.forEach((m, mIdx) => {
                const subTr = document.createElement("tr");
                subTr.className = "border-b bg-gray-50 text-sm";
                subTr.dataset.materialId = m.project_materials_id;
                subTr.innerHTML = `
                  <td class="px-3 py-1"></td>
                  <td class="px-3 py-1 italic">
                    ${mIdx + 1}. ${m.name || ""} - ${m.specification || ""}
                  </td>
                  <td class="px-3 py-1 text-right">${m.qty || 0}</td>
                  <td class="px-3 py-1 text-center">${m.unit || ""}</td>
                  <td class="px-3 py-1 text-right">${formatNumber(
                    m.unit_price || 0
                  )}</td>
                  <td class="px-3 py-1 text-right">${formatNumber(
                    m.material_total || 0
                  )}</td>
                  <td class="px-3 py-1 text-center">
                    <input class="formatNumber plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${formatNumber(
                      m.plan_total || 0
                    )}">
                  </td>
                  <td class="px-3 py-1 text-center">
                    <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
                      <span>${formatNumber(m.actual_total || 0)}</span>
                      <button class="view-actual-cost-btn" data-korelasi="${
                        item.product
                      }" title="Lihat Detail">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                      </button>
                    </div>
                  </td>
                `;
                tbody.appendChild(subTr);
              });
            }
          });
        });
      } else {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
      }

      tbody.querySelectorAll(".plancosting").forEach((input) => {
        input.addEventListener("input", (e) => {
          // Ambil nilai & posisi kursor
          let value = e.target.value;
          let cursorPosition = e.target.selectionStart;
          let originalLength = value.length; // Hapus semua selain angka

          const numericValue = value.replace(/\D/g, ""); // Format dengan titik

          const formattedValue = numericValue.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            "."
          ); // Set nilai baru

          e.target.value = formattedValue; // Hitung perbedaan panjang untuk menyesuaikan kursor

          let newLength = formattedValue.length;
          let lengthDifference = newLength - originalLength; // Set posisi kursor baru agar tidak loncat ke akhir

          if (
            e.target.selectionEnd === originalLength ||
            cursorPosition === originalLength
          ) {
            e.target.setSelectionRange(
              cursorPosition + lengthDifference,
              cursorPosition + lengthDifference
            );
          } // PENTING: JANGAN panggil updateFormTotal() di sini
        });
      }); // ⬆️ ⬆️ ⬆️ BATAS AKHIR KODE TAMBAHAN ⬆️ ⬆️ ⬆️ // 🔹 Inisialisasi Tab 2 dan Event
      window.dataLoaded = true;
      await initRealCalculationTab();
      toggleTambahItemBtn(); // Hanya panggil di View Mode
      if (savePlanCostBtn) {
        savePlanCostBtn.removeEventListener(
          "click",
          handleUpdateAllPlanCosting
        );
        savePlanCostBtn.addEventListener("click", handleUpdateAllPlanCosting);
      }
      switchTab(tab1, tab1Btn);
      Swal.close();
    } catch (err) {
      console.error("Gagal load detail:", err);
      Swal.fire(
        "Error",
        err.message || "Gagal memuat detail penjualan",
        "error"
      );
    }
  }
}

// FUNGSI-FUNGSI DARI ANDA (SUDAH BENAR)
// Pastikan fungsi ini ada di file JS Anda

function setTodayDate(elementId) {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById(elementId);
  if (dateInput) {
    dateInput.value = today;
  }
}

// 💡 Fungsi dari QO, diubah untuk menerima ID elemen
async function loadSalesType(elementId) {
  try {
    const response = await fetch(`${baseUrl}/list/type_sales`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Gagal mengambil data sales type");
    const result = await response.json();
    const salesTypes = result.listData;

    const typeSelect = document.getElementById(elementId);
    if (!typeSelect) return;
    typeSelect.innerHTML = '<option value="">Pilih Tipe</option>';
    salesTypes.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.type_id;
      // 💡 Anda mungkin ingin menyesuaikan teks ini
      option.textContent = `${item.nama_type} (${item.kode_type})`;
      typeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Gagal load sales type:", error);
  }
}

// 💡 Fungsi dari QO, diubah untuk menerima ID elemen
async function loadCustomerList(elementId) {
  try {
    const response = await fetch(`${baseUrl}/client/sales/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Gagal mengambil data client");
    const result = await response.json();
    customerList = result.data || []; // Simpan di global

    const select = document.getElementById(elementId);
    if (!select) return;
    select.innerHTML = `<option value="">-- Pilih Client --</option>`;
    customerList.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.client_id;
      opt.textContent = `${item.nama_client} (${item.alias})`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error load client:", error);
    customerList = [];
  }
}

// 💡 Fungsi dari QO
function toggleTambahItemBtn() {
  // Sesuaikan ID dengan form 'Add Mode'
  const select = document.getElementById("add_type_id");
  const btn = document.getElementById("addItemBtn"); // Tombol utama "Tambah Item"

  if (select.value !== "" && select.value !== "0") {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
  }
}

// 💡 Fungsi dari QO
async function loadSubcategories(selectElement, selectedId = "") {
  try {
    const res = await fetch(`${baseUrl}/list/sub_category/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();
    if (!data.listData || !Array.isArray(data.listData)) {
      selectElement.innerHTML = `<option value="">Tidak ada data</option>`;
      return;
    }
    selectElement.innerHTML = `<option value="">-- Pilih Subcategory --</option>`;
    data.listData.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.sub_category_id;
      option.textContent = item.nama;
      if (selectedId && selectedId == item.sub_category_id) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  } catch (err) {
    console.error("Gagal load subcategory:", err);
    selectElement.innerHTML = `<option value="">Gagal load</option>`;
  }
}

// 💡 Fungsi dari QO
function setupRupiahFormattingForElement(element) {
  if (!element) return;
  element.addEventListener("input", function (e) {
    const value = e.target.value.replace(/[^\d]/g, "");
    e.target.value = finance(value);

    const row = e.target.closest("tr");
    if (!row) return;

    // Perlu cek ini sub-item atau bukan
    const qtyEl =
      row.querySelector(".itemQty") || row.querySelector(".subItemQty");
    const totalEl =
      row.querySelector(".itemTotal") || row.querySelector(".subItemTotal");

    const qty = parseInt(qtyEl?.value || 0);
    const harga = parseRupiah(e.target.value);
    const subtotal = qty * harga;

    if (totalEl) totalEl.textContent = finance(subtotal);
    calculateTotals();
  });
}

// 💡 Fungsi dari QO
function parseRupiah(rupiah) {
  if (!rupiah || typeof rupiah !== "string") return 0;
  const isNegative = rupiah.trim().startsWith("-");
  const angkaString = rupiah.replace(/[^\d]/g, "");
  let angka = parseInt(angkaString) || 0;
  return isNegative ? -angka : angka;
}

// 💡 Fungsi dari QO
async function tambahItem() {
  const typeId = document.getElementById("add_type_id").value;
  const tbody = document.getElementById("tabelItemAdd"); // Target tbody 'add mode'

  const tr = document.createElement("tr");
  tr.classList.add("itemRow");
  const index =
    document.querySelectorAll("#tabelItemAdd tr.itemRow").length + 1;

  // Ini adalah HTML dari QO
  tr.innerHTML = `
    <td class="border px-3 py-2 w-[5%] align-top">${index}</td>
    <td class="border px-5 py-2 w-[55%] align-top">
      <div class="mb-1">
        <label class="block text-xs text-gray-500">Type</label>
        <select class="w-full border rounded px-2 itemSubcategory"></select>
      </div>
      <div class="mb-1">
        <label class="block text-xs text-gray-500">Product</label>
        <input type="text" class="w-full border rounded px-2 itemProduct" placeholder="Product">
      </div>
      <div class="mb-1">
        <label class="block text-xs text-gray-500">Deskripsi</label>
        <textarea class="w-full border rounded px-2 itemDesc" rows="3" placeholder="Deskripsi"></textarea>
      </div>
      <div class="grid grid-cols-3 gap-2 p-2 border rounded bg-gray-50 my-2">
        <div>
          <label class="block text-xs text-gray-500">HPP (Modal)</label>
          <input type="text" class="w-full border rounded px-2 itemHpp text-right finance" value="0" oninput="recalculateHarga(this, 'hpp')">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Markup (Nominal)</label>
          <input type="text" class="w-full border rounded px-2 itemMarkupNominal text-right finance" value="0" oninput="recalculateHarga(this, 'nominal')">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Markup (%)</label>
          <input type="number" class="w-full border rounded px-2 itemMarkupPersen text-right" value="0" oninput="recalculateHarga(this, 'persen')">
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <div>
          <label class="block text-xs text-gray-500">Qty</label>
          <input type="number" class="w-full border rounded px-2 itemQty text-right" value="1" oninput="recalculateTotal()">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Unit</label>
          <input type="text" class="w-full border rounded px-2 itemUnit" placeholder="set">
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-500">Harga (Jual)</label>
          <input type="text" class="w-full border rounded px-2 itemHarga text-right bg-gray-100" value="0" readonly>
        </div>
      </div>
      <div class="mt-2">
        <label class="block text-xs text-gray-500">Sub Total</label>
        <div class="border rounded px-2 py-1 text-right bg-gray-50 itemTotal">0</div>
      </div>
    </td>
    <td class="border px-3 py-2 text-center w-[10%] align-top">
      <div class="flex flex-col items-center justify-center space-y-2">
        <button onclick="hapusItem(this)" 
          class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition" 
          title="Hapus Item">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        ${
          typeId == 3
            ? `
          <button onclick="tambahSubItem(this)" 
            class="btnTambahSubItem inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition" 
            title="Tambah Sub Item">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>`
            : ""
        }
      </div>
    </td>
  `;

  const subWrapper = document.createElement("tr");
  subWrapper.classList.add("subItemWrapper");
  subWrapper.innerHTML = `<td colspan="3" class="p-0"><table class="w-full"></table></td>`; // colspan=3

  tbody.appendChild(tr);
  tbody.appendChild(subWrapper);

  setupRupiahFormattingForElement(tr.querySelector(".itemHarga"));
  await loadSubcategories(tr.querySelector(".itemSubcategory"));
}

// 💡 Fungsi dari QO
function tambahSubItem(btn) {
  const parentRow = btn.closest("tr");
  const subWrapper = parentRow.nextElementSibling?.querySelector("table");
  if (!subWrapper) return;
  const subTr = document.createElement("tr");
  subTr.classList.add("subItemRow", "bg-gray-50", "italic");

  // Ini HTML dari QO
  subTr.innerHTML = `
    <td class="border px-3 py-2 w-[5%] text-center align-middle itemNumber"></td>
    <td class="border px-3 py-2 align-top">
      <div class="space-y-2">
        <div>
          <label class="block text-xs text-gray-500">Material</label>
          <input type="text" class="w-full border rounded px-2 subItemMaterial" placeholder="Material">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Specification</label>
          <input type="text" class="w-full border rounded px-2 subItemSpec" placeholder="Spesifikasi">
        </div>
        <div class="grid grid-cols-3 gap-2 p-2 border rounded bg-white my-2">
          <div>
            <label class="block text-xs text-gray-500">HPP (Modal)</label>
            <input type="text" class="w-full border rounded px-2 subItemHpp text-right finance" value="0" oninput="recalculateHarga(this, 'hpp')">
          </div>
          <div>
            <label class="block text-xs text-gray-500">Markup (Nominal)</label>
            <input type="text" class="w-full border rounded px-2 subItemMarkupNominal text-right finance" value="0" oninput="recalculateHarga(this, 'nominal')">
          </div>
          <div>
            <label class="block text-xs text-gray-500">Markup (%)</label>
            <input type="number" class="w-full border rounded px-2 subItemMarkupPersen text-right" value="0" oninput="recalculateHarga(this, 'persen')">
          </div>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div>
            <label class="block text-xs text-gray-500">Qty</label>
            <input type="number" class="w-full border rounded px-2 text-right subItemQty" value="1" oninput="recalculateTotal()">
          </div>
          <div>
            <label class="block text-xs text-gray-500">Unit</label>
            <input type="text" class="w-full border rounded px-2 subItemUnit" placeholder="pcs">
          </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-500">Harga (Jual)</label>
            <input type="text" class="w-full border rounded px-2 text-right subItemHarga bg-gray-100" value="0" readonly>
          </div>
        </div>
        <div class="mt-2">
          <label class="block text-xs text-gray-500">Sub Total</label>
          <div class="border rounded px-2 py-1 text-right bg-gray-100 subItemTotal">0</div>
        </div>
      </div>
    </td>
    <td class="border px-3 py-2 text-center w-[10%] align-middle">
      <button onclick="hapusItem(this)"
        class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
        title="Hapus Sub Item">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </td>
  `;

  subWrapper.appendChild(subTr);
  setupRupiahFormattingForElement(subTr.querySelector(".subItemHarga"));
}

// 💡 Fungsi dari QO
function hapusItem(button) {
  const row = button.closest("tr");
  // Cek apakah ini item utama, jika ya, hapus juga wrapper-nya
  if (row.classList.contains("itemRow")) {
    const wrapper = row.nextElementSibling;
    if (wrapper && wrapper.classList.contains("subItemWrapper")) {
      wrapper.remove();
    }
  }
  row.remove();
  calculateTotals();
}

// 💡 Fungsi dari QO
function recalculateTotal() {
  // Hitung itemRow
  document.querySelectorAll("#tabelItemAdd tr.itemRow").forEach((row) => {
    const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
    const harga = parseRupiah(row.querySelector(".itemHarga")?.value || "0");
    const totalCell = row.querySelector(".itemTotal");
    if (totalCell) totalCell.textContent = finance(qty * harga);
  });

  // Hitung subItemRow
  document.querySelectorAll("#tabelItemAdd tr.subItemRow").forEach((sub) => {
    const q = parseInt(sub.querySelector(".subItemQty")?.value || 0);
    const h = parseRupiah(sub.querySelector(".subItemHarga")?.value || "0");
    const t = q * h;
    sub.querySelector(".subItemTotal").textContent = finance(t);
  });

  calculateTotals();
}

// 💡 Fungsi dari QO
function calculateTotals() {
  let subtotal = 0;

  // Ambil semua total HANYA dari tabel 'add mode'
  document
    .querySelectorAll("#tabelItemAdd .itemTotal, #tabelItemAdd .subItemTotal")
    .forEach((cell) => {
      subtotal += parseRupiah(cell.textContent || "0");
    });

  const diskon = parseRupiah(document.getElementById("discount")?.value || 0);
  const dpp = subtotal - diskon;

  const cekPpn = document.getElementById("cekPpn");
  let ppn = 0;

  if (cekPpn && cekPpn.checked) {
    ppn = Math.round(dpp * 0.11);
  }

  const total = dpp + ppn;

  document.getElementById("contract_amount").value = finance(subtotal);
  document.getElementById("ppn").value = finance(ppn);
  document.getElementById("total").value = finance(total);
}

// 💡 Fungsi dari QO
function recalculateHarga(element, inputType) {
  const row = element.closest(".itemRow, .subItemRow");
  if (!row) return;

  const isSubItem = row.classList.contains("subItemRow");
  const prefix = isSubItem ? ".subItem" : ".item";

  const hppEl = row.querySelector(`${prefix}Hpp`);
  const nominalEl = row.querySelector(`${prefix}MarkupNominal`);
  const persenEl = row.querySelector(`${prefix}MarkupPersen`);
  const hargaEl = row.querySelector(`${prefix}Harga`);

  let hpp = parseRupiah(hppEl.value) || 0;
  let nominal = parseRupiah(nominalEl.value) || 0;
  let persen = parseFloat(persenEl.value) || 0;

  if (inputType === "hpp" || inputType === "nominal") {
    nominal = parseRupiah(nominalEl.value) || 0;
    if (hpp !== 0) {
      persen = (nominal / hpp) * 100;
      persenEl.value = Math.round(persen);
    } else {
      persenEl.value = 0;
    }
  } else if (inputType === "persen") {
    persen = parseFloat(persenEl.value) || 0;
    nominal = hpp * (persen / 100);
    let nominalStr = String(Math.abs(Math.round(nominal)));
    nominalEl.value =
      nominal < 0 ? "-" + finance(nominalStr) : finance(nominalStr);
  }

  const hargaJual = hpp + nominal;
  let hargaJualStr = String(Math.abs(Math.round(hargaJual)));
  hargaEl.value =
    hargaJual < 0 ? "-" + finance(hargaJualStr) : finance(hargaJualStr);

  recalculateTotal();
}

// 💡 Fungsi dari QO (saveInvoice), diganti nama dan disesuaikan
async function handleSaveNewProject() {
  try {
    calculateTotals(); // Hitung final

    // Konfirmasi
    const konfirmasi = await Swal.fire({
      title: "Buat Project Baru?",
      text: "Apakah Anda yakin ingin menyimpan project baru ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Ya, simpan",
      cancelButtonText: "❌ Batal",
    });
    if (!konfirmasi.isConfirmed) return;

    // Kumpulkan Item dari 'tabelItemAdd'
    const rows = document.querySelectorAll("#tabelItemAdd tr");
    const groupedItems = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.querySelector(".itemProduct")) continue; // Skip jika bukan itemRow

      // Ambil data item utama
      const sub_category_id = parseInt(
        row.querySelector(".itemSubcategory")?.value || 0
      );
      const product = row.querySelector(".itemProduct")?.value.trim() || "";
      // ... (Ambil semua data item: desc, qty, unit, hpp, markup, dll.)
      const description = row.querySelector(".itemDesc")?.value.trim() || "";
      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const unit = row.querySelector(".itemUnit")?.value.trim() || "pcs";
      const unit_price = parseRupiah(
        row.querySelector(".itemHarga")?.value || 0
      );
      const hpp = parseRupiah(row.querySelector(".itemHpp")?.value || 0);
      const markup_nominal = parseRupiah(
        row.querySelector(".itemMarkupNominal")?.value || 0
      );
      const markup_percent = parseFloat(
        row.querySelector(".itemMarkupPersen")?.value || 0
      );

      const key = `${sub_category_id}-${product}`;
      if (!groupedItems[key]) {
        groupedItems[key] = {
          product,
          sub_category_id,
          description,
          qty,
          unit,
          unit_price,
          hpp,
          markup_nominal,
          markup_percent,
          materials: [],
        };
      }

      // Ambil data material
      const subWrapper = row.nextElementSibling;
      if (subWrapper && subWrapper.classList.contains("subItemWrapper")) {
        const subItems = subWrapper.querySelectorAll(".subItemRow");
        subItems.forEach((sub) => {
          groupedItems[key].materials.push({
            name: sub.querySelector(".subItemMaterial")?.value.trim() || "", // 'name'
            specification:
              sub.querySelector(".subItemSpec")?.value.trim() || "", // 'specification'
            qty: parseInt(sub.querySelector(".subItemQty")?.value || 0),
            unit: sub.querySelector(".subItemUnit")?.value.trim() || "pcs",
            unit_price: parseRupiah(
              sub.querySelector(".subItemHarga")?.value || 0
            ),
            hpp: parseRupiah(sub.querySelector(".subItemHpp")?.value || 0),
            markup_nominal: parseRupiah(
              sub.querySelector(".subItemMarkupNominal")?.value || 0
            ),
            markup_percent: parseFloat(
              sub.querySelector(".subItemMarkupPersen")?.value || 0
            ),
          });
        });
      }
    }

    const items = Object.values(groupedItems);

    // Siapkan Payload
    // 💡 Ganti /add/project dengan endpoint Anda yang benar
    const payload = {
      project_name:
        document.getElementById("add_project_name")?.value || "Project Baru",
      pelanggan_id: parseInt(document.getElementById("add_client")?.value || 0),
      type_id: parseInt(document.getElementById("add_type_id")?.value || 0),
      order_date: document.getElementById("add_tanggal")?.value || "",
      contract_amount: parseRupiah(
        document.getElementById("contract_amount").value
      ),
      disc: parseRupiah(document.getElementById("discount")?.value || 0),
      ppn: parseRupiah(document.getElementById("ppn").value),
      total: parseRupiah(document.getElementById("total").value),
      items: items,
      owner_id: user.owner_id,
      user_id: user.user_id,
      // Tambahkan field lain jika perlu (catatan, snk, top, dll)
    };

    console.log("Payload Project Baru:", JSON.stringify(payload, null, 2));

    // Kirim ke API
    const res = await fetch(`${baseUrl}/add/project`, {
      // 💡 PASTIKAN ENDPOINT INI BENAR
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok) {
      Swal.fire("Sukses", `Project baru berhasil dibuat`, "success");
      loadModuleContent("project"); // Kembali ke list project
    } else {
      Swal.fire("Gagal", json.message || "Gagal menyimpan data", "error");
    }
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Error", err.message || "Terjadi kesalahan", "error");
  }
}

async function handleUpdateAllPlanCosting() {
  const projectId = projectDetailData?.project_id;
  if (!projectId) {
    Swal.fire("Error", "Project ID tidak ditemukan.", "error");
    return;
  }

  // 1. Tampilkan loading "Menyimpan..."
  Swal.fire({
    title: "Menyimpan...",
    text: "Menyimpan semua data Plan Costing...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  const payload = { items: [] };
  const tableBody = document.getElementById("tabelItemView");

  try {
    // Loop melalui data asli untuk mendapatkan ID dan struktur
    projectDetailData.items.forEach((item) => {
      const item_id = item.project_item_id;
      const itemPayload = {
        project_item_id: item_id,
        plan_total: 0,
        materials: [],
      };

      const itemRow = tableBody.querySelector(`tr[data-item-id="${item_id}"]`);
      if (!itemRow) return;

      if (item.materials?.length > 0) {
        // --- ITEM DENGAN MATERIAL ---
        item.materials.forEach((material) => {
          const material_id = material.project_materials_id;
          const materialRow = tableBody.querySelector(
            `tr[data-material-id="${material_id}"]`
          );

          if (materialRow) {
            const input = materialRow.querySelector(".plancosting");
            const plan_total = parseFormattedNumber(input?.value || "0");

            itemPayload.materials.push({
              project_materials_id: material_id,
              plan_total: plan_total,
            });
          }
        });
        itemPayload.plan_total = 0;
      } else {
        // --- ITEM TANPA MATERIAL ---
        const input = itemRow.querySelector(".plancosting");
        const plan_total = parseFormattedNumber(input?.value || "0");
        itemPayload.plan_total = plan_total;
      }

      payload.items.push(itemPayload);
    }); // Selesai loop

    // 2. Kirim data ke API
    const res = await fetch(`${baseUrl}/update/plan_costing/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (!res.ok || response.response !== "200") {
      console.error("API Error Response:", response);
      const errorMessage =
        response.message || response.data?.message || "Update gagal";
      throw new Error(errorMessage);
    }

    await loadDetailSales(window.detail_id, window.detail_desc);

    // 4. BARU tampilkan "Berhasil" setelah semua data dijamin ter-update
    Swal.fire("Berhasil", "Semua Plan Costing berhasil diperbarui!", "success");
  } catch (err) {
    console.error("Error update batch plan costing:", err);
    Swal.fire(
      "Error",
      err.message || "Gagal memperbarui plan costing",
      "error"
    );
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const saveAllBtn = document.getElementById("saveAllPlanCostBtn");
  if (saveAllBtn) {
    saveAllBtn.addEventListener("click", handleUpdateAllPlanCosting);
  } else {
    console.warn("Tombol #saveAllPlanCostBtn tidak ditemukan");
  }
});

// ================================================================
// FUNGSI BARU UNTUK TAB 2 (REAL CALCULATION)
// ================================================================

function initRealCalculationTab() {
  populatePekerjaanDropdown();
  loadActualCostingTable(actualCostCurrentPage);
  document
    .getElementById("realCalcForm")
    .addEventListener("submit", handleActualCostSubmit);
  document
    .getElementById("calcKorelasiPekerjaan")
    .addEventListener("change", handlePekerjaanChange);
  document
    .getElementById("calcKorelasiMaterial")
    .addEventListener("change", handleMaterialChange);
  document
    .getElementById("realCalcBody")
    .addEventListener("click", handleCostAction);

  document
    .getElementById("calcUnitPrice")
    .addEventListener("input", updateFormTotal);
  document.getElementById("calcQty").addEventListener("input", updateFormTotal);
}

async function handleCostAction(e) {
  const editBtn = e.target.closest(".edit-cost-btn");
  if (editBtn) {
    e.preventDefault();
    const costId = editBtn.dataset.costId;
    if (costId) {
      populateFormForUpdate(costId);
    }
    return;
  }

  const deleteBtn = e.target.closest(".delete-cost-btn");
  if (deleteBtn) {
    e.preventDefault();
    const costId = deleteBtn.dataset.costId;
    if (costId) {
      await handleDeleteActualCost(costId);
    }
    return;
  }
}

async function populatePekerjaanDropdown() {
  const selectPekerjaan = document.getElementById("calcKorelasiPekerjaan");
  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const projectId = projectDetailData?.project_id;

  // Reset dropdown
  selectPekerjaan.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>';
  selectMaterial.innerHTML = '<option value="">-- Pilih Material --</option>';
  selectMaterial.disabled = true;
  selectMaterial.classList.add("bg-gray-100");

  if (!projectId) {
    console.error("Project ID not found for pekerjaan dropdown.");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/list/item_material/${projectId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await res.json();

    if (!result.success || !result.listData?.items) {
      throw new Error(result.message || "Gagal mengambil data pekerjaan");
    }

    // 💡 REVISI: Simpan ke variabel baru!
    dataItemDropdown = result.listData.items;

    // 💡 REVISI: Loop dari variabel baru
    dataItemDropdown.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.project_item_id;
      option.textContent = item.product;
      selectPekerjaan.appendChild(option);
    });
  } catch (err) {
    console.error("Gagal load dropdown pekerjaan:", err);
    selectPekerjaan.innerHTML = '<option value="">Gagal memuat data</option>';
  }
}

function handlePekerjaanChange() {
  const selectPekerjaan = document.getElementById("calcKorelasiPekerjaan");
  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const selectedPekerjaanId = selectPekerjaan.value;

  // Reset material
  selectMaterial.innerHTML = '<option value="">-- Pilih Material --</option>';
  selectMaterial.disabled = true;
  selectMaterial.classList.add("bg-gray-100");

  if (!selectedPekerjaanId) return;

  const selectedItem = dataItemDropdown.find(
    (item) => item.project_item_id == selectedPekerjaanId
  );

  if (selectedItem && selectedItem.materials?.length > 0) {
    selectedItem.materials.forEach((mat) => {
      const option = document.createElement("option");
      option.value = mat.name;
      option.textContent = mat.name;
      option.dataset.unit = mat.unit;
      option.dataset.materialId = mat.project_materials_id;
      selectMaterial.appendChild(option);
    });

    selectMaterial.disabled = false;
    selectMaterial.classList.remove("bg-gray-100");
  }
}

function handleMaterialChange() {
  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const selectedOption = selectMaterial.options[selectMaterial.selectedIndex];

  if (!selectedOption || !selectedOption.value) return;

  // const unit = selectedOption.dataset.unit;
  // document.getElementById("calcUnit").value = unit || "pcs";
}

async function loadActualCostingTable(page = 1) {
  actualCostCurrentPage = page;
  const tbody = document.getElementById("realCalcBody");
  const projectId = projectDetailData?.project_id;

  if (!projectId) {
    console.error("Project ID not found for fetching actual costing table.");
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center italic text-gray-500 py-3">Memuat data...</td></tr>';

  try {
    const res = await fetch(
      `${baseUrl}/table/actual_costing/${projectId}/${page}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );

    const response = await res.json();
    console.log("Response dari API actual costing:", response);

    if (!response.success) {
      throw new Error(
        response.message || "Gagal mengambil data actual costing"
      );
    }

    realCalculationData = response.tableData || [];
    tbody.innerHTML = "";

    if (realCalculationData.length > 0) {
      realCalculationData.forEach((data) => {
        tbody.innerHTML += `
          <tr class="border-b" data-id="${data.cost_id}">
            <td class="px-3 py-2">${data.product}</td>
            <td class="px-3 py-2">${data.cost_name}</td>
            <td class="px-3 py-2">${data.notes || "-"}</td>
            <td class="px-3 py-2 text-right">${formatNumber(
              data.unit_price
            )}</td>
            <td class="px-3 py-2 text-right">${data.qty}</td>
            <td class="px-3 py-2 text-right">${data.unit}</td>
            <td class="px-3 py-2 text-right">${formatNumber(data.total)}</td>
            <td class="px-3 py-2 text-center">
              <button class="edit-cost-btn p-1 text-blue-600 hover:text-blue-800" 
                data-cost-id="${data.cost_id}" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036
                    a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button class="delete-cost-btn p-1 text-red-600 hover:text-red-800"
                data-cost-id="${data.cost_id}" title="Hapus">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
                    a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4
                    a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>';
    }
  } catch (err) {
    console.error("Gagal load actual costing table:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 py-3">Error: ${err.message}</td></tr>`;
    realCalculationData = [];
  }
}

function resetCalcForm() {
  document.getElementById("realCalcForm").reset();
  document.getElementById("calcQty").value = "1";
  currentUpdateCostId = null;

  const submitBtn = document.getElementById("submitCalcFormBtn");
  submitBtn.textContent = "+ Tambah Data";
  submitBtn.classList.remove("bg-green-600", "hover:bg-green-700");
  submitBtn.classList.add("bg-blue-600", "hover:bg-blue-700");

  document.getElementById("cancelUpdateBtn").classList.add("hidden");

  updateFormTotal();
}
function updateCalcTotal() {
  const rows = document.querySelectorAll("#realCalcBody tr");
  let total = 0;

  rows.forEach((row) => {
    const costCell = row.querySelector(".actual-cost-value");
    if (costCell) {
      const value = parseFloat(costCell.textContent.replace(/,/g, "")) || 0;
      total += value;
    }
  });

  const totalElement = document.getElementById("totalActualCost");
  if (totalElement) {
    totalElement.textContent = total.toLocaleString("id-ID");
  }
}
function updateFormTotal() {
  let unitPriceStr = document.getElementById("calcUnitPrice").value;
  let qtyStr = document.getElementById("calcQty").value;

  const unitPrice = parseFormattedNumber(unitPriceStr);
  const qty = parseFormattedNumber(qtyStr);

  const total = unitPrice * qty;

  document.getElementById("calcHarga").value = total.toLocaleString("id-ID");
}

function populateFormForUpdate(costId) {
  const item = realCalculationData.find((d) => d.cost_id == costId);

  if (!item) {
    Swal.fire(
      "Error",
      "Data item tidak ditemukan (ID: " + costId + ").",
      "error"
    );
    console.error("Item not found in realCalculationData for ID:", costId);
    return;
  }

  currentUpdateCostId = item.cost_id;
  document.getElementById("calcProduct").value = item.product;
  document.getElementById("calcKorelasiPekerjaan").value = item.project_item_id;
  document.getElementById("calcQty").value = parseFloat(
    item.qty
  ).toLocaleString("id-ID");
  document.getElementById("calcUnit").value = item.unit;
  document.getElementById("calcUnitPrice").value = parseFloat(
    item.unit_price
  ).toLocaleString("id-ID");
  document.getElementById("calcHarga").value = parseFloat(
    item.total
  ).toLocaleString("id-ID");
  // (Notes & korelasi material di-handle di bawah)

  const submitBtn = document.getElementById("submitCalcFormBtn");
  submitBtn.textContent = "💾 Update Data";
  submitBtn.classList.add("bg-green-600", "hover:bg-green-700");
  submitBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");

  document.getElementById("cancelUpdateBtn").classList.remove("hidden");
  document
    .getElementById("realCalcForm")
    .scrollIntoView({ behavior: "smooth" });

  handlePekerjaanChange();

  setTimeout(() => {
    const selectMaterial = document.getElementById("calcKorelasiMaterial");
    const optionExists = Array.from(selectMaterial.options).find(
      (opt) => opt.text === item.product // Ini mungkin perlu disesuaikan jika logikanya beda
    );
    if (optionExists) {
      selectMaterial.value = optionExists.value;
    }
  }, 100);
}

// GANTI FUNGSI LAMA DENGAN YANG INI
function getAndValidateCalcForm() {
  const name = document.getElementById("calcProduct").value;
  const project_item_id = document.getElementById(
    "calcKorelasiPekerjaan"
  ).value;

  // 💡 REVISI UTAMA ADA DI SINI:
  // Gunakan parseFormattedNumber untuk membaca nilai dari form
  const qty = parseFormattedNumber(document.getElementById("calcQty").value);
  const unit = document.getElementById("calcUnit").value;
  const unit_price = parseFormattedNumber(
    document.getElementById("calcUnitPrice").value
  );
  const total = parseFormattedNumber(
    document.getElementById("calcHarga").value
  );

  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const selectedMaterialOption =
    selectMaterial.options[selectMaterial.selectedIndex];
  const project_materials_id =
    selectedMaterialOption?.dataset.materialId || "0";
  const notes = document.getElementById("calcNotes")?.value || "";
  const project_id = projectDetailData.project_id.toString();

  // Validasi tetap sama
  if (!name || !project_item_id || qty <= 0 || !unit || unit_price <= 0) {
    Swal.fire(
      "Gagal",
      "Harap isi semua field (Nama, Korelasi, Harga Satuan, Qty, Unit) dengan benar. Harga Satuan dan Qty harus lebih dari 0.",
      "warning"
    );
    return null;
  }

  return {
    project_id: project_id,
    project_item_id: project_item_id,
    project_materials_id: project_materials_id,
    name: name,
    unit: unit,
    // Kirim sebagai string angka murni
    qty: qty.toString(),
    unit_price: unit_price.toString(),
    total: total.toString(),
    notes: notes,
  };
}

async function handleUpdateActualCost(costId) {
  const payload = getAndValidateCalcForm();
  if (!payload) return;

  Swal.fire({
    title: "Mengupdate...",
    text: "Menyimpan perubahan data...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
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

    // Pola ini sudah benar: refresh dulu (await)
    await loadDetailSales(window.detail_id, window.detail_desc);

    // Baru tampilkan sukses
    Swal.fire("Berhasil!", "Data berhasil diperbarui.", "success");
    resetCalcForm(); // Reset form setelah sukses
  } catch (error) {
    console.error("Gagal update actual cost:", error);
    Swal.fire("Gagal!", error.message || "Terjadi kesalahan.", "error");
  }
}

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
    const res = await fetch(`${baseUrl}/delete/actual_costing/${costId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal menghapus.");

    // Pola ini sudah benar: refresh dulu (await)
    await loadDetailSales(window.detail_id, window.detail_desc);

    // Baru tampilkan sukses
    Swal.fire("Terhapus!", "Data berhasil dihapus.", "success");
  } catch (error) {
    console.error("Gagal delete actual cost:", error);
    Swal.fire("Gagal!", error.message || "Terjadi kesalahan.", "error");
  }
}

document
  .getElementById("tabelItemView")
  .addEventListener("click", function (event) {
    const eyeButton = event.target.closest(".view-actual-cost-btn");
    if (eyeButton) {
      const korelasi = eyeButton.dataset.korelasi;
      showActualCostDetail(korelasi);
      return;
    }
  });

async function handleActualCostSubmit(event) {
  event.preventDefault();

  if (currentUpdateCostId) {
    await handleUpdateActualCost(currentUpdateCostId);
  } else {
    await handleAddNewActualCost();
  }
}

async function handleAddNewActualCost() {
  const payload = getAndValidateCalcForm();
  if (!payload) return;

  console.log("=== 🚀 START handleAddNewActualCost ===");
  console.log("Payload dari form:", payload);
  console.log("Payload JSON (siap dikirim):", JSON.stringify(payload, null, 2));

  Swal.fire({
    title: "Menyimpan...",
    text: "Mengirim data actual costing...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    console.log("Endpoint tujuan:", `${baseUrl}/add/actual_costing`);
    console.log("Header Authorization:", `Bearer ${API_TOKEN}`);

    const res = await fetch(`${baseUrl}/add/actual_costing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Status Response:", res.status);
    const result = await res.json();
    console.log("Response dari server:", result);

    if (!res.ok || !result.data?.success) {
      const errorMessage =
        result.data?.message ||
        result.message ||
        "Gagal menyimpan data ke server.";
      throw new Error(errorMessage);
    }

    const successMessage =
      result.data?.message || "Data actual cost berhasil ditambahkan!";

    console.log("✅ Sukses:", successMessage);
    console.log("🔄 Reload data setelah tambah...");

    resetCalcForm();
    await loadDetailSales(window.detail_id, window.detail_desc);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: successMessage,
      timer: 1500,
      showConfirmButton: false,
    });

    console.log("=== ✅ END handleAddNewActualCost ===");
  } catch (err) {
    console.error("❌ Gagal submit actual costing:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
    });
  }
}

// ================================================================
// FUNGSI MODAL (TOMBOL MATA)
// ================================================================
// ================================================================
// FUNGSI MODAL (TOMBOL MATA) - VERSI PERBAIKAN
// ================================================================
function showActualCostDetail(korelasi) {
  // 1. Ambil data dari variabel global projectDetailData
  const selectedItem = projectDetailData.items.find(
    (item) => item.product === korelasi
  );

  let details = []; // Ini akan menampung SEMUA data actual cost

  if (selectedItem) {
    // 2. Cek apakah item ini punya 'materials'
    if (selectedItem.materials?.length > 0) {
      // Jika punya, kita loop setiap material dan ambil 'actuals' DARI DALAM material
      selectedItem.materials.forEach((mat) => {
        if (mat.actuals?.length > 0) {
          // Concat (gabung) array-nya ke 'details'
          details = details.concat(mat.actuals);
        }
      });
    }
    // 3. Cek apakah item ini punya 'actuals' langsung (untuk item tanpa material)
    else if (selectedItem.actuals?.length > 0) {
      // Jika punya, langsung gabung ke 'details'
      details = details.concat(selectedItem.actuals);
    }
  }

  // 4. Buat tabel HTML untuk modal
  let htmlContent = "";
  if (details.length === 0) {
    htmlContent =
      '<p class="text-center text-gray-500">Tidak ada data detail pengeluaran (actual cost) untuk item ini.</p>';
  } else {
    htmlContent = `
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-3 py-2">Nama Pengeluaran</th>
            <th class="px-3 py-2 text-right">Unit Price</th>
            <th class="px-3 py-2 text-right">Qty</th>
            <th class="px-3 py-2 text-right">Total</th>
            <th class="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
    `;
    let total = 0;
    details.forEach((item) => {
      // 5. Gunakan key dari array 'actuals' (cost_name, unit_price, qty, total)
      htmlContent += `
        <tr class="border-b">
          <td class="px-3 py-2">${item.cost_name}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.unit_price)}</td>
          <td class="px-3 py-2 text-right">${item.qty} ${item.unit}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.total)}</td>
          <td class="px-3 py-2 text-xs">${item.notes || ""}</td>
        </tr>
      `;
      total += item.total;
    });
    htmlContent += `
        </tbody>
        <tfoot class="font-bold">
          <tr>
            <td colspan="3" class="px-3 py-2 text-right">Total:</td>
            <td class="px-3 py-2 text-right">${formatNumber(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // 6. Tampilkan modal
  if (typeof Swal === "undefined") {
    alert("Library SweetAlert2 (Swal) tidak ditemukan.");
    return;
  }

  Swal.fire({
    title: `Detail Actual Costing: "${korelasi}"`,
    html: htmlContent,
    width: "800px",
    confirmButtonText: "Tutup",
  });
}
// ================================================================
// FUNGSI PRINT (TIDAK BERUBAH)
// ================================================================

function toggleSection(id) {
  const section = document.getElementById(id);
  const icon = document.getElementById("icon-" + id);
  section.classList.toggle("hidden");
  icon.textContent = section.classList.contains("hidden") ? "►" : "▼";
}

async function printInvoice(pesanan_id) {
  const projectId = window.detail_id;
  if (!projectId) {
    Swal.fire("Gagal", "Project ID tidak ditemukan", "error");
    return;
  }

  try {
    if (!projectDetailData || !projectDetailData.pesanan_id) {
      throw new Error(
        "Data Pesanan (Invoice) tidak terkait dengan project ini."
      );
    }
    const pesanan_id_from_project = projectDetailData.pesanan_id;

    const response = await fetch(
      `${baseUrl}/detail/sales_invoice/${pesanan_id_from_project}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );

    const result = await response.json();
    const detail = result?.detail;
    if (!detail) throw new Error("Data faktur tidak ditemukan");

    const { isConfirmed, dismiss } = await Swal.fire({
      title: "Cetak Faktur Penjualan",
      text: "Pilih metode pencetakan:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Download PDF",
      cancelButtonText: "Print Langsung",
      reverseButtons: true,
    });

    if (isConfirmed) {
      const url = `invoice_print.html?id=${pesanan_id_from_project}`;
      Swal.fire({
        title: "Menyiapkan PDF...",
        html: "File akan diunduh otomatis.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
          const iframe = document.createElement("iframe");
          iframe.src = url + "&mode=download";
          iframe.style.width = "0";
          iframe.style.height = "0";
          iframe.style.border = "none";
          document.body.appendChild(iframe);
          setTimeout(() => {
            Swal.close();
            Swal.fire(
              "Berhasil",
              "Faktur Penjualan berhasil diunduh.",
              "success"
            );
          }, 3000);
        },
      });
    } else if (dismiss === Swal.DismissReason.cancel) {
      window.open(`invoice_print.html?id=${pesanan_id_from_project}`, "_blank");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}
document
  .getElementById("realCalcForm")
  .querySelectorAll(".formatNumber")
  .forEach((input) => {
    input.addEventListener("input", (e) => {
      // 1. Logika format (sama)
      const value = e.target.value.replace(/\D/g, "");
      e.target.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // 2. Panggil kalkulasi (Ini sekarang aman)

      updateFormTotal();
    });
  });
function parseFormattedNumber(val) {
  if (!val) return 0;
  const cleanedVal = String(val).replace(/\./g, "").replace(",", ".");
  return parseFloat(cleanedVal) || 0;
}
