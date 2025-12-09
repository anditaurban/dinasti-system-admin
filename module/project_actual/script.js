// --- SETUP HEADER ---
pagemodule = "Project";
subpagemodule = "Real Calculation";
renderHeader();

var projectId = window.detail_id;
var dataItemDropdown = [];
var realCalculationData = [];
var currentUpdateCostId = null;

// --- 1. FUNGSI UTAMA: FETCH & RENDER ---
// --- 1. FUNGSI UTAMA: FETCH & RENDER (REVISI HANDLING ID 0) ---
async function fetchAndRenderActual(isRefresh = false) {
  if (!isRefresh) {
    Swal.fire({
      title: "Memuat Data...",
      html: "Mohon tunggu, sedang mengambil data terbaru...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  try {
    const [resDetail, resTable] = await Promise.all([
      fetch(`${baseUrl}/detail/project/${projectId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      fetch(`${baseUrl}/table/actual_costing/${projectId}/1`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      new Promise((resolve) => setTimeout(resolve, isRefresh ? 0 : 3000)),
    ]);

    const jsonDetail = await resDetail.json();
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

    // Status Lock: Hanya jika Direct Project & Sudah jadi SO (bukan 0)
    const isLocked = hasPesanan && isDirectSales;

    const projectText = detail.project_name
      ? `${detail.project_name} (${detail.project_number || "-"})`
      : window.detail_desc || "Project";

    document.getElementById("projectNameDisplay").textContent = projectText;

    // --- RENDER FORM STATE (LOCK/UNLOCK) ---
    handleFormLockState(isLocked);

    if (jsonDetail.success) {
      dataItemDropdown = jsonDetail.detail.items || [];
      populatePekerjaanDropdown();
    }

    realCalculationData = jsonTable.tableData || [];
    renderTableHtml(realCalculationData, isLocked);

    if (!isRefresh) Swal.close();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data", "error");
  }
}

// --- FUNGSI MENGATUR FORM LOCK ---
function handleFormLockState(isLocked) {
  const form = document.getElementById("realCalcForm");
  const submitBtn = document.getElementById("submitCalcFormBtn");
  const inputs = form.querySelectorAll("input, select, textarea");

  if (isLocked) {
    // Matikan semua input
    inputs.forEach((input) => {
      input.disabled = true;
      input.classList.add("bg-gray-100", "cursor-not-allowed");
    });

    // Ubah Tombol Submit
    submitBtn.disabled = true;
    submitBtn.innerHTML = "🔒 Locked (Direct Project)";
    submitBtn.classList.remove(
      "bg-blue-600",
      "hover:bg-blue-700",
      "bg-green-600",
      "hover:bg-green-700"
    );
    submitBtn.classList.add("bg-gray-400", "cursor-not-allowed");

    // Sembunyikan tombol cancel jika ada
    document.getElementById("cancelUpdateBtn").classList.add("hidden");
  } else {
    // Normal State (Unlock)
    // Note: Kita tidak me-remove disabled semua di sini secara paksa
    // karena beberapa input (seperti PIC) tergantung dropdown lain.
    // Tapi kita kembalikan tombol submit ke normal.

    // Hanya enable input dasar, logic dropdown tetap jalan
    inputs.forEach((input) => {
      // Jangan enable material/pic pic dulu (biar logic dropdown yg handle)
      if (input.id !== "calcKorelasiMaterial" && input.id !== "calcNamaPic") {
        input.disabled = false;
        input.classList.remove("bg-gray-100", "cursor-not-allowed");
      }
    });

    if (!currentUpdateCostId) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "+ Tambah";
      submitBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
      submitBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
    } else {
      // Jika sedang mode edit (dan tidak locked), tombol biarkan dihandle populateFormForUpdate
    }
  }
}

// Fungsi Render HTML Tabel (Updated with Lock Logic)
function renderTableHtml(data, isLocked) {
  const tbody = document.getElementById("realCalcBody");
  tbody.innerHTML = "";

  if (data.length) {
    data.forEach((d) => {
      // Tentukan isi kolom aksi berdasarkan Lock
      let actionButtons = "";
      if (isLocked) {
        actionButtons = `<span class="text-xs text-gray-400 italic font-semibold">Locked</span>`;
      } else {
        actionButtons = `
            <button class="edit-cost-btn text-blue-600 mr-2 hover:text-blue-800" data-cost-id="${d.cost_id}" type="button">✏️</button>
            <button class="delete-cost-btn text-red-600 hover:text-red-800" data-cost-id="${d.cost_id}" type="button">🗑️</button>
          `;
      }

      tbody.innerHTML += `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-3 py-2 font-medium text-gray-700">${d.product}</td>
            <td class="px-3 py-2">${d.no_po || "-"}</td>
            <td class="px-3 py-2">${d.vendor || "-"}
                <div class="text-xs text-gray-400">${d.vendor_pic || ""}</div>
            </td>
            <td class="px-3 py-2">${d.cost_name}
                <div class="text-xs text-gray-400">${d.notes || ""}</div>
            </td>
            <td class="px-3 py-2 text-right whitespace-nowrap">${finance(
              d.unit_price
            )}</td>
            <td class="px-3 py-2 text-right whitespace-nowrap">${d.qty} ${
        d.unit
      }</td>
            <td class="px-3 py-2 text-right font-semibold whitespace-nowrap">${finance(
              d.total
            )}</td>
            <td class="px-3 py-2 font-medium text-gray-700">${d.status}</td>
            <td class="px-3 py-2 text-center whitespace-nowrap">
                ${actionButtons}
            </td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="10" class="text-center py-4 text-gray-500">Belum ada data</td></tr>';
  }
}

// --- 2. HANDLE SUBMIT (CREATE / UPDATE) ---
async function handleActualCostSubmit(e) {
  e.preventDefault();

  // Safety Check: Jangan submit jika tombol disabled (Locked)
  const btn = document.getElementById("submitCalcFormBtn");
  if (btn.disabled) return;

  const valVendorId = document.getElementById("calcVendorId").value || "0";
  const valContactId = document.getElementById("calcContactId").value || "0";

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
    vendor_id: parseInt(valVendorId),
    contact_id: parseInt(valContactId),
    no_po: document.getElementById("calcNoTagihan").value || "",
    po_date: document.getElementById("calcPoDate").value || "",
    name: document.getElementById("calcProduct").value,
    unit: document.getElementById("calcUnit").value,
    qty: parseRupiah(document.getElementById("calcQty").value).toString(),
    unit_price: parseRupiah(
      document.getElementById("calcUnitPrice").value
    ).toString(),
    total: parseRupiah(document.getElementById("calcHarga").value).toString(),
    notes: document.getElementById("calcNotes").value,
  };

  if (!payload.project_item_id || !payload.name || !payload.qty) {
    return Swal.fire("Gagal", "Lengkapi data wajib (*)", "warning");
  }

  const url = currentUpdateCostId
    ? `${baseUrl}/update/actual_costing/${currentUpdateCostId}`
    : `${baseUrl}/add/actual_costing`;
  const method = currentUpdateCostId ? "PUT" : "POST";

  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

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
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data berhasil disimpan. Merefresh tabel...",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      resetCalcForm();
      fetchAndRenderActual(true);
    } else {
      throw new Error(json.message || "Gagal menyimpan data");
    }
  } catch (e) {
    console.error("Error Fetch:", e);
    Swal.fire("Error", e.message, "error");
  }
}

// --- 3. HANDLE DELETE ---
async function handleDeleteActualCost(id) {
  const c = await Swal.fire({
    title: "Hapus?",
    text: "Data yang dihapus tidak bisa dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
  });

  if (!c.isConfirmed) return;

  Swal.fire({ title: "Menghapus...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${baseUrl}/delete/actual_costing/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Terhapus",
        text: "Data telah dihapus. Merefresh tabel...",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      fetchAndRenderActual(true);
    } else {
      throw new Error("Gagal menghapus data");
    }
  } catch (e) {
    Swal.fire("Error", "Gagal hapus data", "error");
  }
}

// --- 4. HELPER FUNCTIONS ---

function populatePekerjaanDropdown() {
  const sel = document.getElementById("calcKorelasiPekerjaan");
  const oldVal = sel.value;

  sel.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>';
  dataItemDropdown.forEach((i) => {
    const opt = document.createElement("option");
    opt.value = i.project_item_id;
    opt.textContent = i.product;
    sel.appendChild(opt);
  });

  if (oldVal) sel.value = oldVal;
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

function populateFormForUpdate(id) {
  const item = realCalculationData.find((d) => d.cost_id == id);
  if (!item) return;

  currentUpdateCostId = item.cost_id;

  // Format Tanggal
  let rawDate = item.po_date || "";
  let finalDate = "";
  if (rawDate && rawDate.includes("/")) {
    const parts = rawDate.split("/");
    if (parts.length === 3) finalDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  if (rawDate === "00/00/0000" || finalDate === "0000-00-00") finalDate = "";

  document.getElementById("calcProduct").value = item.cost_name;
  document.getElementById("calcKorelasiPekerjaan").value = item.project_item_id;
  handlePekerjaanChange();

  document.getElementById("calcNoTagihan").value = item.no_po || "";
  document.getElementById("calcPoDate").value = finalDate;

  document.getElementById("calcNamaVendor").value =
    item.vendor || item.vendor_name || "";

  const vId = item.vendor_id || 0;
  document.getElementById("calcVendorId").value = vId;

  const cId = item.contact_id || 0;
  document.getElementById("calcContactId").value = cId;

  if (vId != 0) {
    loadVendorPICList(vId, cId);
  } else {
    resetPICDropdown();
  }

  setTimeout(() => {
    const matSel = document.getElementById("calcKorelasiMaterial");
    if (matSel && !matSel.disabled) {
      const opt = Array.from(matSel.options).find(
        (o) => o.text.trim() === item.cost_name.trim()
      );
      if (opt) matSel.value = opt.value;
    }
  }, 100);

  document.getElementById("calcNotes").value = item.notes || "";
  document.getElementById("calcQty").value = item.qty;
  document.getElementById("calcUnit").value = item.unit;
  document.getElementById("calcUnitPrice").value = finance(item.unit_price);
  updateFormTotal();

  const btn = document.getElementById("submitCalcFormBtn");
  btn.textContent = "Update";
  btn.classList.remove("bg-blue-600", "hover:bg-blue-700");
  btn.classList.add("bg-green-600", "hover:bg-green-700");

  document.getElementById("cancelUpdateBtn").classList.remove("hidden");

  document
    .getElementById("realCalcForm")
    .scrollIntoView({ behavior: "smooth" });
}

function resetCalcForm() {
  document.getElementById("realCalcForm").reset();
  currentUpdateCostId = null;
  document.getElementById("calcVendorId").value = "0";
  resetPICDropdown();
  document.getElementById("calcKorelasiMaterial").disabled = true;
  document.getElementById("calcKorelasiMaterial").classList.add("bg-gray-100");

  const btn = document.getElementById("submitCalcFormBtn");
  btn.textContent = "+ Tambah";
  btn.classList.replace("bg-green-600", "bg-blue-600");
  btn.classList.remove("hover:bg-green-700");
  btn.classList.add("hover:bg-blue-700");

  document.getElementById("cancelUpdateBtn").classList.add("hidden");

  // Pastikan form di-enable kembali jika reset (kecuali jika locked, logic fetch akan override)
  const form = document.getElementById("realCalcForm");
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((i) => {
    if (i.id !== "calcKorelasiMaterial" && i.id !== "calcNamaPic") {
      i.disabled = false;
      i.classList.remove("bg-gray-100", "cursor-not-allowed");
    }
  });
  btn.disabled = false;
  btn.classList.remove("bg-gray-400", "cursor-not-allowed");
}

function updateFormTotal() {
  const p = parseRupiah(document.getElementById("calcUnitPrice").value);
  const q = parseFloat(document.getElementById("calcQty").value) || 0;
  document.getElementById("calcHarga").value = finance(p * q);
}

// --- 5. SEARCH VENDOR & UNIT LOGIC ---

function filterVendorSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();
  const suggestionBox = inputElement.nextElementSibling;

  if (!suggestionBox || suggestionBox.tagName !== "UL") return;

  clearTimeout(vendorDebounceTimer);

  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    document.getElementById("calcVendorId").value = "0";
    document.getElementById("calcContactId").value = "0";
    resetPICDropdown();
    return;
  }

  vendorDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      const res = await fetch(
        `${baseUrl}/table/vendor/${owner_id}/1?search=${inputVal}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } }
      );
      const result = await res.json();
      suggestionBox.innerHTML = "";

      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          const vendorName = item.nama || item.vendor_name || "N/A";
          const vendorId = item.vendor_id || item.id || 0;

          const li = document.createElement("li");
          li.innerHTML = `<div class="font-medium">${vendorName}</div>`;
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";

          li.addEventListener("click", () => {
            inputElement.value = vendorName;
            suggestionBox.classList.add("hidden");
            document.getElementById("calcVendorId").value = vendorId;
            document.getElementById("calcContactId").value = "0";
            loadVendorPICList(vendorId);
          });
          suggestionBox.appendChild(li);
        });
      } else {
        suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Tidak ditemukan</li>`;
      }
    } catch (err) {
      console.error(err);
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Gagal memuat</li>`;
    }
  }, 300);
}

async function loadVendorPICList(vendorId, selectedContactId = 0) {
  const picSelect = document.getElementById("calcNamaPic");
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
        const cId = contact.contact_id || contact.id;
        option.value = cId;
        option.textContent = contact.name;
        if (selectedContactId && cId == selectedContactId) {
          option.selected = true;
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

function filterUnitSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();
  const suggestionBox = inputElement.nextElementSibling;
  if (!suggestionBox) return;

  clearTimeout(unitDebounceTimer);
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    return;
  }

  unitDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");
    try {
      const res = await fetch(
        `${baseUrl}/table/unit/${owner_id}/1?search=${inputVal}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } }
      );
      const result = await res.json();
      suggestionBox.innerHTML = "";
      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          const unitName = item.unit || "N/A";
          const li = document.createElement("li");
          li.textContent = unitName;
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";
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
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Error</li>`;
    }
  }, 300);
}

// --- 6. EVENT LISTENERS ---

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

document.getElementById("calcNamaPic").addEventListener("change", function () {
  const selectedId = this.value;
  document.getElementById("calcContactId").value = selectedId;
});

// --- 7. START APPLICATION ---
fetchAndRenderActual();
