pagemodule = "Project";
subpagemodule = "Real Calculation";
renderHeader();

var projectId = window.detail_id;
var dataItemDropdown = [];
var realCalculationData = [];
var currentUpdateCostId = null;

(async function initActual() {
  // Fetch project detail dulu
  const res = await fetch(`${baseUrl}/detail/project/${projectId}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const json = await res.json();

  // Set nama project
  const detail = json.detail || {};
  const projectText = detail.project_name
    ? `${detail.project_name} (${detail.project_number || "-"})`
    : window.detail_desc || "Project";

  document.getElementById("projectNameDisplay").textContent = projectText;
  if (json.success) {
    dataItemDropdown = json.detail.items;
    populatePekerjaanDropdown();
  }

  loadActualCostingTable(1);

  document
    .getElementById("realCalcForm")
    .addEventListener("submit", handleActualCostSubmit);
  document
    .getElementById("calcKorelasiPekerjaan")
    .addEventListener("change", handlePekerjaanChange);
  document
    .getElementById("cancelUpdateBtn")
    .addEventListener("click", resetCalcForm);

  document.querySelectorAll(".formatNumber").forEach((i) => {
    i.addEventListener("input", (e) => {
      e.target.value = finance(e.target.value.replace(/\D/g, ""));
      updateFormTotal();
    });
  });
  document.getElementById("calcQty").addEventListener("input", updateFormTotal);

  document.getElementById("realCalcBody").addEventListener("click", (e) => {
    if (e.target.closest(".edit-cost-btn")) {
      const id = e.target.closest(".edit-cost-btn").dataset.costId;
      populateFormForUpdate(id);
    }
    if (e.target.closest(".delete-cost-btn")) {
      const id = e.target.closest(".delete-cost-btn").dataset.costId;
      handleDeleteActualCost(id);
    }
  });
})();

// --- FUNCTIONS ---

function populatePekerjaanDropdown() {
  const sel = document.getElementById("calcKorelasiPekerjaan");
  sel.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>';
  dataItemDropdown.forEach((i) => {
    const opt = document.createElement("option");
    opt.value = i.project_item_id;
    opt.textContent = i.product;
    sel.appendChild(opt);
  });
}

function handlePekerjaanChange() {
  const val = document.getElementById("calcKorelasiPekerjaan").value;
  const matSel = document.getElementById("calcKorelasiMaterial");
  matSel.innerHTML = '<option value="">-- Pilih Material --</option>';
  matSel.disabled = true;
  matSel.classList.add("bg-gray-100");

  if (!val) return;
  const item = dataItemDropdown.find((i) => i.project_item_id == val);
  if (item && item.materials?.length) {
    matSel.disabled = false;
    matSel.classList.remove("bg-gray-100");
    item.materials.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.name;
      opt.dataset.matId = m.project_materials_id;
      opt.textContent = m.name;
      matSel.appendChild(opt);
    });
  }
}

async function loadActualCostingTable(page) {
  const tbody = document.getElementById("realCalcBody");
  tbody.innerHTML =
    '<tr><td colspan="9" class="text-center py-4">Memuat...</td></tr>'; // colspan disesuaikan
  try {
    const res = await fetch(
      `${baseUrl}/table/actual_costing/${projectId}/${page}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const json = await res.json();
    realCalculationData = json.tableData || [];
    tbody.innerHTML = "";
    if (realCalculationData.length) {
      realCalculationData.forEach((d) => {
        // Menampilkan data No Tagihan & Vendor di tabel
        tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="px-3 py-2 font-medium text-gray-700">${
                          d.product
                        }</td>
                        <td class="px-3 py-2">${d.no_tagihan || "-"}</td>
                        <td class="px-3 py-2">${d.nama_vendor || "-"}</td>
                        <td class="px-3 py-2">${d.cost_name}
                             <div class="text-xs text-gray-400">${
                               d.notes || ""
                             }</div>
                        </td>
                        <td class="px-3 py-2 text-right whitespace-nowrap">${finance(
                          d.unit_price
                        )}</td>
                        <td class="px-3 py-2 text-right whitespace-nowrap">${
                          d.qty
                        } ${d.unit}</td>
                        <td class="px-3 py-2 text-right font-semibold whitespace-nowrap">${finance(
                          d.total
                        )}</td>
                        <td class="px-3 py-2 text-center whitespace-nowrap">
                            <button class="edit-cost-btn text-blue-600 mr-2 hover:text-blue-800" data-cost-id="${
                              d.cost_id
                            }" type="button">✏️</button>
                            <button class="delete-cost-btn text-red-600 hover:text-red-800" data-cost-id="${
                              d.cost_id
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
  }
}

async function handleActualCostSubmit(e) {
  e.preventDefault();

  // Logika cek Material ID
  const matSel = document.getElementById("calcKorelasiMaterial");
  let matId = "0";
  if (!matSel.disabled && matSel.selectedIndex > 0) {
    matId = matSel.options[matSel.selectedIndex].dataset.matId || "0";
  }

  // Persiapan Payload
  const payload = {
    project_id: projectId.toString(),
    project_item_id: document.getElementById("calcKorelasiPekerjaan").value,
    project_materials_id: matId,

    // --- Field Baru ---
    vendor_id: 0, // Default
    contact_id: 0, // Default
    no_po: document.getElementById("calcNoTagihan").value || "", // Mapping dari input No Tagihan

    // --- Field Utama ---
    name: document.getElementById("calcProduct").value,
    unit: document.getElementById("calcUnit").value,
    qty: parseRupiah(document.getElementById("calcQty").value).toString(),
    unit_price: parseRupiah(
      document.getElementById("calcUnitPrice").value
    ).toString(),
    total: parseRupiah(document.getElementById("calcHarga").value).toString(),
    notes: document.getElementById("calcNotes").value,
  };

  // 🔍 DEBUGGING: Tampilkan data di Console
  console.group("🚀 DEBUG: Submit Actual Cost");
  console.log(
    "Status:",
    currentUpdateCostId ? "UPDATE (PUT)" : "CREATE (POST)"
  );
  console.log(
    "Target URL:",
    currentUpdateCostId
      ? `${baseUrl}/update/actual_costing/${currentUpdateCostId}`
      : `${baseUrl}/add/actual_costing`
  );
  console.log("Payload Object:", payload);
  console.log("Payload JSON String:", JSON.stringify(payload, null, 2));
  console.groupEnd();

  // Validasi Sederhana
  if (!payload.project_item_id || !payload.name || !payload.qty) {
    return Swal.fire("Gagal", "Lengkapi data wajib (*)", "warning");
  }

  const url = currentUpdateCostId
    ? `${baseUrl}/update/actual_costing/${currentUpdateCostId}`
    : `${baseUrl}/add/actual_costing`;
  const method = currentUpdateCostId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Response Status:", res.status); // Debug Response Status

    const json = await res.json();
    console.log("Response Body:", json); // Debug Response Body

    if (res.ok && json.data?.success !== false) {
      Swal.fire("Berhasil", "Data tersimpan", "success");
      resetCalcForm();
      loadActualCostingTable(1);
    } else {
      throw new Error(json.message || "Gagal menyimpan data");
    }
  } catch (e) {
    console.error("Error Fetch:", e);
    Swal.fire("Error", e.message, "error");
  }
}

async function handleActualCostSubmit(e) {
  e.preventDefault();

  // Logika cek Material ID
  const matSel = document.getElementById("calcKorelasiMaterial");
  let matId = "0";
  if (!matSel.disabled && matSel.selectedIndex > 0) {
    matId = matSel.options[matSel.selectedIndex].dataset.matId || "0";
  }

  // Ambil value dari input
  const valNoTagihan = document.getElementById("calcNoTagihan").value || "";
  const valNamaVendor = document.getElementById("calcNamaVendor").value || "";
  const valNamaPic = document.getElementById("calcNamaPic").value || "";

  // Persiapan Payload
  const payload = {
    project_id: projectId.toString(),
    project_item_id: document.getElementById("calcKorelasiPekerjaan").value,
    project_materials_id: matId,

    // --- Field Tambahan (Tagihan, Vendor, PIC) ---
    vendor_id: 0, // Default 0
    contact_id: 0, // Default 0
    no_po: valNoTagihan, // Mapping: No Tagihan -> no_po
    nama_vendor: valNamaVendor, // Mapping: Nama Vendor -> nama_vendor
    nama_pic: valNamaPic, // Mapping: Nama PIC -> nama_pic (Ini yang ditambahkan)
    // ---------------------------------------------

    name: document.getElementById("calcProduct").value,
    unit: document.getElementById("calcUnit").value,
    qty: parseRupiah(document.getElementById("calcQty").value).toString(),
    unit_price: parseRupiah(
      document.getElementById("calcUnitPrice").value
    ).toString(),
    total: parseRupiah(document.getElementById("calcHarga").value).toString(),
    notes: document.getElementById("calcNotes").value,
  };

  // 🔍 DEBUGGING: Cek data di Console
  console.group("🚀 DEBUG: Submit Actual Cost");
  console.log("Data Vendor/PIC:", {
    Tagihan: valNoTagihan,
    Vendor: valNamaVendor,
    PIC: valNamaPic,
  });
  console.log("Full Payload:", payload);
  console.groupEnd();

  // Validasi Sederhana
  if (!payload.project_item_id || !payload.name || !payload.qty) {
    return Swal.fire("Gagal", "Lengkapi data wajib (*)", "warning");
  }

  const url = currentUpdateCostId
    ? `${baseUrl}/update/actual_costing/${currentUpdateCostId}`
    : `${baseUrl}/add/actual_costing`;
  const method = currentUpdateCostId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (res.ok && json.data?.success !== false) {
      Swal.fire("Berhasil", "Data tersimpan", "success");
      resetCalcForm();
      loadActualCostingTable(1);
    } else {
      throw new Error(json.message || "Gagal menyimpan data");
    }
  } catch (e) {
    console.error("Error Fetch:", e);
    Swal.fire("Error", e.message, "error");
  }
}

async function handleDeleteActualCost(id) {
  const c = await Swal.fire({
    title: "Hapus?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya",
  });
  if (!c.isConfirmed) return;
  try {
    await fetch(`${baseUrl}/delete/actual_costing/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    loadActualCostingTable(1);
    Swal.fire("Terhapus", "", "success");
  } catch (e) {
    Swal.fire("Error", "Gagal hapus", "error");
  }
}

function populateFormForUpdate(id) {
  const item = realCalculationData.find((d) => d.cost_id == id);
  if (!item) return;
  currentUpdateCostId = item.cost_id;

  document.getElementById("calcProduct").value = item.cost_name; // Mapping 'cost_name' ke input Product
  document.getElementById("calcKorelasiPekerjaan").value = item.project_item_id;
  handlePekerjaanChange();

  // Isi field No Tagihan (mapping dari no_po)
  document.getElementById("calcNoTagihan").value = item.no_po || "";

  // Note: Karena payload request minta vendor_id=0 dan contact_id=0,
  // input text Vendor & PIC di HTML mungkin hanya bersifat visual/catatan sementara
  // atau perlu disimpan di notes jika API belum support string nama vendor.
  // Untuk sekarang kita biarkan kosong atau isi jika ada datanya di response list.
  document.getElementById("calcNamaVendor").value = item.nama_vendor || "";
  document.getElementById("calcNamaPic").value = item.nama_pic || "";

  const matSel = document.getElementById("calcKorelasiMaterial");
  // Coba auto-select material berdasarkan nama
  const opt = Array.from(matSel.options).find(
    (o) => o.text.trim() === item.cost_name.trim()
  );
  if (opt) matSel.value = opt.value;

  document.getElementById("calcNotes").value = item.notes || "";
  document.getElementById("calcQty").value = item.qty;
  document.getElementById("calcUnit").value = item.unit;
  document.getElementById("calcUnitPrice").value = finance(item.unit_price);
  updateFormTotal();

  document.getElementById("submitCalcFormBtn").textContent = "Update";
  document
    .getElementById("submitCalcFormBtn")
    .classList.replace("bg-blue-600", "bg-green-600");
  document.getElementById("cancelUpdateBtn").classList.remove("hidden");
}

function resetCalcForm() {
  document.getElementById("realCalcForm").reset();
  currentUpdateCostId = null;
  document.getElementById("calcKorelasiMaterial").disabled = true;
  document.getElementById("calcKorelasiMaterial").classList.add("bg-gray-100");
  document.getElementById("submitCalcFormBtn").textContent = "+ Tambah";
  document
    .getElementById("submitCalcFormBtn")
    .classList.replace("bg-green-600", "bg-blue-600");
  document.getElementById("cancelUpdateBtn").classList.add("hidden");
}

function updateFormTotal() {
  const p = parseRupiah(document.getElementById("calcUnitPrice").value);
  const q = parseFloat(document.getElementById("calcQty").value) || 0;
  document.getElementById("calcHarga").value = finance(p * q);
}
