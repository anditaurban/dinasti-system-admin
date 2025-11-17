// pagemodule = "Project";
// subpagemodule = "Project Costing";
// renderHeader();

// ================================================================
//  VARIABEL GLOBAL
// ================================================================
projectDetailData = null; // Menyimpan data /detail/project/{id}
realCalculationData = []; // Menyimpan data untuk tabel Tab 2
dataItemDropdown = [];
actualCostCurrentPage = 1;
currentUpdateCostId = null;
currentMode = "view"; // Mode default
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
// FUNGSI UTAMA (CONTROLLER)
// ================================================================

/**
 * FUNGSI UTAMA (LOAD DATA)
 * Direfaktor untuk menangani mode 'add', 'update', dan 'view'.
 */
async function loadDetailSales(Id, Detail) {
  // 1. Tentukan Mode (add, update, atau view)
  const intendedMode =
    sessionStorage.getItem("projectMode") || (Id ? "view" : "add");
  sessionStorage.removeItem("projectMode");

  currentMode = intendedMode; // Set global mode
  window.detail_id = Id;
  window.detail_desc = Detail;

  // 2. Ambil semua elemen UI yang akan di-toggle
  const addProjectForm = document.getElementById("addProjectForm");
  const viewProjectCards = document.getElementById("viewProjectCards");
  const savePlanCostBtn = document.getElementById("saveAllPlanCostBtn");
  const addItemBtn = document.getElementById("addItemBtn"); // Tombol dari QO
  const saveNewProjectBtn = document.getElementById("saveNewProjectBtn");
  const viewModeContainer = document.getElementById("viewModeContainer");
  const addModeContainer = document.getElementById("addModeContainer");
  const convertToSalesBtn = document.getElementById("convertToSalesBtn"); // Tombol 'Add to Sales'
  const downloadBtn = document.getElementById("downloadBtn");

  // ----------------------------------------------------------------
  // ➡️ A. LOGIKA MODE ADD / UPDATE (Menampilkan Form)
  // ----------------------------------------------------------------
  if (currentMode === "add" || currentMode === "update") {
    // ⬇️ ⬇️ PERUBAHAN DI SINI ⬇️ ⬇️
    // Set Header & Nama Tab untuk mode Add/Update
    pagemodule = "Project";
    subpagemodule = "Project Input";
    renderHeader(); // Panggil header di sini
    document.getElementById("tab1Btn").textContent = "Project Input";
    // ⬆️ ⬆️ BATAS PERUBAHAN ⬆️ ⬆️

    // 1. Atur visibilitas UI
    tab2Btn.classList.add("hidden");
    if (addProjectForm) addProjectForm.classList.remove("hidden");
    if (viewProjectCards) viewProjectCards.classList.add("hidden");
    if (savePlanCostBtn) savePlanCostBtn.classList.add("hidden");
    if (saveNewProjectBtn) saveNewProjectBtn.classList.remove("hidden");
    if (viewModeContainer) viewModeContainer.classList.add("hidden");
    if (addModeContainer) addModeContainer.classList.remove("hidden");
    if (convertToSalesBtn) convertToSalesBtn.classList.add("hidden");
    if (downloadBtn) downloadBtn.classList.add("hidden");

    // 2. Pastikan Tab 1 aktif
    switchTab(tab1, tab1Btn);

    // 3. Load semua dropdown
    try {
      await loadSalesType("add_type_id");
      await loadCustomerList("add_client");
      await loadProjectManagers("add_project_manager");
    } catch (err) {
      console.error("Gagal memuat data dropdown esensial:", err);
      Swal.fire("Error Kritis", "Gagal memuat data dropdown.", "error");
      return;
    }

    // 4. Logika spesifik per mode
    if (currentMode === "add") {
      document.getElementById("projectNameDisplay").textContent =
        "Buat Project Baru";
      const tabelAddBody = document.getElementById("tabelItemAdd");
      if (tabelAddBody) {
        tabelAddBody.innerHTML = `
<tr class="rowEmpty">
  <td colspan="3" class="text-center text-gray-500 italic">Belum ada item ditambahkan.</td>
</tr>`;
      }
      saveNewProjectBtn.textContent = "✅ Simpan Project Baru";
      saveNewProjectBtn.onclick = () => saveProject("create");
      setTodayDate("add_tanggal");
      setTodayDate("add_finish_date");
    } else {
      // currentMode === "update"
      document.getElementById(
        "projectNameDisplay"
      ).textContent = `Update Project: ${Detail}`;
      if (convertToSalesBtn) convertToSalesBtn.classList.remove("hidden");
      saveNewProjectBtn.textContent = "💾 Simpan Perubahan";
      saveNewProjectBtn.onclick = () => saveProject("update", Id);
      await loadProjectDataForUpdate(Id);
    }
  }
  // ----------------------------------------------------------------
  // ➡️ B. LOGIKA MODE LIHAT (VIEW MODE)
  // ----------------------------------------------------------------
  else {
    // ⬇️ ⬇️ PERUBAHAN DI SINI ⬇️ ⬇️
    // Set Header & Nama Tab untuk mode View
    pagemodule = "Project";
    subpagemodule = "Project Costing";
    renderHeader(); // Panggil header di sini
    document.getElementById("tab1Btn").textContent = "Costing";
    // ⬆️ ⬆️ BATAS PERUBAHAN ⬆️ ⬆️

    // 1. Atur visibilitas UI
    tab2Btn.classList.remove("hidden");
    if (addProjectForm) addProjectForm.classList.add("hidden");
    if (viewProjectCards) viewProjectCards.classList.remove("hidden");
    if (savePlanCostBtn) savePlanCostBtn.classList.remove("hidden");
    if (addItemBtn) addItemBtn.classList.add("hidden");
    if (saveNewProjectBtn) saveNewProjectBtn.classList.add("hidden");
    if (viewModeContainer) viewModeContainer.classList.remove("hidden");
    if (addModeContainer) addModeContainer.classList.add("hidden");
    if (convertToSalesBtn) convertToSalesBtn.classList.add("hidden");
    if (downloadBtn) downloadBtn.classList.remove("hidden");

    // 2. Tampilkan loading
    Swal.fire({
      title: "Memuat Data Project...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // 3. Fetch detail project dari API
      const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      const response = await res.json();
      if (!response.success || !response.detail) {
        throw new Error(response.message || "Struktur data API tidak valid");
      }
      projectDetailData = response.detail;
      const data = projectDetailData;

      // 4. Tampilkan info card
      document.getElementById("projectNameDisplay").textContent = `${
        data.project_name || "Project Detail"
      } / ${data.project_number || "---"}`;
      document.getElementById("projectAmount").innerHTML =
        finance(data.project_value) || 0;
      document.getElementById("plan_costing").innerHTML =
        finance(data.plan_costing) || 0;
      document.getElementById("actual_costing").innerHTML =
        finance(data.actual_cost) || 0;
      document.getElementById("margin").innerHTML = finance(data.margin) || 0;

      // 5. Tampilkan info detail project (Box baru)
      document.getElementById("detailNoQO").textContent = data.no_qtn || "---";
      document.getElementById("detailNoInv").textContent =
        data.inv_number || "---";
      document.getElementById("detailNoPO").textContent =
        data.po_number || "---";
      document.getElementById("detailPIC").textContent =
        data.project_manager_name || data.pic_name || "---";

      // 6. Render tabel 'view mode'
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
                    <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${formatNumber(
                      m.plan_total || 0
                    )}">
                  </td>
                  <td class="px-3 py-1 text-center">
                    <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
                      <span>${formatNumber(m.actual_total || 0)}</span>
                      <button class="view-actual-cost-btn" 
                        data-korelasi="${item.product}" 
                        data-material-name="${m.name}" 
                        title="Lihat Detail ${m.name}">
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

      // 7. Pasang event listener untuk input .plancosting (formatter)
      tbody.querySelectorAll(".plancosting").forEach((input) => {
        input.addEventListener("input", (e) => {
          let value = e.target.value;
          let cursorPosition = e.target.selectionStart;
          let originalLength = value.length;

          const numericValue = value.replace(/\D/g, "");
          const formattedValue = numericValue.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            "."
          );

          e.target.value = formattedValue;

          let newLength = formattedValue.length;
          let lengthDifference = newLength - originalLength;

          if (
            e.target.selectionEnd === originalLength ||
            cursorPosition === originalLength
          ) {
            e.target.setSelectionRange(
              cursorPosition + lengthDifference,
              cursorPosition + lengthDifference
            );
          }
        });
      });

      // 8. Inisialisasi Tab 2 dan Event
      window.dataLoaded = true;
      await initRealCalculationTab();
      toggleTambahItemBtn();

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

// ================================================================
// FUNGSI MODE ADD / UPDATE
// ================================================================

/**
 * Menyimpan data project baru (create) atau yang sudah ada (update).
 */
async function saveProject(mode = "create", id = null) {
  try {
    // 1. Konfirmasi
    const title = mode === "create" ? "Buat Project Baru?" : "Update Project?";
    const text =
      mode === "create"
        ? "Apakah Anda yakin ingin menyimpan project baru ini?"
        : "Apakah Anda yakin ingin menyimpan perubahan ini?";

    const konfirmasi = await Swal.fire({
      title: title,
      text: text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Ya, simpan",
      cancelButtonText: "❌ Batal",
    });
    if (!konfirmasi.isConfirmed) return;

    Swal.fire({
      title: "Menyimpan...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // 2. Kumpulkan Item (Logika dari QO)
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
          const subItemMaterial =
            sub.querySelector(".subItemMaterial")?.value.trim() || "";
          const subItemSpec =
            sub.querySelector(".subItemSpec")?.value.trim() || "";
          const subItemQty = parseInt(
            sub.querySelector(".subItemQty")?.value || 0
          );
          const subItemUnit =
            sub.querySelector(".subItemUnit")?.value.trim() || "pcs";
          const subItemHarga = parseRupiah(
            sub.querySelector(".subItemHarga")?.value || 0
          );
          const subItemHpp = parseRupiah(
            sub.querySelector(".subItemHpp")?.value || 0
          );
          const subItemMarkupNominal = parseRupiah(
            sub.querySelector(".subItemMarkupNominal")?.value || 0
          );
          const subItemMarkupPercent = parseFloat(
            sub.querySelector(".subItemMarkupPersen")?.value || 0
          );

          groupedItems[key].materials.push({
            subItemMaterial,
            subItemSpec,
            subItemQty,
            subItemUnit,
            subItemHarga,
            subItemHpp,
            subItemMarkupNominal,
            subItemMarkupPercent,
          });
        });
      }
    }
    const items = Object.values(groupedItems);

    // 3. Siapkan Payload (sesuai JSON Anda)
    const payload = {
      project_name:
        document.getElementById("add_project_name")?.value || "Project Baru",
      pelanggan_id: parseInt(document.getElementById("add_client")?.value || 0),
      type_id: parseInt(document.getElementById("add_type_id")?.value || 0),
      project_manager_id: parseInt(
        document.getElementById("add_project_manager")?.value || 0
      ),
      start_date: document.getElementById("add_tanggal")?.value || "",
      finish_date: document.getElementById("add_finish_date")?.value || "",
      owner_id: user.owner_id,
      user_id: user.user_id, // Hanya untuk 'create'
      items: items,
    };

    // Hapus user_id jika mode update, sesuai payload Anda
    if (mode === "update") {
      delete payload.user_id;
    }

    console.log(`Payload Project (${mode}):`, JSON.stringify(payload, null, 2));

    // 4. Tentukan URL dan Method
    const url =
      mode === "create"
        ? `${baseUrl}/add/project_manual`
        : `${baseUrl}/update/project_manual/${id}`;
    const method = mode === "create" ? "POST" : "PUT";

    // 5. Kirim ke API
    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok) {
      Swal.fire("Sukses", `Project berhasil di-${mode}.`, "success");
      loadModuleContent("project"); // Kembali ke list project
    } else {
      Swal.fire("Gagal", json.message || "Gagal menyimpan data", "error");
    }
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Error", err.message || "Terjadi kesalahan", "error");
  }
}

