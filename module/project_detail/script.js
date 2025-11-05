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

  // 💡 REVISI: Tampilkan loading utama
  Swal.fire({
    title: "Memuat Data Project...",
    text: "Mohon tunggu sebentar.",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    // 🔹 Fetch detail project dari API
    const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const response = await res.json();

    if (!response.success || !response.detail) {
      throw new Error(response.message || "Struktur data API tidak valid");
    }

    // 🔹 Simpan data project ke variabel global
    projectDetailData = response.detail;
    const data = projectDetailData;

    // 🔹 Tampilkan informasi utama project
    document.getElementById("projectNameDisplay").textContent =
      data.project_name || "Project Detail";
    document.getElementById("projectAmount").innerHTML =
      finance(data.project_value) || 0;
    document.getElementById("plan_costing").innerHTML =
      finance(data.plan_costing) || 0;
    document.getElementById("actual_costing").innerHTML =
      finance(data.actual_cost) || 0;
    document.getElementById("margin").innerHTML = finance(data.margin) || 0;

    // 🔹 Siapkan tabel item
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    // ======================================================
    // 🔸 Tampilkan item berdasarkan sub_category (grouping)
    // ======================================================
    if (data.items?.length) {
      const groups = {};

      // Grouping berdasarkan sub_category
      data.items.forEach((item) => {
        if (!groups[item.sub_category]) groups[item.sub_category] = [];
        groups[item.sub_category].push(item);
      });

      let nomor = 1;

      // Loop setiap group
      Object.keys(groups).forEach((subCat) => {
        // 🔹 Header sub-category
        const trHeader = document.createElement("tr");
        trHeader.className = "bg-gray-200 font-semibold";
        trHeader.innerHTML = `
          <td colspan="10" class="px-3 py-2 uppercase">${subCat || "-"}</td>
        `;
        tbody.appendChild(trHeader);

        // 🔹 Loop item dalam sub-category
        groups[subCat].forEach((item) => {
          // Perhitungan nilai
          const item_plan_costing =
            item.materials.reduce((s, m) => s + (m.costing || 0), 0) ||
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
          const item_unit_price =
            item.qty > 0 ? item.total / item.qty : item.unit_price || 0;

          // Baris utama item
          const tr = document.createElement("tr");
          tr.className = "border-b bg-gray-50";
          tr.dataset.itemId = item.project_item_id;

          // 🔸 Isi baris utama
          tr.innerHTML = `
            <td class="px-3 py-2 align-top text-sm font-semibold">${nomor++}</td>
            <td class="px-3 py-2 align-top">
              <div class="font-medium">${item.product || "-"}</div>
              <div class="text-xs text-gray-500">${item.description || ""}</div>
            </td>
            ${
              item.materials?.length
                ? `
                  <td colspan="6" class="px-3 py-2 text-left text-gray-500 italic text-xs">
                  
                  </td>
                `
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
                    <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${
                      item.plan_total
                    }">
                  </td>
                  <td class="px-3 py-2 text-center align-top">
                    <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
                      <span>${formatNumber(item.actual_total)}</span>
                      <button class="view-actual-cost-btn" data-korelasi="${
                        item.product
                      }" title="Lihat Detail">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
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
        <td class="px-3 py-1 text-right">${formatNumber(m.unit_price || 0)}</td>
        <td class="px-3 py-1 text-right">${formatNumber(
          m.material_total || 0
        )}</td>
        <td class="px-3 py-1 text-center">
          <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${
            m.plan_total || 0
          }">
        </td>
        <td class="px-3 py-1 text-center">
          
          <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
            
            <span>${formatNumber(m.actual_total || 0)}</span>

            <button class="view-actual-cost-btn" data-korelasi="${
              item.product
            }" title="Lihat Detail">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 hover:text-blue-800" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                          </svg>
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
      // 🔸 Jika tidak ada item
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center text-gray-500 italic py-3">
            Tidak ada item
          </td>
        </tr>
      `;
    }

    // ======================================================
    // 🔹 Inisialisasi Tab dan Event
    // ======================================================
    window.dataLoaded = true;
    await initRealCalculationTab();
    const saveBtn = document.getElementById("saveAllPlanCostBtn");
    if (saveBtn) {
      saveBtn.removeEventListener("click", handleUpdateAllPlanCosting);
      saveBtn.addEventListener("click", handleUpdateAllPlanCosting);
    }

    switchTab(tab1, tab1Btn);
    switchTab(tab1, tab1Btn); // Pastikan tab pertama aktif

    // 💡 REVISI: Tutup loading utama setelah semua selesai
    Swal.close();
  } catch (err) {
    console.error("Gagal load detail:", err);
    // 💡 REVISI: Tampilkan error jika gagal
    Swal.fire("Error", err.message || "Gagal memuat detail penjualan", "error");
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
  const tableBody = document.getElementById("tabelItem");

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
            const plan_total = parseFloat(input?.value.replace(/,/g, "") || 0);

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
        const plan_total = parseFloat(input?.value.replace(/,/g, "") || 0);
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

    // 💡 REVISI UTAMA DI SINI
    // 3. Panggil dan TUNGGU (await) data untuk di-refresh
    //    Fungsi loadDetailSales akan menampilkan loading-nya sendiri
    //    dan menutup loading "Menyimpan..."
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

  // 💡 REVISI: Cari di variabel baru
  const selectedItem = dataItemDropdown.find(
    (item) => item.project_item_id == selectedPekerjaanId
  );

  if (selectedItem && selectedItem.materials?.length > 0) {
    selectedItem.materials.forEach((mat) => {
      const option = document.createElement("option");
      option.value = mat.name;
      option.textContent = mat.name;
      option.dataset.unit = mat.unit;
      option.dataset.materialId = mat.material_id; // Pastikan API mengirimkan ini
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

  const productName = selectedOption.value;
  const unit = selectedOption.dataset.unit;

  document.getElementById("calcProduct").value = productName;
  document.getElementById("calcUnit").value = unit || "pcs";
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
  updateCalcTotal();
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
  document.getElementById("calcQty").value = item.qty;
  document.getElementById("calcUnit").value = item.unit;
  document.getElementById("calcHarga").value = item.total;

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
      (opt) => opt.text === item.product
    );
    if (optionExists) {
      selectMaterial.value = optionExists.value;
    }
  }, 100);
}

function getAndValidateCalcForm() {
  const name = document.getElementById("calcProduct").value;
  const project_item_id = document.getElementById(
    "calcKorelasiPekerjaan"
  ).value;
  const qty = parseFloat(document.getElementById("calcQty").value) || 0;
  const unit = document.getElementById("calcUnit").value;
  const total = parseFloat(document.getElementById("calcHarga").value) || 0;
  const unit_price = qty > 0 ? total / qty : 0;

  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const selectedMaterialOption =
    selectMaterial.options[selectMaterial.selectedIndex];
  const project_materials_id =
    selectedMaterialOption?.dataset.materialId || "0";
  const notes = document.getElementById("calcNotes")?.value || "";
  const project_id = projectDetailData.project_id.toString();

  if (!name || !project_item_id || qty <= 0 || !unit || total <= 0) {
    Swal.fire(
      "Gagal",
      "Harap isi semua field (Nama, Korelasi, Qty, Unit, Harga Total) dengan benar. Qty dan Harga Total harus lebih dari 0.",
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
  .getElementById("tabelItem")
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

    // 💡 REVISI: Urutan diubah. Reset dan Load data dulu.
    resetCalcForm(); // 1. Reset form input
    await loadDetailSales(window.detail_id, window.detail_desc); // 2. Reload data (tunggu sampai selesai)

    // 💡 REVISI: Tampilkan sukses SETELAH semua selesai
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
// FUNGSI MODAL (TOMBOL MATA)
// ================================================================
function showActualCostDetail(korelasi) {
  // 💡 REVISI: Ambil data dari 'realCalculationData' (data Tab 2)
  //    dan filter berdasarkan 'cost_name' (kolom Korelasi)
  const details = realCalculationData.filter(
    (item) => item.cost_name === korelasi
  );

  // 2. Buat tabel HTML untuk modal
  let htmlContent = "";
  if (details.length === 0) {
    htmlContent =
      '<p class="text-center text-gray-500">Tidak ada data detail pengeluaran (actual cost) untuk item ini.</p>';
  } else {
    htmlContent = `
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-3 py-2">Product</th>
            <th class="px-3 py-2 text-right">Unit Price</th>
            <th class="px-3 py-2 text-right">Qty</th>
            <th class="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    let total = 0;
    details.forEach((item) => {
      // 💡 REVISI: Gunakan 'item.total' (sesuai data di realCalculationData)
      htmlContent += `
        <tr class="border-b">
          <td class="px-3 py-2">${item.product}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.unit_price)}</td>
          <td class="px-3 py-2 text-right">${item.qty}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.total)}</td>
        </tr>
      `;
      total += item.total; // 💡 REVISI: Gunakan 'item.total'
    });
    htmlContent += `
        </tbody>
        <tfoot class="font-bold">
          <tr>
            <td colspan="3 " class="px-3 py-2 text-right">Total:</td>
            <td class="px-3 py-2 text-right">${formatNumber(total)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // 3. Tampilkan modal
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
