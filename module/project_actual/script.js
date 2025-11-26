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
                        <td class="px-3 py-2">${d.no_po || "-"}</td>
                        <td class="px-3 py-2">${d.vendor || "-"}
                        <div class="text-xs text-gray-400">${
                          d.vendor_pic || ""
                        }</div>
                        </td>
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

  // 1. Ambil value ID dari Hidden Input (Pastikan logic pemilihan vendor mengisi value ini)
  const valVendorId = document.getElementById("calcVendorId").value || "0";
  const valContactId = document.getElementById("calcContactId").value || "0";

  // Logika cek Material ID
  const matSel = document.getElementById("calcKorelasiMaterial");
  let matId = "0";
  if (!matSel.disabled && matSel.selectedIndex > 0) {
    matId = matSel.options[matSel.selectedIndex].dataset.matId || "0";
  }

  // Persiapan Payload
  const payload = {
    project_id: projectId.toString(), // Pastikan variable global projectId ada
    project_item_id: document.getElementById("calcKorelasiPekerjaan").value,
    project_materials_id: matId,

    // --- UPDATE DI SINI (Menggunakan ID) ---
    vendor_id: parseInt(valVendorId), // Mengirim ID Vendor (Int)
    contact_id: parseInt(valContactId), // Mengirim ID PIC/Contact (Int)
    no_po: document.getElementById("calcNoTagihan").value || "",
    // nama_vendor & nama_pic bisa dihapus jika backend hanya butuh ID,
    // atau tetap dikirim sebagai pelengkap (opsional).
    // ---------------------------------------

    name: document.getElementById("calcProduct").value,
    unit: document.getElementById("calcUnit").value,
    qty: parseRupiah(document.getElementById("calcQty").value).toString(),
    unit_price: parseRupiah(
      document.getElementById("calcUnitPrice").value
    ).toString(),
    total: parseRupiah(document.getElementById("calcHarga").value).toString(),
    notes: document.getElementById("calcNotes").value,
  };

  // 🔍 DEBUGGING
  console.group("🚀 DEBUG: Submit Actual Cost");
  console.log("IDs Selected:", {
    VendorID: payload.vendor_id,
    ContactID: payload.contact_id,
  });
  console.log("Full Payload:", payload);
  console.groupEnd();

  // Validasi
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
      // loadActualCostingTable(1); // Uncomment jika ada fungsi ini
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
  // 1. Cari data berdasarkan ID
  const item = realCalculationData.find((d) => d.cost_id == id);
  if (!item) return;

  currentUpdateCostId = item.cost_id;

  // --- MAPPING DATA UTAMA ---
  document.getElementById("calcProduct").value = item.cost_name;
  document.getElementById("calcKorelasiPekerjaan").value = item.project_item_id;
  handlePekerjaanChange(); // Trigger agar dropdown material aktif (jika ada logic disana)

  document.getElementById("calcNoTagihan").value = item.no_po || "";

  // --- PERBAIKAN VENDOR & PIC DISINI ---

  // A. Vendor Name & ID
  // JSON kamu pakai key "vendor", bukan "nama_vendor"
  document.getElementById("calcNamaVendor").value =
    item.vendor || item.vendor_name || "";

  const vId = item.vendor_id || 0;
  document.getElementById("calcVendorId").value = vId;

  // B. Contact (PIC) ID
  // Ambil contact_id dari JSON
  const cId = item.contact_id || 0;
  document.getElementById("calcContactId").value = cId; // Isi hidden input PIC

  // C. Load List PIC & Auto Select
  if (vId != 0) {
    // Panggil fungsi load dengan parameter (VendorID, ContactID)
    // Kita pakai ContactID (cId) agar dropdown otomatis memilih nama yang sesuai ID tersebut
    loadVendorPICList(vId, cId);
  } else {
    resetPICDropdown();
  }
  // -------------------------------------

  // Logic Material (mencoba mencocokkan nama cost_name dengan option material)
  const matSel = document.getElementById("calcKorelasiMaterial");
  // Pastikan matSel tidak disabled agar bisa dibaca options-nya
  if (matSel) {
    const opt = Array.from(matSel.options).find(
      (o) => o.text.trim() === item.cost_name.trim()
    );
    if (opt) matSel.value = opt.value;
  }

  // Isi sisa form
  document.getElementById("calcNotes").value = item.notes || "";
  document.getElementById("calcQty").value = item.qty;
  document.getElementById("calcUnit").value = item.unit;
  document.getElementById("calcUnitPrice").value = finance(item.unit_price);
  updateFormTotal();

  // Update UI Tombol
  const btn = document.getElementById("submitCalcFormBtn");
  btn.textContent = "Update";
  btn.classList.remove("bg-blue-600", "hover:bg-blue-700");
  btn.classList.add("bg-green-600", "hover:bg-green-700");

  document.getElementById("cancelUpdateBtn").classList.remove("hidden");
}