/**
 * 💡 FUNGSI (PERBAIKAN TOTAL)
 * Mengambil detail project dan mengisinya ke form 'Add Mode'
 */
async function loadProjectDataForUpdate(Id) {
  Swal.fire({
    title: "Memuat Data Project...",
    text: "Mohon tunggu sebentar.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const response = await res.json();
    if (!response.success || !response.detail) {
      throw new Error(response.message || "Data project tidak ditemukan.");
    }

    // ⬇️ ⬇️ PERBAIKAN DI SINI ⬇️ ⬇️
    projectDetailData = response.detail; // Set variabel global!
    const data = projectDetailData;

    // ======================================================
    // 1. ISI FORM UTAMA
    // ======================================================
    document.getElementById("add_project_name").value = data.project_name || "";
    document.getElementById("projectNameDisplay").textContent = `${
      data.project_name || "Project Detail"
    } (${data.project_number || "---"})`;
    // ⬇️ ⬇️ PERBAIKAN LOGIKA CLIENT ⬇️ ⬇️
    // 'customerList' adalah variabel global dari 'loadCustomerList'
    if (customerList && customerList.length > 0) {
      // Cari client di 'customerList' yang 'nama_client'-nya = 'data.customer'
      const customerNameFromApi = data.customer;
      const matchingClient = customerList.find(
        (client) => client.nama_client === customerNameFromApi
      );

      if (matchingClient) {
        // Jika ketemu, gunakan 'client_id' dari hasil pencarian
        document.getElementById("add_client").value = matchingClient.client_id;
      } else {
        // Jika tidak ketemu, coba fallback (meskipun mungkin akan gagal)
        document.getElementById("add_client").value =
          data.pelanggan_id || data.client_id || "";
        if (customerNameFromApi) {
          console.warn(
            `Nama customer "${customerNameFromApi}" tidak ditemukan di 'customerList'`
          );
        }
      }
    } else {
      // Fallback jika customerList masih kosong
      document.getElementById("add_client").value =
        data.pelanggan_id || data.client_id || "";
    }
    // ⬆️ ⬆️ BATAS PERBAIKAN CLIENT ⬆️ ⬆️

    document.getElementById("add_tanggal").value = data.start_date || "";
    document.getElementById("add_finish_date").value = data.finish_date || "";
    document.getElementById("add_type_id").value = data.type_id || "";
    document.getElementById("add_project_manager").value =
      data.project_manager_id || "";

    // ======================================================
    // 2. ISI TABEL ITEM
    // ======================================================
    const tbody = document.getElementById("tabelItemAdd");

    // Pastikan tbody dibersihkan HANYA SEKALI, DI SINI
    tbody.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 italic py-4">Project ini tidak memiliki item.</td></tr>`;
      Swal.close();
      return;
    }

    // Loop untuk setiap item
    for (const item of data.items) {
      // Tangkap 'itemRow' yang dikembalikan oleh 'tambahItem'
      const itemRow = await tambahItem(item.sub_category_id);
      if (!itemRow) continue;

      // Isi data item
      itemRow.querySelector(".itemProduct").value = item.product || "";
      itemRow.querySelector(".itemDesc").value = item.description || "";
      itemRow.querySelector(".itemQty").value = item.qty || 1;
      itemRow.querySelector(".itemUnit").value = item.unit || "pcs";
      itemRow.querySelector(".itemHpp").value = finance(item.hpp || 0);
      itemRow.querySelector(".itemMarkupNominal").value = finance(
        item.markup_nominal || 0
      );
      itemRow.querySelector(".itemMarkupPersen").value =
        item.markup_percent || 0;
      recalculateHarga(itemRow.querySelector(".itemHpp"), "hpp");

      // Loop untuk setiap material
      if (item.materials && item.materials.length > 0) {
        const tambahSubBtn = itemRow.querySelector(".btnTambahSubItem");
        if (!tambahSubBtn) {
          console.warn(
            "Tombol 'Tambah Sub Item' tidak ditemukan untuk item:",
            item.product
          );
          continue;
        }

        for (const mat of item.materials) {
          // Tangkap 'subItemRow' yang dikembalikan
          const subItemRow = tambahSubItem(tambahSubBtn);
          if (!subItemRow) continue;

          // Isi data material
          subItemRow.querySelector(".subItemMaterial").value = mat.name || "";
          subItemRow.querySelector(".subItemSpec").value =
            mat.specification || "";
          subItemRow.querySelector(".subItemQty").value = mat.qty || 1;
          subItemRow.querySelector(".subItemUnit").value = mat.unit || "pcs";

          // Isi HPP, Markup, dll. untuk sub-item
          subItemRow.querySelector(".subItemHpp").value = finance(mat.hpp || 0);
          subItemRow.querySelector(".subItemMarkupNominal").value = finance(
            mat.markup_nominal || 0
          );
          subItemRow.querySelector(".subItemMarkupPersen").value =
            mat.markup_percent || 0;
          recalculateHarga(subItemRow.querySelector(".subItemHpp"), "hpp");
        }
      }
    }

    Swal.close();
  } catch (err) {
    console.error("Gagal populate form update:", err);
    Swal.fire("Error", `Gagal memuat data project: ${err.message}`, "error");
    loadModuleContent("project"); // Balik ke list jika gagal
  }
}

