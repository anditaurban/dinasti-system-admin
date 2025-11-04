pagemodule = "Project";
subpagemodule = "Project Costing";
renderHeader();

// ================================================================
// VARIABEL GLOBAL
// ================================================================
projectDetailData = null; // Menyimpan data /detail/project/{id}
realCalculationData = []; // Menyimpan data untuk tabel Tab 2

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
                  <td colspan="8" class="px-3 py-2 text-left text-gray-500 italic text-xs">
                 
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
                    item_unit_price
                  )}</td>
                  <td class="px-3 py-2 text-right align-top">${formatNumber(
                    item_project_value
                  )}</td>
                  <td class="px-3 py-2 text-center align-top">
                    <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${item_plan_costing}">
                  </td>
                  <td class="px-3 py-2 text-center align-top">
                    <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
                      <span>${formatNumber(item_actual_costing)}</span>
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
                  <td class="px-3 py-2 text-center align-top">
                    <input type="date" class="payment_date border px-2 py-1" value="${
                      item.payment_date || ""
                    }">
                  </td>
                  <td class="px-3 py-2 text-center align-top">
                    <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                      Update
                    </button>
                  </td>
                `
            }
          `;
          tbody.appendChild(tr);

          // ======================================================
          // 🔹 Baris Material (SubItem)
          // ======================================================
          if (item.materials?.length) {
            item.materials.forEach((m, mIdx) => {
              const subTr = document.createElement("tr");
              subTr.className = "border-b bg-gray-50 text-sm";

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
                  m.total || 0
                )}</td>
                <td class="px-3 py-1 text-center">
                  <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${
                    m.costing || 0
                  }">
                </td>
                <td class="px-3 py-1 text-center">
                  <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
                    <span>${formatNumber(m.actual_total || 0)}</span>
                  </div>
                </td>
                <td class="px-3 py-1 text-center">
                  <input type="date" class="payment_date border px-2 py-1" value="${
                    m.payment_date || ""
                  }">
                </td>
                <td class="px-3 py-1 text-center">
                  <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                    Update
                  </button>
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
    initRealCalculationTab();
    switchTab(tab1, tab1Btn); // Pastikan tab pertama aktif
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail penjualan", "error");
  }
}