function resetCalcForm() {
  document.getElementById("realCalcForm").reset();
  currentUpdateCostId = null;
  document.getElementById("calcVendorId").value = "0";
  resetPICDropdown();
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

/**
 * Mencari Vendor & mengisi dropdown PIC saat dipilih.
 */
function filterVendorSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();
  const suggestionBox = inputElement.nextElementSibling; // elemen <ul>

  if (!suggestionBox || suggestionBox.tagName !== "UL") return;

  clearTimeout(vendorDebounceTimer);

  // Jika input kosong -> Reset Vendor ID & PIC
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    document.getElementById("calcVendorId").value = "0";
    document.getElementById("calcContactId").value = "0"; // Reset ID PIC juga
    resetPICDropdown();
    return;
  }

  vendorDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      // Pastikan endpoint search ini benar
      const res = await fetch(
        `${baseUrl}/table/vendor/${owner_id}/1?search=${inputVal}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } }
      );
      const result = await res.json();
      suggestionBox.innerHTML = "";

      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          const vendorName = item.nama || item.vendor_name || "N/A";
          // Pastikan mengambil ID yang benar dari response API
          const vendorId = item.vendor_id || item.id || 0;

          const li = document.createElement("li");
          li.innerHTML = `<div class="font-medium">${vendorName}</div>`;
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";

          // SAAT VENDOR DIKLIK:
          li.addEventListener("click", () => {
            inputElement.value = vendorName; // Tampilkan Nama di input
            suggestionBox.classList.add("hidden"); // Tutup saran

            // Simpan ID Vendor ke Hidden Input
            document.getElementById("calcVendorId").value = vendorId;

            // Reset ID Contact karena Vendor baru dipilih
            document.getElementById("calcContactId").value = "0";

            // Load PIC Vendor berdasarkan ID Vendor
            loadVendorPICList(vendorId);
          });
          suggestionBox.appendChild(li);
        });
      } else {
        suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Tidak ditemukan</li>`;
      }
    } catch (err) {
      console.error("Gagal fetch vendor:", err);
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Gagal memuat data</li>`;
    }
  }, 300);
}
/**
 * Mengambil daftar PIC dari endpoint /list/vendor_contact/{vendor_id}
 */
/**
 * Mengambil daftar PIC, lalu mengisi dropdown.
 * Param selectedContactId (optional) digunakan saat mode Edit agar otomatis terpilih.
 */
async function loadVendorPICList(vendorId, selectedContactId = 0) {
  const picSelect = document.getElementById("calcNamaPic");

  // Reset & Loading State
  picSelect.innerHTML = '<option value="">Memuat PIC...</option>';
  picSelect.disabled = true;
  picSelect.classList.add("bg-gray-100");

  if (!vendorId || vendorId == "0") return;

  try {
    const res = await fetch(`${baseUrl}/list/vendor_contact/${vendorId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await res.json();

    picSelect.innerHTML = '<option value="">-- Pilih PIC --</option>';

    if (result.listData && result.listData.length > 0) {
      result.listData.forEach((contact) => {
        const option = document.createElement("option");

        // --- PERBAIKAN DISINI ---
        // Value diisi ID (contact_id), Teks diisi Nama
        const cId = contact.contact_id || contact.id;
        option.value = cId;
        option.textContent = contact.name;

        // Auto-select jika ID cocok (untuk fitur Edit nanti)
        // Kita bandingkan menggunakan loose equality (==) untuk handle string vs int
        if (selectedContactId && cId == selectedContactId) {
          option.selected = true;
          // Jangan lupa update hidden input jika auto-selected
          document.getElementById("calcContactId").value = cId;
        }

        picSelect.appendChild(option);
      });

      picSelect.disabled = false;
      picSelect.classList.remove("bg-gray-100");
    } else {
      picSelect.innerHTML = '<option value="">Tidak ada kontak</option>';
    }
  } catch (err) {
    console.error("Gagal load PIC vendor:", err);
    picSelect.innerHTML = '<option value="">Gagal memuat</option>';
  }
}

function resetPICDropdown() {
  const picSelect = document.getElementById("calcNamaPic");
  picSelect.innerHTML = '<option value="">-- Pilih Vendor Dulu --</option>';
  picSelect.disabled = true;
  picSelect.classList.add("bg-gray-100");
  document.getElementById("calcContactId").value = "0";
}

function resetPICDropdown() {
  const picSelect = document.getElementById("calcNamaPic");
  picSelect.innerHTML = '<option value="">-- Pilih Vendor Dulu --</option>';
  picSelect.disabled = true;
  picSelect.classList.add("bg-gray-100");
}
// Tambahkan kode ini di bagian paling bawah script, atau di dalam document ready
document.getElementById("calcNamaPic").addEventListener("change", function () {
  // 1. Ambil ID dari value option yang dipilih
  const selectedId = this.value;

  // 2. Masukkan ID tersebut ke input hidden yang akan dikirim ke API
  document.getElementById("calcContactId").value = selectedId;

  // Debugging: Cek di console saat ganti PIC
  console.log("PIC dipilih, ID:", selectedId);
});