// ================================================================
// FUNGSI MODE VIEW (TAB 1)
// ================================================================

async function handleUpdateAllPlanCosting() {
  const projectId = projectDetailData?.project_id;
  if (!projectId) {
    Swal.fire("Error", "Project ID tidak ditemukan.", "error");
    return;
  }

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

    // Kirim data ke API
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

    // Refresh data di halaman
    await loadDetailSales(window.detail_id, window.detail_desc);

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

// ================================================================
// FUNGSI MODE VIEW (TAB 2 - REAL CALCULATION)
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

    dataItemDropdown = result.listData.items;

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

function updateFormTotal() {
  let unitPriceStr = document.getElementById("calcUnitPrice").value;
  let qtyStr = document.getElementById("calcQty").value;

  const unitPrice = parseFormattedNumber(unitPriceStr);
  const qty = parseFormattedNumber(qtyStr);
  const total = unitPrice * qty;

  document.getElementById("calcHarga").value = total.toLocaleString("id-ID");
}

/**
 * Mengisi form Tab 2 untuk mengedit data Actual Cost.
 * (Nama ini 'populateFormForUpdate' tidak bentrok karena hanya untuk Tab 2)
 */
function populateFormForUpdate(costId) {
  const item = realCalculationData.find((d) => d.cost_id == costId);
  if (!item) {
    Swal.fire(
      "Error",
      "Data item tidak ditemukan (ID: " + costId + ").",
      "error"
    );
    return;
  }

  currentUpdateCostId = item.cost_id;

  // Mengisi semua data form
  document.getElementById("calcProduct").value = item.cost_name;
  document.getElementById("calcKorelasiPekerjaan").value = item.project_item_id;
  document.getElementById("calcNotes").value = item.notes || "";
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

  // Mengatur UI tombol
  const submitBtn = document.getElementById("submitCalcFormBtn");
  submitBtn.textContent = "💾 Update Data";
  submitBtn.classList.add("bg-green-600", "hover:bg-green-700");
  submitBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
  document.getElementById("cancelUpdateBtn").classList.remove("hidden");
  document
    .getElementById("realCalcForm")
    .scrollIntoView({ behavior: "smooth" });

  // Panggil handlePekerjaanChange untuk mengisi dropdown material
  handlePekerjaanChange();

  // Langsung pilih materialnya
  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const optionExists = Array.from(selectMaterial.options).find(
    (opt) => opt.text.trim() === (item.cost_name || "").trim()
  );

  if (optionExists) {
    selectMaterial.value = optionExists.value;
  } else {
    selectMaterial.value = "";
  }
}

/**
 * Mengambil dan memvalidasi data dari form Tab 2.
 */
function getAndValidateCalcForm() {
  const name = document.getElementById("calcProduct").value;
  const project_item_id = document.getElementById(
    "calcKorelasiPekerjaan"
  ).value;

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

  // Validasi
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

    await loadDetailSales(window.detail_id, window.detail_desc);

    Swal.fire("Berhasil!", "Data berhasil diperbarui.", "success");
    resetCalcForm();
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

    await loadDetailSales(window.detail_id, window.detail_desc);

    Swal.fire("Terhapus!", "Data berhasil dihapus.", "success");
  } catch (error) {
    console.error("Gagal delete actual cost:", error);
    Swal.fire("Gagal!", error.message || "Terjadi kesalahan.", "error");
  }
}

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

  console.log("Payload yang akan dikirim:", JSON.stringify(payload, null, 2));

  Swal.fire({
    title: "Menyimpan...",
    text: "Mengirim data actual costing...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(`${baseUrl}/add/actual_costing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log("Response tambah actual costing:", result);

    if (!res.ok || !result.data?.success) {
      const errorMessage =
        result.data?.message ||
        result.message ||
        "Gagal menyimpan data ke server.";
      throw new Error(errorMessage);
    }

    const successMessage =
      result.data?.message || "Data actual cost berhasil ditambahkan!";

    resetCalcForm();
    await loadDetailSales(window.detail_id, window.detail_desc);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: successMessage,
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("Gagal submit actual costing:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
    });
  }
}