// Event delegation untuk tombol Update di tabel
document.getElementById("tabelItem").addEventListener("click", async (e) => {
  if (e.target.closest(".update-btn")) {
    const tr = e.target.closest("tr");
    const itemId = tr.dataset.itemId;
    if (!itemId) return Swal.fire("Gagal", "Item ID tidak ditemukan", "error");

    // Ambil nilai dari input di baris yang sama
    const planCosting = parseFloat(
      tr.querySelector(".plancosting")?.value || 0
    );
    const paymentDate = tr.querySelector(".payment_date")?.value || null;

    try {
      const confirm = await Swal.fire({
        title: "Update Data?",
        text: "Apakah kamu yakin ingin memperbarui costing item ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Update",
        cancelButtonText: "Batal",
      });
      if (!confirm.isConfirmed) return;

      const payload = {
        project_item_id: itemId,
        plan_costing: planCosting,
        payment_date: paymentDate,
      };

      const res = await fetch(`${baseUrl}/update/project-costing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      const response = await res.json();
      if (!response.success)
        throw new Error(response.message || "Update gagal");

      Swal.fire("Berhasil", "Data costing berhasil diperbarui!", "success");
      // Refresh detail agar nilai terupdate
      loadDetailSales(window.detail_id, window.detail_desc);
    } catch (err) {
      console.error("Error update costing:", err);
      Swal.fire("Error", err.message || "Gagal memperbarui costing", "error");
    }
  }
});

// ================================================================
// FUNGSI BARU UNTUK TAB 2 (REAL CALCULATION)
// ================================================================

/**
 * Inisialisasi semua listener dan data untuk Tab 2
 */
function initRealCalculationTab() {
  populatePekerjaanDropdown();
  loadRealCalculationDetails();

  // Set listener untuk form
  document
    .getElementById("realCalcForm")
    .addEventListener("submit", handleActualCostSubmit);

  // Set listener untuk dropdown
  document
    .getElementById("calcKorelasiPekerjaan")
    .addEventListener("change", handlePekerjaanChange);
  document
    .getElementById("calcKorelasiMaterial")
    .addEventListener("change", handleMaterialChange);

  // =======================
  // TAMBAHKAN LISTENER INI
  // =======================
  document
    .getElementById("realCalcBody")
    .addEventListener("click", handleCostAction);
}

async function handleCostAction(e) {
  // Cari tombol edit
  const editBtn = e.target.closest(".edit-cost-btn");
  if (editBtn) {
    e.preventDefault();
    const costId = editBtn.dataset.costId;
    if (costId) {
      // Panggil fungsi untuk mengisi form
      populateFormForUpdate(costId);
    }
    return; // Hentikan eksekusi
  }

  // Cari tombol delete
  const deleteBtn = e.target.closest(".delete-cost-btn");
  if (deleteBtn) {
    e.preventDefault();
    const costId = deleteBtn.dataset.costId;
    if (costId) {
      // Panggil fungsi untuk menghapus
      await handleDeleteActualCost(costId);
    }
    return; // Hentikan eksekusi
  }
}
/**
 * Mengisi dropdown "Korelasi Pekerjaan"
 */
function populatePekerjaanDropdown() {
  const select = document.getElementById("calcKorelasiPekerjaan");
  select.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>';

  if (projectDetailData && projectDetailData.items) {
    projectDetailData.items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.project_item_id; // Kirim ID ini ke API
      option.textContent = item.product;
      select.appendChild(option);
    });
  }
}

/**
 * Menangani perubahan dropdown "Pekerjaan", lalu mengisi dropdown "Material"
 */
function handlePekerjaanChange() {
  const selectPekerjaan = document.getElementById("calcKorelasiPekerjaan");
  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const selectedPekerjaanId = selectPekerjaan.value;

  // Reset & disable dropdown material
  selectMaterial.innerHTML = '<option value="">-- Pilih Material --</option>';
  selectMaterial.disabled = true;
  selectMaterial.classList.add("bg-gray-100");

  if (!selectedPekerjaanId) return; // Jika memilih "--Pilih Pekerjaan--"

  // Cari item pekerjaan yang dipilih
  const selectedItem = projectDetailData.items.find(
    (item) => item.project_item_id == selectedPekerjaanId
  );

  // Jika item ditemukan DAN punya materials
  if (selectedItem && selectedItem.materials?.length > 0) {
    selectedItem.materials.forEach((mat) => {
      const option = document.createElement("option");
      option.value = mat.name; // Kita pakai 'name' untuk auto-fill
      option.textContent = mat.name;
      option.dataset.unit = mat.unit; // Simpan unit-nya
      selectMaterial.appendChild(option);
    });
    // Aktifkan dropdown material
    selectMaterial.disabled = false;
    selectMaterial.classList.remove("bg-gray-100");
  }
}

/**
 * Menangani perubahan dropdown "Material", lalu auto-fill form
 */
function handleMaterialChange() {
  const selectMaterial = document.getElementById("calcKorelasiMaterial");
  const selectedOption = selectMaterial.options[selectMaterial.selectedIndex];

  if (!selectedOption || !selectedOption.value) return;

  const productName = selectedOption.value;
  const unit = selectedOption.dataset.unit;

  // Auto-fill form
  document.getElementById("calcProduct").value = productName;
  document.getElementById("calcUnit").value = unit || "pcs";
}

/**
 * Membangun data dan me-render tabel di Tab 2
 */
function loadRealCalculationDetails() {
  // 1. (Re)Build array realCalculationData dari data project utama
  realCalculationData = [];
  if (projectDetailData && projectDetailData.items) {
    projectDetailData.items.forEach((item) => {
      // Cek materials
      if (item.materials?.length > 0) {
        item.materials.forEach((mat) => {
          realCalculationData.push({
            id: mat.project_materials_id,
            project_item_id: item.project_item_id, // <-- PENTING untuk Edit
            tanggal: mat.payment_date || projectDetailData.start_date || "N/A",
            product: mat.name,
            korelasi: item.product,
            unit_price: mat.actual_unit_price || 0,
            qty: mat.actual_qty || 0,
            unit: mat.unit || "",
            harga: mat.actual_total || 0,
          });
        });
      }
      // Cek item itu sendiri
      else if (item.actual_total > 0) {
        realCalculationData.push({
          id: item.project_item_id, // ID-nya adalah ID item itu sendiri
          project_item_id: item.project_item_id, // <-- PENTING untuk Edit
          tanggal: item.payment_date || projectDetailData.start_date || "N/A",
          product: item.product,
          korelasi: item.product,
          unit_price: item.actual_unit_price || 0,
          qty: item.actual_qty || 0,
          unit: item.unit || "",
          harga: item.actual_total || 0,
        });
      }
    });
  }

  // 2. Render tabel
  const tbody = document.getElementById("realCalcBody");
  tbody.innerHTML = "";
  if (realCalculationData && realCalculationData.length > 0) {
    realCalculationData.forEach((data) => {
      tbody.innerHTML += `
        <tr class="border-b" data-id="${data.id}">
          <td class="px-3 py-2">${data.product}</td>
          <td class="px-3 py-2">${data.korelasi}</td>
          <td class="px-3 py-2 text-right">${formatNumber(data.unit_price)}</td>
          <td class="px-3 py-2 text-right">${data.qty}</td>
          <td class="px-3 py-2 text-right">${data.unit}</td>
          <td class="px-3 py-2 text-right">${formatNumber(data.harga)}</td>
          
          <td class="px-3 py-2 text-center">
            <button class="edit-cost-btn p-1 text-blue-600 hover:text-blue-800" data-cost-id="${
              data.id
            }" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button class="delete-cost-btn p-1 text-red-600 hover:text-red-800" data-cost-id="${
              data.id
            }" title="Hapus">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
function populateFormForUpdate(costId) {
  // PERBAIKAN 1: Cari berdasarkan 'd.id' bukan 'd.cost_id'
  const item = realCalculationData.find((d) => d.id == costId);

  if (!item) {
    Swal.fire(
      "Error",
      "Data item tidak ditemukan (ID: " + costId + ").",
      "error"
    );
    console.error("Item not found in realCalculationData for ID:", costId);
    return;
  }

  // Simpan ID yang sedang di-edit
  currentUpdateCostId = costId;

  // PERBAIKAN 2: Gunakan 'item.product' bukan 'item.cost_name'
  document.getElementById("calcProduct").value = item.product;

  // PERBAIKAN 3: Gunakan ID dropdown 'calcKorelasiPekerjaan'
  document.getElementById("calcKorelasiPekerjaan").value = item.project_item_id;

  document.getElementById("calcQty").value = item.qty;
  document.getElementById("calcUnit").value = item.unit;

  // PERBAIKAN 4: Asumsi form memiliki 'calcHarga' (Total) BUKAN 'calcUnitPrice'
  // Ini untuk konsistensi dengan form 'Add' (handleActualCostSubmit)
  document.getElementById("calcHarga").value = item.harga; // 'item.harga' adalah total (actual_total)

  // Ubah tombol submit
  const submitBtn = document.getElementById("submitCalcFormBtn");
  submitBtn.textContent = "💾 Update Data";
  submitBtn.classList.add("bg-green-600", "hover:bg-green-700");
  submitBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");

  // Tampilkan tombol Batal
  document.getElementById("cancelUpdateBtn").classList.remove("hidden");

  // Scroll ke form
  document
    .getElementById("realCalcForm")
    .scrollIntoView({ behavior: "smooth" });

  // PENTING: Trigger change di dropdown pekerjaan
  // agar dropdown material terisi jika ada
  handlePekerjaanChange();

  // Opsional: Coba pilih material jika datanya ada
  setTimeout(() => {
    const selectMaterial = document.getElementById("calcKorelasiMaterial");
    // Coba temukan material yang namanya = item.product
    const optionExists = Array.from(selectMaterial.options).find(
      (opt) => opt.text === item.product
    );
    if (optionExists) {
      selectMaterial.value = optionExists.value;
    }
  }, 100); // Beri jeda sedikit agar dropdown material ter-populate
}

function getAndValidateCalcForm() {
  // Ambil data dari form
  const name = document.getElementById("calcProduct").value;
  const project_item_id = document.getElementById(
    "calcKorelasiPekerjaan"
  ).value; // PERBAIKAN: ID dropdown
  const qty = parseFloat(document.getElementById("calcQty").value) || 0;
  const unit = document.getElementById("calcUnit").value;
  const total = parseFloat(document.getElementById("calcHarga").value) || 0; // PERBAIKAN: Ambil 'calcHarga' (Total)
  const unit_price = qty > 0 ? total / qty : 0; // Hitung unit_price

  const project_id = projectDetailData.project_id;

  if (!name || !project_item_id || !qty || !unit || total <= 0) {
    // Validasi berdasarkan 'total'
    Swal.fire(
      "Gagal",
      "Harap isi semua field (Nama, Korelasi, Qty, Unit, Harga Total) dengan benar.",
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
    unit_price: unit_price.toString(), // Kirim unit_price yang dihitung
    total: total.toString(), // Kirim total
  };
}

async function handleUpdateActualCost(costId) {
  const payload = getAndValidateCalcForm(); // Ambil data dari form
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
    //    Gunakan loadDetailSales, bukan refreshAllProjectData()
    await loadDetailSales(window.detail_id, window.detail_desc);

    // 3. Tampilkan sukses HANYA JIKA SEMUA berhasil
    Swal.fire("Berhasil!", "Data berhasil diperbarui.", "success");
    resetCalcForm(); // Reset form setelah sukses
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

document
  .getElementById("tabelItem")
  .addEventListener("click", function (event) {
    // Cek untuk tombol mata
    const eyeButton = event.target.closest(".view-actual-cost-btn");
    if (eyeButton) {
      const korelasi = eyeButton.dataset.korelasi;
      showActualCostDetail(korelasi);
    }

    // Cek untuk tombol update
    const updateButton = event.target.closest(".update-btn");
    if (updateButton) {
      // (Tambahkan logika untuk tombol 'Update' di sini jika perlu)
      console.log("Tombol update diklik");
    }
  });

/**
 * Menangani submit form "Input Detail Pengeluaran"
 */
async function handleActualCostSubmit(event) {
  event.preventDefault();

  if (currentUpdateCostId) {
    // Jika ada ID, kita sedang UPDATE
    await handleUpdateActualCost(currentUpdateCostId);
  } else {
    // Jika tidak ada ID, kita ADD
    await handleAddNewActualCost();
  }
}
async function handleAddNewActualCost() {
  const payload = getAndValidateCalcForm(); // Kita bisa reuse validasi
  if (!payload) return;

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
    if (!res.ok || !result.success) {
      throw new Error(result.message || "Gagal menyimpan data ke server.");
    }

    Swal.fire("Berhasil", "Data actual cost berhasil ditambahkan!", "success");

    resetCalcForm(); // Reset form

    // Muat ulang semua data dari server
    await loadDetailSales(window.detail_id, window.detail_desc);
  } catch (err) {
    console.error("Gagal submit actual costing:", err);
    Swal.fire("Error", err.message, "error");
  }
}

// ================================================================
// FUNGSI MODAL (TOMBOL MATA)
// ================================================================
function showActualCostDetail(korelasi) {
  // 1. Ambil data dari variabel global
  // Kita build ulang datanya dari projectDetailData untuk memastikan
  let details = [];
  const selectedItem = projectDetailData.items.find(
    (item) => item.product === korelasi
  );

  if (selectedItem) {
    if (selectedItem.materials?.length > 0) {
      // Jika ada material, ambil dari material
      selectedItem.materials.forEach((mat) => {
        details.push({
          product: mat.name,
          unit_price: mat.actual_unit_price || 0,
          qty: mat.actual_qty || 0,
          unit: mat.unit || "",
          harga: mat.actual_total || 0,
        });
      });
    } else if (selectedItem.actual_total > 0) {
      // Jika tidak ada material, ambil dari item itu sendiri
      details.push({
        product: selectedItem.product,
        unit_price: selectedItem.actual_unit_price || 0,
        qty: selectedItem.actual_qty || 0,
        unit: selectedItem.unit || "",
        harga: selectedItem.actual_total || 0,
      });
    }
  }

  // 2. Buat tabel HTML untuk modal
  let htmlContent = "";
  if (details.length === 0) {
    htmlContent =
      '<p class="text-center text-gray-500">Tidak ada data detail untuk item ini.</p>';
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
      htmlContent += `
        <tr class="border-b">
          <td class="px-3 py-2">${item.product}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.unit_price)}</td>
          <td class="px-3 py-2 text-right">${item.qty}</td>
          <td class="px-3 py-2 text-right">${formatNumber(item.harga)}</td>
        </tr>
      `;
      total += item.harga;
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
  // NOTE: 'pesanan_id' mungkin null, karena data project tidak selalu punya pesanan_id
  // Kita ganti pakai project_id
  const projectId = window.detail_id;
  if (!projectId) {
    Swal.fire("Gagal", "Project ID tidak ditemukan", "error");
    return;
  }

  try {
    // Endpoint ini sepertinya salah, harusnya endpoint print project, bukan invoice
    // Saya akan pakai endpoint 'detail/sales_invoice' sesuai kodemu
    // Tapi saya akan ganti `pesanan_id` dengan `projectDetailData.pesanan_id`

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
      // ... (sisa fungsi print... tidak berubah)
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