// ================================================================
// FUNGSI QO (ADD/UPDATE ITEM FORM)
// ================================================================

/**
 * Menambahkan baris item baru ke tabel 'tabelItemAdd'.
 */
async function tambahItem(selectedSubCategoryId = "") {
  const typeId = document.getElementById("add_type_id").value;
  const tbody = document.getElementById("tabelItemAdd");

  // Hapus pesan 'Belum ada item' jika ada
  // Hapus baris "Belum ada item" saja, TIDAK untuk semua td[colspan=3]
  const emptyRow = tbody.querySelector(".rowEmpty");
  if (emptyRow) emptyRow.remove();

  const tr = document.createElement("tr");
  tr.classList.add("itemRow");
  const index =
    document.querySelectorAll("#tabelItemAdd tr.itemRow").length + 1;

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
  <!-- Qty -->
  <div>
    <label class="block text-xs text-gray-500">Qty</label>
    <input 
      type="number" 
      class="w-full border rounded px-2 itemQty text-right" 
      value="1" 
      oninput="recalculateTotal()"
    >
  </div>

  <!-- Unit -->
  <div>
    <label class="block text-xs text-gray-500">Unit</label>
    <div class="relative">
      <input 
        type="text" 
        class="w-full border rounded px-2 itemUnit" 
        placeholder="set"
        oninput="filterUnitSuggestions(this)" 
        autocomplete="off"
      >
      <ul class="absolute z-10 w-full bg-white border rounded mt-1 text-sm shadow hidden max-h-48 overflow-y-auto">
        <!-- Unit suggestions -->
      </ul>
    </div>
  </div>

  <!-- Harga Jual -->
  <div class="col-span-2">
    <label class="block text-xs text-gray-500">Harga (Jual)</label>
    <input 
      type="text" 
      class="w-full border rounded px-2 itemHarga text-right bg-gray-100" 
      value="0" 
      readonly
    >
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
          typeId == 3 // Hanya tampilkan jika tipe project = 3 (sesuai QO)
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

  // Pasang listener format rupiah ke input HPP dan Markup
  setupRupiahFormattingForElement(tr.querySelector(".itemHpp"));
  setupRupiahFormattingForElement(tr.querySelector(".itemMarkupNominal"));

  // Load subkategori dan pilih yang sesuai (jika dikirim)
  await loadSubcategories(
    tr.querySelector(".itemSubcategory"),
    selectedSubCategoryId
  );
  return tr;
}

/**
 * Menambahkan baris sub-item (material) baru.
 */
function tambahSubItem(btn) {
  const parentRow = btn.closest("tr");
  const subWrapper = parentRow.nextElementSibling?.querySelector("table");
  if (!subWrapper) return;
  const subTr = document.createElement("tr");
  subTr.classList.add("subItemRow", "bg-gray-50", "italic");

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
  <!-- Qty -->
  <div>
    <label class="block text-xs text-gray-500">Qty</label>
    <input 
      type="number" 
      class="w-full border rounded px-2 text-right subItemQty" 
      value="1" 
      oninput="recalculateTotal()"
    >
  </div>

  <!-- Unit -->
  <div>
    <label class="block text-xs text-gray-500">Unit</label>
    <div class="relative">
      <input 
        type="text" 
        class="w-full border rounded px-2 subItemUnit" 
        placeholder="pcs"
        oninput="filterUnitSuggestions(this)" 
        autocomplete="off"
      >
      <ul class="absolute z-10 w-full bg-white border rounded mt-1 text-sm shadow hidden max-h-48 overflow-y-auto">
        <!-- Unit suggestions -->
      </ul>
    </div>
  </div>

  <!-- Harga (Jual) -->
  <div class="col-span-2">
    <label class="block text-xs text-gray-500">Harga (Jual)</label>
    <input 
      type="text" 
      class="w-full border rounded px-2 text-right subItemHarga bg-gray-100" 
      value="0" 
      readonly
    >
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
  // Pasang listener format rupiah
  setupRupiahFormattingForElement(subTr.querySelector(".subItemHpp"));
  setupRupiahFormattingForElement(subTr.querySelector(".subItemMarkupNominal"));
  return subTr;
}

function filterUnitSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();

  // Ambil <ul> suggestion box yang ada TEPAT SETELAH input
  const suggestionBox = inputElement.nextElementSibling;
  if (!suggestionBox || suggestionBox.tagName !== "UL") {
    console.error("Struktur HTML untuk suggestion box unit salah.");
    return;
  }

  // Hentikan timer (debounce) sebelumnya
  clearTimeout(unitDebounceTimer);

  // Jika input kosong, sembunyikan box
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    return;
  }

  // Set timer baru untuk memanggil API setelah 300ms
  unitDebounceTimer = setTimeout(async () => {
    // Tampilkan status "Mencari..."
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      const res = await fetch(
        `${baseUrl}/table/unit/${owner_id}/1?search=${inputVal}`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        }
      );
      const result = await res.json();

      suggestionBox.innerHTML = ""; // Hapus "Mencari..."

      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          // ❗️ PENTING: Sesuaikan 'item.unit_name' jika key dari API Anda berbeda
          const unitName = item.unit || "N/A";

          const li = document.createElement("li");
          li.textContent = unitName;
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";

          // Saat item diklik, isi input dan sembunyikan list
          li.addEventListener("click", () => {
            inputElement.value = unitName;
            suggestionBox.classList.add("hidden");
          });
          suggestionBox.appendChild(li);
        });
      } else {
        suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Tidak ditemukan</li>`;
      }
    } catch (err) {
      console.error("Gagal fetch unit:", err);
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Gagal memuat data</li>`;
    }
  }, 300); // Jeda 300 milidetik
}

/**
 * Menghapus baris item atau sub-item.
 * ✅ PERBAIKAN: Menghapus panggilan calculateTotals()
 */
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

  // Panggil recalculateTotal() untuk update subtotal di item lain jika perlu
  recalculateTotal();

  // calculateTotals(); // <-- ⛔ DIHAPUS KARENA MENYEBABKAN CRASH
}

/**
 * Memasang listener format rupiah ke input HPP/Markup.
 * ✅ PERBAIKAN: Menghapus panggilan calculateTotals()
 */
function setupRupiahFormattingForElement(element) {
  if (!element) return;
  element.addEventListener("input", function (e) {
    const value = e.target.value.replace(/[^\d]/g, "");
    e.target.value = finance(value); // Asumsi 'finance' adalah formatter Anda

    const row = e.target.closest("tr");
    if (!row) return;

    // Hitung ulang harga jual (panggil recalculateHarga)
    // 'recalculateHarga' akan memanggil 'recalculateTotal'
    if (
      e.target.classList.contains("itemHpp") ||
      e.target.classList.contains("subItemHpp")
    ) {
      recalculateHarga(e.target, "hpp");
    } else if (
      e.target.classList.contains("itemMarkupNominal") ||
      e.target.classList.contains("subItemMarkupNominal")
    ) {
      recalculateHarga(e.target, "nominal");
    }

    // calculateTotals(); // <-- ⛔ DIHAPUS KARENA MENYEBABKAN CRASH
  });
}

/**
 * Menghitung ulang total di SETIAP baris.
 * ✅ PERBAIKAN: Memastikan calculateTotals() di-comment.
 */
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

  // calculateTotals(); // <-- ⛔ PASTIKAN INI DI-COMMENT
}

/**
 * Fungsi kalkulasi dari QO (TIDAK DIPANGGIL, tapi biarkan)
 * Biarkan fungsi ini ada jika file QO lain masih menggunakannya.
 */
function calculateTotals() {
  // Fungsi ini mencari ID 'contract_amount', 'ppn', 'total', dll.
  // yang TIDAK ADA di halaman Project Costing.
  console.warn(
    "calculateTotals() dipanggil di halaman Project, ini seharusnya tidak terjadi."
  );

  let subtotal = 0;
  document
    .querySelectorAll("#tabelItemAdd .itemTotal, #tabelItemAdd .subItemTotal")
    .forEach((cell) => {
      subtotal += parseRupiah(cell.textContent || "0");
    });

  const diskonEl = document.getElementById("discount");
  const cekPpnEl = document.getElementById("cekPpn");
  const contractAmountEl = document.getElementById("contract_amount");
  const ppnEl = document.getElementById("ppn");
  const totalEl = document.getElementById("total");

  const diskon = parseRupiah(diskonEl?.value || 0);
  const dpp = subtotal - diskon;

  let ppn = 0;
  if (cekPpnEl && cekPpnEl.checked) {
    ppn = Math.round(dpp * 0.11);
  }
  const total = dpp + ppn;

  if (contractAmountEl) contractAmountEl.value = finance(subtotal);
  if (ppnEl) ppnEl.value = finance(ppn);
  if (totalEl) totalEl.value = finance(total);
}

/**
 * Menghitung ulang harga jual berdasarkan HPP/Markup.
 */
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

  recalculateTotal(); // Panggil ini untuk update subtotal baris
}

// ================================================================
// FUNGSI HELPER (Dropdown, Tanggal, dll)
// ================================================================

function setTodayDate(elementId) {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById(elementId);
  if (dateInput) {
    dateInput.value = today;
  }
}

async function loadSalesType(elementId) {
  const typeSelect = document.getElementById(elementId);
  if (!typeSelect) return;
  typeSelect.innerHTML = '<option value="">Memuat Tipe...</option>';
  try {
    const response = await fetch(`${baseUrl}/list/type_sales`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Gagal mengambil data sales type");
    const result = await response.json();
    const salesTypes = result.listData;

    typeSelect.innerHTML = '<option value="">Pilih Tipe</option>';
    salesTypes.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.type_id;
      option.textContent = `${item.nama_type} (${item.kode_type})`;
      typeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Gagal load sales type:", error);
    typeSelect.innerHTML = '<option value="">Gagal Load</option>';
  }
}

async function loadCustomerList(elementId) {
  const select = document.getElementById(elementId);
  if (!select) return;
  select.innerHTML = '<option value="">Memuat Client...</option>';
  try {
    const response = await fetch(`${baseUrl}/client/sales/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Gagal mengambil data client");
    const result = await response.json();
    customerList = result.data || [];

    select.innerHTML = `<option value="">-- Pilih Client --</option>`;
    customerList.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.client_id;
      opt.textContent = `${item.nama_client} (${item.alias})`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error load client:", error);
    select.innerHTML = '<option value="">Gagal Load</option>';
    customerList = [];
  }
}

async function loadProjectManagers(elementId) {
  const select = document.getElementById(elementId);
  if (!select) return;
  select.innerHTML = `<option value="">Memuat PM...</option>`;

  try {
    const res = await fetch(`${baseUrl}/list/project_manager/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();

    if (data.listData && data.listData.length > 0) {
      select.innerHTML = `<option value="">-- Pilih Project Manager --</option>`;
      data.listData.forEach((pm) => {
        const option = document.createElement("option");
        option.value = pm.employee_id;
        option.textContent = `${pm.name} (${pm.alias})`;
        select.appendChild(option);
      });
    } else {
      select.innerHTML = `<option value="">Tidak ada data PM</option>`;
    }
  } catch (err) {
    console.error("Gagal ambil PM:", err);
    select.innerHTML = `<option value="">Gagal load PM</option>`;
  }
}

function toggleTambahItemBtn() {
  const select = document.getElementById("add_type_id");
  const btn = document.getElementById("addItemBtn");
  if (!select || !btn) return;

  if (select.value !== "" && select.value !== "0") {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
  }
}

async function loadSubcategories(selectElement, selectedId = "") {
  if (!selectElement) return;
  selectElement.innerHTML = `<option value="">Memuat...</option>`;
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

function parseRupiah(rupiah) {
  if (!rupiah || typeof rupiah !== "string") return 0;
  const isNegative = rupiah.trim().startsWith("-");
  const angkaString = rupiah.replace(/[^\d]/g, "");
  let angka = parseInt(angkaString) || 0;
  return isNegative ? -angka : angka;
}

function parseFormattedNumber(val) {
  if (!val) return 0;
  const cleanedVal = String(val).replace(/\./g, "").replace(",", ".");
  return parseFloat(cleanedVal) || 0;
}

// ================================================================
// FUNGSI MODAL (VIEW DETAIL, PRINT, CONVERT TO SALES)
// ================================================================

/**
 * Menampilkan modal detail actual costing (tombol mata).
 */
function showActualCostDetail(korelasiPekerjaan, korelasiMaterial) {
  const selectedItem = projectDetailData.items.find(
    (item) => item.product === korelasiPekerjaan
  );

  let details = [];
  let modalTitle = `Detail Actual Costing: "${korelasiPekerjaan}"`;

  if (!selectedItem) {
    console.error("Data Pekerjaan tidak ditemukan:", korelasiPekerjaan);
    return;
  }

  if (korelasiMaterial) {
    // LOGIKA A: User mengklik "mata" di baris MATERIAL
    modalTitle = `Detail Actual Cost: "${korelasiMaterial}"`;
    if (selectedItem.materials?.length > 0) {
      const selectedMaterial = selectedItem.materials.find(
        (mat) => mat.name === korelasiMaterial
      );
      if (selectedMaterial && selectedMaterial.actuals?.length > 0) {
        details = selectedMaterial.actuals;
      }
    }
  } else {
    // LOGIKA B: User mengklik "mata" di baris PEKERJAAN
    if (selectedItem.materials?.length > 0) {
      selectedItem.materials.forEach((mat) => {
        if (mat.actuals?.length > 0) {
          details = details.concat(mat.actuals);
        }
      });
    } else if (selectedItem.actuals?.length > 0) {
      details = details.concat(selectedItem.actuals);
    }
  }

  // Buat tabel HTML
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

  Swal.fire({
    title: modalTitle,
    html: htmlContent,
    width: "800px",
    confirmButtonText: "Tutup",
  });
}

// ===========================================================
// FUNGSI KONVERSI KE SALES (VERSI BERSIH)
// ===========================================================

// ===========================================================
// FUNGSI BARU: BUKA MODAL KONVERSI KE SALES
// ===========================================================
async function openConvertToSalesModal() {
  // 1. Cek apakah data project sudah ada
  if (!projectDetailData) {
    Swal.fire("Error", "Data project belum ter-load penuh.", "error");
    return;
  }

  // 2. Ambil tanggal hari ini untuk default value
  const today = new Date().toISOString().split("T")[0];

  // 3. Tampilkan modal
  const { value: formValues } = await Swal.fire({
    title: "Buat Quotation",
    width: "600px",
    html: `
      <div class="space-y-3 text-left p-2">
        <p class="text-sm text-gray-600">
          Ini akan mengonversi data project costing saat ini menjadi
          Quotation baru.
        </p>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Tanggal Order</label>
          <input type="date" id="sales_order_date" class="w-full border rounded px-3 py-2" value="${today}">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Nama PIC</label>
          <input type="text" id="sales_pic_name" class="w-full border rounded px-3 py-2" 
            placeholder="Masukkan nama PIC Client">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan Sales Order",
    cancelButtonText: "Batal",
    preConfirm: () => {
      // 4. Ambil dan Validasi data modal
      const order_date = document.getElementById("sales_order_date").value;
      const pic_name = document.getElementById("sales_pic_name").value;

      if (!order_date || !pic_name) {
        Swal.showValidationMessage("Tanggal Order dan Nama PIC wajib diisi.");
        return false;
      }
      return { order_date, pic_name };
    },
  });

  // 5. Jika user klik "Simpan" dan validasi lolos
  if (formValues) {
    await handleSaveConvertToSales(formValues);
  }
}

// ===========================================================
// FUNGSI BARU: SIMPAN KONVERSI KE API (VERSI BERSIH)
// ===========================================================
// ===========================================================
// FUNGSI SIMPAN KONVERSI KE API (PERBAIKAN FINAL)
// ===========================================================
async function handleSaveConvertToSales(formData) {
  // formData berisi: { order_date: "...", pic_name: "..." }

  Swal.fire({
    title: "Menyimpan...",
    text: "Mengonversi project menjadi sales order...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 1. Transformasi data 'items' dan 'materials'
    // (Kode ini sudah benar dan tidak diubah)
    const transformedItems = projectDetailData.items.map((item) => {
      const transformedMaterials = item.materials.map((mat) => {
        return {
          subItemMaterial: mat.name,
          subItemSpec: mat.specification,
          subItemQty: mat.qty,
          subItemHpp: mat.hpp || 0,
          subItemMarkupNominal: mat.markup_nominal || 0,
          subItemMarkupPercent: mat.markup_percent || 0,
          subItemUnit: mat.unit,
          subItemHarga: mat.unit_price,
        };
      });

      return {
        product: item.product,
        sub_category_id: item.sub_category_id,
        description: item.description,
        qty: item.qty,
        hpp: item.hpp || 0,
        markup_nominal: item.markup_nominal || 0,
        markup_percent: item.markup_percent || 0,
        unit: item.unit,
        unit_price: item.unit_price,
        materials: transformedMaterials,
      };
    });

    const selectedPelangganId = parseInt(
      document.getElementById("add_client").value || 0
    );

    if (selectedPelangganId === 0) {
      throw new Error(
        "Client tidak valid. Pastikan dropdown Client sudah terisi dengan benar."
      );
    }

    const payload = {
      owner_id: user.owner_id,
      user_id: user.user_id,
      project_id: projectDetailData.project_id,
      type_id: projectDetailData.type_id,
      pelanggan_id: selectedPelangganId, // <-- MENGGUNAKAN NILAI DARI DROPDOWN
      pic_name: formData.pic_name, // Dari modal
      order_date: formData.order_date, // Dari modal
      items: transformedItems,
    };
    // ⬆️ ⬆️ BATAS PERBAIKAN ⬆️ ⬆️

    console.log("Payload SIAP KIRIM:", JSON.stringify(payload, null, 2));

    // 3. Kirim ke API
    const res = await fetch(`${baseUrl}/add/project_sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Gagal menyimpan Sales Order.");
    }

    // 4. Pola Sukses
    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: result.message || "Project berhasil dikonversi.",
    });

    // 5. Refresh halaman
    sessionStorage.setItem("projectMode", "view");
    loadDetailSales(window.detail_id, window.detail_desc);
  } catch (err) {
    // 6. Pola Error
    console.error("Gagal konversi ke sales:", err);
    await Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
    });
  }
}
// ================================================================
// EVENT LISTENER GLOBAL
// ================================================================

// Listener untuk tombol "Update Plan Costing" di Tab 1 View
document.addEventListener("DOMContentLoaded", () => {
  const saveAllBtn = document.getElementById("saveAllPlanCostBtn");
  if (saveAllBtn) {
    saveAllBtn.addEventListener("click", handleUpdateAllPlanCosting);
  } else {
    console.warn("Tombol #saveAllPlanCostBtn tidak ditemukan");
  }
});

// Listener untuk tombol "mata" (view actual) di tabel Tab 1 View
document
  .getElementById("tabelItemView")
  .addEventListener("click", function (event) {
    const eyeButton = event.target.closest(".view-actual-cost-btn");
    if (eyeButton) {
      const korelasiPekerjaan = eyeButton.dataset.korelasi;
      const korelasiMaterial = eyeButton.dataset.materialName;
      showActualCostDetail(korelasiPekerjaan, korelasiMaterial);
      return;
    }
  });

// Listener formatter untuk form Tab 2 (Real Calc)
document
  .getElementById("realCalcForm")
  .querySelectorAll(".formatNumber")
  .forEach((input) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value.replace(/\D/g, "");
      e.target.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      updateFormTotal();
    });
  });

// Panggil fungsi load utama saat script dimuat
loadDetailSales(window.detail_id, window.detail_desc);
