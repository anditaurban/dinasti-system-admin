// ================================================================
// GLOBAL VARIABLES
// ================================================================
pagemodule = "Project";
subpagemodule = "Real Calculation";
setDataType("sales");
var projectId = window.detail_id; // Dari parameter URL/Global
// Asumsi variabel user global tersedia

var dataItemDropdown = []; // Menyimpan data list/item_material
var rowCounter = 0;
var isSubmitting = false; // "Rem tangan" untuk mencegah double submit
var currentUpdateCostId = null;

// Init
renderHeader();
fetchInitialData();

// ================================================================
// 1. INITIAL FETCH (GENERATE PO & MATERIAL LIST & HISTORY)
// ================================================================

async function fetchInitialData() {
  Swal.fire({ title: "Memuat Data...", didOpen: () => Swal.showLoading() });

  try {
    if (!projectId) throw new Error("ID Project tidak ditemukan.");

    // 1. Parallel Fetch: Detail Project, List Material, Table History
    const [resDetail, resMaterial, resHistory] = await Promise.all([
      fetch(`${baseUrl}/detail/project/${projectId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      fetch(`${baseUrl}/list/item_material/${projectId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
      fetch(`${baseUrl}/table/actual_costing/${projectId}/1`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }),
    ]);

    const jsonDetail = await resDetail.json();
    const jsonMaterial = await resMaterial.json();
    const jsonHistory = await resHistory.json();

    // 2. Render Header Nama Project
    const detailData = jsonDetail.detail || jsonDetail.data || {};
    const pName = detailData.project_name || "Project Tanpa Nama";
    const pNum = detailData.project_number || "-";
    const pType = detailData.project_type || "-";
    document.getElementById(
      "projectNameDisplay"
    ).textContent = `${pName} (${pNum}) - ${pType}`;

    // 3. Simpan Data Item & Material untuk Dropdown
    dataItemDropdown = jsonMaterial.listData?.items || [];

    // Render baris pertama input jika kosong
    const inputBody = document.getElementById("inputItemsBody");
    if (inputBody.children.length === 0) addNewRow();

    // 4. Render Tabel History (Bawah)
    renderHistoryTable(jsonHistory.tableData || jsonHistory.data || []);

    // 5. Auto Generate No PO jika kosong
    if (!document.getElementById("calcNoPo").value) {
      await generateNoPO();
    }

    Swal.close();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data awal: " + err.message, "error");
  }
}

// ================================================================
// 2. GENERATE NO PO (API)
// ================================================================
async function generateNoPO() {
  const dateInput = document.getElementById("calcPoDate").value;
  const inputPo = document.getElementById("calcNoPo");
  const inputPoPdf = document.getElementById("calcNoPoPdf");

  if (!dateInput) return;

  if (typeof owner_id === "undefined" || !owner_id) {
    console.error("Owner ID tidak ditemukan (Global Variable Missing)");
    return;
  }

  inputPo.value = "Generating...";

  try {
    const payload = {
      owner_id: parseInt(owner_id),
      po_date: dateInput,
      project_id: parseInt(projectId),
    };

    const res = await fetch(`${baseUrl}/generate/no_po`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.no_po) {
        const rawNoPo = json.data.no_po;
        const cleanNoPo = rawNoPo.replace(/<[^>]*>?/gm, "");
        inputPo.value = cleanNoPo;

        if (inputPoPdf) {
          const cleanForPdf = cleanNoPo.replace(/[\/\\ ]/g, "_");
          inputPoPdf.value = json.data.no_po_pdf || cleanForPdf;
        }
      } else {
        inputPo.value = "";
        if (inputPoPdf) inputPoPdf.value = "";
      }
    } else {
      inputPo.value = "";
    }
  } catch (err) {
    inputPo.value = "";
    console.error("Silent Error Generate PO:", err);
  }
}

// ================================================================
// 3. CORE: SAVE TRANSACTION
// ================================================================

async function saveTransaction() {
  try {
    if (isSubmitting) return;

    isSubmitting = true;
    calculateGrandTotal();

    const currentUserId =
      typeof user !== "undefined" && user.user_id ? parseInt(user.user_id) : 0;
    const currentOwnerId =
      typeof owner_id !== "undefined" ? parseInt(owner_id) : 0;

    const vendorIdInput = document.getElementById("calcVendorId").value;
    const noPo = document.getElementById("calcNoPo").value;
    const inputPoPdf = document.getElementById("calcNoPoPdf");
    const noPoPdf = inputPoPdf ? inputPoPdf.value : noPo;

    const picSelect = document.getElementById("calcNamaPic");
    let selectedPicName = null;

    if (picSelect && picSelect.value && picSelect.value != "0") {
      selectedPicName = picSelect.options[picSelect.selectedIndex].text;
    }

    if (!vendorIdInput || vendorIdInput == "0") {
      isSubmitting = false;
      return Swal.fire("Validasi", "Vendor belum dipilih.", "warning");
    }
    if (!noPo) {
      isSubmitting = false;
      return Swal.fire("Validasi", "Nomor PO belum terisi.", "warning");
    }

    // --- SCRAPE ITEMS ---
    const rows = document.querySelectorAll("#inputItemsBody tr");
    let itemsData = [];
    let isRowValid = true;

    rows.forEach((row) => {
      const itemId = row.querySelector(".input-pekerjaan").value;
      const matId = row.querySelector(".input-material").value;
      const prodName = row.querySelector(".input-product").value;
      const qty = parseFloat(row.querySelector(".input-qty").value || 0);
      const price = parseRupiah(row.querySelector(".input-price").value);
      const unit = row.querySelector(".input-unit").value;

      if (!itemId && !prodName && qty === 0) return;
      if ((itemId && !prodName) || (prodName && !itemId)) isRowValid = false;

      itemsData.push({
        project_item_id: parseInt(itemId),
        project_materials_id: parseInt(matId || 0),
        name: prodName,
        unit: unit,
        qty: qty,
        unit_price: price,
      });
    });

    if (!isRowValid || itemsData.length === 0) {
      isSubmitting = false;
      return Swal.fire("Validasi", "Mohon lengkapi item transaksi.", "warning");
    }

    // --- PREPARE PAYLOAD ---
    const isUpdate = currentUpdateCostId !== null;

    const payload = {
      owner_id: currentOwnerId,
      user_id: currentUserId,
      project_id: parseInt(projectId),
      vendor_id: parseInt(vendorIdInput),
      contact_id: parseInt(picSelect ? picSelect.value : 0),
      vendor_pic: selectedPicName,
      po_date: document.getElementById("calcPoDate").value,
      inv_date: document.getElementById("calcInvoiceDate").value,
      no_po: noPo,
      no_po_pdf: noPoPdf,
      no_inv: document.getElementById("calcInvoiceNo").value,
      ppn_percent: document.getElementById("summaryTaxCheck").checked ? 11 : 0,
      ppn_nominal: parseRupiah(
        document.getElementById("summaryTaxNominal").value
      ),
      discount_percent: parseFloat(
        document.getElementById("summaryDiscPercent").value || 0
      ),
      discount_nominal: parseRupiah(
        document.getElementById("summaryDiscNominal").value
      ),
      shipping: 0,
      notes: document.getElementById("calcGlobalNotes").value,
      items: itemsData,
    };

    if (isUpdate) payload.purchase_id = parseInt(currentUpdateCostId);

    const confirmTitle = isUpdate ? "Update Transaksi?" : "Simpan Transaksi?";
    const konfirmasi = await Swal.fire({
      title: confirmTitle,
      text: `PIC: ${selectedPicName || "-"} | Total Items: ${itemsData.length}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim",
    });

    if (!konfirmasi.isConfirmed) {
      isSubmitting = false;
      return;
    }

    Swal.fire({ title: "Memproses...", didOpen: () => Swal.showLoading() });

    const url = isUpdate
      ? `${baseUrl}/update/actual_costing/${currentUpdateCostId}`
      : `${baseUrl}/add/actual_costing`;

    const method = isUpdate ? "PUT" : "POST";

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (res.ok && json.success !== false) {
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data tersimpan dengan sukses!",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      resetForm();
      fetchInitialData();
    } else {
      throw new Error(json.message || "Gagal memproses data.");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", err.message, "error");
  } finally {
    isSubmitting = false;
  }
}

// ================================================================
// 4. FORM & ROW LOGIC
// ================================================================

function addNewRow() {
  rowCounter++;
  const tbody = document.getElementById("inputItemsBody");
  const tr = document.createElement("tr");
  tr.className = "hover:bg-gray-50 transition item-row border-b";

  let itemOpts = '<option value="">-- Pilih Pekerjaan --</option>';
  dataItemDropdown.forEach((item) => {
    itemOpts += `<option value="${item.project_item_id}">${item.product}</option>`;
  });

  tr.innerHTML = `
        <td class="p-4 text-center align-top pt-6 text-gray-500 font-bold row-number">#</td>
        <td class="p-4 align-top">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="text-xs text-gray-400">Korelasi Pekerjaan <span class="text-red-500">*</span></label>
                    <select class="w-full border p-2 rounded text-sm input-pekerjaan focus:ring-blue-500 focus:border-blue-500" onchange="handleRowPekerjaanChange(this)">
                        ${itemOpts}
                    </select>
                </div>
                <div>
                    <label class="text-xs text-gray-400">Korelasi Material <span class="text-red-500">*</span></label>
                    <select class="w-full border p-2 rounded text-sm bg-gray-100 text-gray-400 input-material" disabled>
                        <option value="0">-- Material --</option>
                    </select>
                </div>
            </div>
            
            <div class="mb-3">
            <label class="text-xs text-gray-500">Nama Produk <span class="text-red-500">*</span></label>
                <input type="text" class="w-full border p-2 rounded text-sm font-semibold input-product" placeholder="Nama Item / Produk Real (Struk)">
               
            </div>

            <div class="grid grid-cols-12 gap-2 bg-gray-50 p-2 rounded items-end">
                <div class="col-span-4">
                    <label class="text-xs text-gray-500">Harga (Rp) <span class="text-red-500">*</span></label>
                    <input type="text" class="w-full border p-1 rounded text-right text-sm input-price" value="0" onkeyup="formatCurrencyInput(this); calculateGrandTotal()">
                </div>
                <div class="col-span-2">
                    <label class="text-xs text-gray-500">Qty <span class="text-red-500">*</span></label>
                    <input type="number" class="w-full border p-1 rounded text-center text-sm input-qty" value="1" min="1" oninput="calculateGrandTotal()">
                </div>
                <div class="col-span-3">
                    <label class="text-xs text-gray-500">Unit <span class="text-red-500">*</span></label>
                    <div class="relative">
                        <input type="text" class="w-full border p-1 rounded text-center text-sm input-unit" placeholder="Pcs" oninput="filterUnitRow(this)">
                        <ul class="absolute bg-white border shadow hidden max-h-32 overflow-y-auto z-10 w-full suggestions-unit"></ul>
                    </div>
                </div>
                <div class="col-span-3 text-right">
                    <label class="text-xs text-gray-500">Total</label>
                    <input type="text" class="w-full bg-transparent border-none text-right font-bold text-gray-700 text-sm input-total" value="0" readonly>
                </div>
            </div>
        </td>
        <td class="p-4 text-center align-top pt-6">
             <button type="button" onclick="removeRow(this)" class="text-red-500 hover:bg-red-50 p-2 rounded-full">🗑️</button>
        </td>
    `;

  tbody.appendChild(tr);
  updateRowNumbers();
}

function handleRowPekerjaanChange(select) {
  const row = select.closest("tr");
  const matSelect = row.querySelector(".input-material");
  const itemId = select.value;

  matSelect.innerHTML = '<option value="0">-- Material --</option>';
  matSelect.disabled = true;
  matSelect.classList.add("bg-gray-100", "text-gray-400");

  if (!itemId) return;

  const selectedItem = dataItemDropdown.find(
    (i) => i.project_item_id == itemId
  );

  if (
    selectedItem &&
    selectedItem.materials &&
    selectedItem.materials.length > 0
  ) {
    matSelect.disabled = false;
    matSelect.classList.remove("bg-gray-100", "text-gray-400");

    selectedItem.materials.forEach((mat) => {
      const opt = document.createElement("option");
      opt.value = mat.project_materials_id;
      opt.innerHTML = `${mat.name} (${mat.qty} ${mat.unit})`;
      matSelect.appendChild(opt);
    });
  }
}

function removeRow(btn) {
  const tbody = document.getElementById("inputItemsBody");
  if (tbody.children.length > 1) {
    btn.closest("tr").remove();
    updateRowNumbers();
    calculateGrandTotal();
  } else {
    const row = btn.closest("tr");
    row.querySelector(".input-pekerjaan").value = "";
    row.querySelector(".input-product").value = "";
    row.querySelector(".input-price").value = "0";
    row.querySelector(".input-total").value = "0";
    handleRowPekerjaanChange(row.querySelector(".input-pekerjaan"));
  }
}

function updateRowNumbers() {
  document
    .querySelectorAll("#inputItemsBody .row-number")
    .forEach((el, idx) => (el.textContent = idx + 1));
}

// ================================================================
// 5. CALCULATION LOGIC
// ================================================================

function calculateGrandTotal() {
  let subTotal = 0;

  document.querySelectorAll("#inputItemsBody tr").forEach((row) => {
    const price = parseRupiah(row.querySelector(".input-price").value);
    const qty = parseFloat(row.querySelector(".input-qty").value || 0);
    const total = price * qty;

    row.querySelector(".input-total").value = finance(total);
    subTotal += total;
  });

  const subTotalEl = document.getElementById("summarySubtotal");
  if (subTotalEl) subTotalEl.value = finance(subTotal);

  const discPercentEl = document.getElementById("summaryDiscPercent");
  const discNominalEl = document.getElementById("summaryDiscNominal");

  const discPercent = parseFloat(discPercentEl?.value || 0);
  const discNominal = subTotal * (discPercent / 100);

  if (discNominalEl) discNominalEl.value = finance(discNominal);

  const afterDisc = subTotal - discNominal;

  let tax = 0;
  const taxCheckEl = document.getElementById("summaryTaxCheck");
  if (taxCheckEl && taxCheckEl.checked) {
    tax = afterDisc * 0.11;
  }

  const taxNominalEl = document.getElementById("summaryTaxNominal");
  if (taxNominalEl) taxNominalEl.value = finance(tax);

  const grandTotalEl = document.getElementById("summaryGrandTotal");
  if (grandTotalEl) grandTotalEl.value = finance(afterDisc + tax);
}

// ================================================================
// 6. HELPER: VENDOR & UNIT SEARCH
// ================================================================

function filterVendorSuggestions(input) {
  const val = input.value;
  const list = document.getElementById("vendorSuggestionsList");
  clearTimeout(vendorDebounceTimer);

  if (val.length < 2) {
    list.classList.add("hidden");
    return;
  }

  vendorDebounceTimer = setTimeout(async () => {
    try {
      list.classList.remove("hidden");
      list.innerHTML = '<li class="p-2 text-gray-400">Mencari...</li>';

      const res = await fetch(
        `${baseUrl}/table/vendor/${owner_id}/1?search=${val}`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        }
      );
      const json = await res.json();

      list.innerHTML = "";
      if (json.tableData && json.tableData.length > 0) {
        json.tableData.forEach((v) => {
          const li = document.createElement("li");
          li.className = "p-2 hover:bg-gray-100 cursor-pointer border-b";
          li.textContent = v.vendor_name || v.nama;
          li.onclick = () => {
            input.value = v.vendor_name || v.nama;
            document.getElementById("calcVendorId").value = v.vendor_id || v.id;
            list.classList.add("hidden");
            loadVendorPIC(v.vendor_id || v.id);
          };
          list.appendChild(li);
        });
      } else {
        list.innerHTML = '<li class="p-2 text-gray-400">Tidak ditemukan</li>';
      }
    } catch (e) {
      console.error(e);
    }
  }, 400);
}

async function loadVendorPIC(vid) {
  const picSelect = document.getElementById("calcNamaPic");
  picSelect.innerHTML = "<option>Loading...</option>";
  picSelect.disabled = true;
  try {
    const res = await fetch(`${baseUrl}/list/vendor_contact/${vid}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();

    picSelect.innerHTML = '<option value="0">-- Pilih PIC --</option>';
    if (json.listData && json.listData.length > 0) {
      picSelect.disabled = false;
      picSelect.classList.remove("bg-gray-100");
      json.listData.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.contact_id || c.id;
        opt.textContent = c.name;
        picSelect.appendChild(opt);
      });
    }
  } catch (e) {
    picSelect.innerHTML = "<option>Error</option>";
  }
}

function filterUnitRow(input) {
  const ul = input.nextElementSibling;
  const val = input.value;
  clearTimeout(unitDebounceTimer);

  if (val.length < 1) {
    ul.classList.add("hidden");
    return;
  }

  unitDebounceTimer = setTimeout(async () => {
    ul.classList.remove("hidden");
    ul.innerHTML = '<li class="p-2 text-xs">...</li>';
    try {
      const res = await fetch(
        `${baseUrl}/table/unit/${owner_id}/1?search=${val}`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        }
      );
      const json = await res.json();
      ul.innerHTML = "";
      if (json.tableData) {
        json.tableData.forEach((u) => {
          const li = document.createElement("li");
          li.className =
            "p-2 hover:bg-gray-100 cursor-pointer border-b text-xs";
          li.textContent = u.unit;
          li.onclick = () => {
            input.value = u.unit;
            ul.classList.add("hidden");
          };
          ul.appendChild(li);
        });
      }
    } catch (e) {}
  }, 300);
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".relative")) {
    document
      .querySelectorAll(".suggestions-unit, #vendorSuggestionsList")
      .forEach((el) => el.classList.add("hidden"));
  }
});

function finance(x) {
  if (!x) return "0";
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseRupiah(str) {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/\./g, "").replace(",", ".")) || 0;
}

// ================================================================
// RENDER TABLE ACTUAL COSTING (MODIFIED FOR INLINE FILES)
// ================================================================

function renderHistoryTable(data) {
  const tbody = document.getElementById("actualCostTableBody");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-400 italic">Belum ada data riwayat transaksi.</td></tr>`;
    return;
  }

  data.forEach((item) => {
    let statusBadge = "";
    if (item.status === "Paid") {
      statusBadge =
        '<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">Paid</span>';
    } else if (item.status === "Pending") {
      statusBadge =
        '<span class="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium border border-yellow-200">Pending</span>';
    } else {
      statusBadge = `<span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">${item.status}</span>`;
    }

    const isApproved = item.approval_status === "yes";

    let approvalHtml = "";
    if (isApproved) {
      approvalHtml = `
            <div class="flex items-center gap-1 justify-center mt-1 text-green-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span class="text-xs font-semibold">Approved</span>
            </div>
            <div class="text-[10px] text-gray-400 text-center truncate max-w-[150px]">${
              item.approved_by || "-"
            }</div>
        `;
    } else {
      approvalHtml = `
            <div class="flex items-center gap-1 justify-center mt-1 text-gray-400">
                <span class="text-xs">Waiting Approval</span>
            </div>
        `;
    }

    let reminderIcon = "";
    if (item.approval_reminder === "reminded") {
      reminderIcon = `
            <span class="absolute -top-1 -right-1 flex h-3 w-3" title="Reminder Sent">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        `;
    }

    const ppnDisplay =
      item.ppn_nominal > 0
        ? `<div class="flex justify-between text-xs text-red-600"><span>PPN (${
            item.ppn_percent
          }%)</span> <span>+ ${finance(item.ppn_nominal)}</span></div>`
        : "";
    const discDisplay =
      item.discount_nominal > 0
        ? `<div class="flex justify-between text-xs text-green-600"><span>Disc (${
            item.discount_percent
          }%)</span> <span>- ${finance(item.discount_nominal)}</span></div>`
        : "";

    const editBtnHtml = isApproved
      ? ""
      : `<button onclick="editActualCost(${item.purchase_id})" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">✏️ Edit Transaction</button>`;
    const deleteBtnHtml = isApproved
      ? ""
      : `<button onclick="handleDeleteActualCost(${item.purchase_id})" class="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">🗑 Delete Order</button>`;

    const tr = document.createElement("tr");
    tr.className =
      "hover:bg-blue-50 transition group border-b bg-white relative z-10";

    const dropdownId = `dropdown-action-${item.purchase_id}`;
    const fileCount = item.total_files || 0;
    const toggleBtnId = `btn-toggle-${item.purchase_id}`;
    const arrowId = `arrow-${item.purchase_id}`;
    const panelId = `panel-${item.purchase_id}`;

    tr.innerHTML = `
        <td class="p-4 align-top">
            <div class="flex flex-col gap-3">
                <div>
                    <div class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Purchase Order</div>
                    <div class="text-gray-800 text-sm font-bold">${
                      item.no_po || "-"
                    }</div>
                    <div class="text-xs text-gray-500 flex items-center gap-1">📅 ${
                      item.po_date
                    }</div>

                    <button onclick="toggleFilePanel('${
                      item.purchase_id
                    }')" id="${toggleBtnId}" 
                            class="mt-2 text-xs bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-50 hover:shadow transition flex items-center gap-2 w-full md:w-auto justify-between md:justify-start group-focus:ring-2">
                        <div class="flex items-center gap-2">
                            <span>📎</span>
                            <span id="label-file-count-${
                              item.purchase_id
                            }" class="font-semibold">${fileCount} Lampiran</span>
                        </div>
                        <svg id="${arrowId}" class="w-3 h-3 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                </div>
                ${
                  item.no_inv
                    ? `<div class="pt-2 border-t border-dashed"><div class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Invoice</div><div class="font-medium text-gray-600 text-sm">${item.no_inv}</div><div class="text-xs text-gray-500">📅 ${item.inv_date}</div></div>`
                    : ""
                }
            </div>
        </td>
        <td class="p-4 align-top">
            <div class="mb-1 font-bold text-gray-800 text-sm">${
              item.vendor
            }</div>
            <div class="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 p-2 rounded-md inline-block">
                <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                ${item.vendor_pic || "No PIC"}
            </div>
            ${
              item.notes
                ? `<div class="mt-2 text-xs text-gray-400 italic leading-snug">"${item.notes}"</div>`
                : ""
            }
        </td>
        <td class="p-4 align-top text-right">
            <div class="space-y-1 w-full max-w-[250px] ml-auto">
                <div class="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${finance(
                  item.subtotal || 0
                )}</span></div>
                ${discDisplay}
                ${ppnDisplay}
                <div class="border-t my-1 pt-1 flex justify-between items-center"><span class="text-xs font-bold text-gray-600">Total</span><span class="text-lg font-bold text-gray-900">${finance(
                  item.total_purchase
                )}</span></div>
            </div>
        </td>
        <td class="p-4 align-top text-center">
            <div class="relative inline-block">${statusBadge} ${reminderIcon}</div>
            <div class="mt-2">${approvalHtml}</div>
        </td>
        <td class="p-4 align-top text-center relative">
            <button onclick="toggleActionDropdown('${dropdownId}', event)" class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition focus:outline-none">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
            </button>
            <div id="${dropdownId}" class="dropdown-menu-po hidden absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50 text-sm text-left overflow-hidden">
                ${editBtnHtml}
                ${
                  !isApproved
                    ? `<button onclick="openPurchaseApproval('${item.purchase_id}', '${item.no_po}')" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 flex items-center gap-2">🟢 Update Approval</button>`
                    : ""
                }
                ${
                  !isApproved && item.approval_reminder !== "reminded"
                    ? `<button onclick="sendPurchaseReminder('${item.purchase_id}', '${item.no_po}')" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-500 flex items-center gap-2">📧 Send Reminder</button>`
                    : ""
                }
                <button onclick="printInvoice(${
                  item.purchase_id
                })" class="text-left w-full px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">📄 Print PO</button>
                ${!isApproved ? '<div class="border-t my-1"></div>' : ""}
                ${deleteBtnHtml}
            </div>
        </td>
    `;

    // --- RENDER HIDDEN PANEL ROW ---
    const trPanel = document.createElement("tr");
    trPanel.id = panelId;
    trPanel.className =
      "bg-slate-50 border-b shadow-inner hidden transition-all duration-300";

    trPanel.innerHTML = `
        <td colspan="5" class="p-0">
            <div class="p-4 border-l-4 border-blue-400 flex flex-col md:flex-row gap-6">
                <!-- A. AREA UPLOAD -->
                <div class="w-full md:w-1/3 min-w-[250px] border-r pr-4 border-gray-200">
                    <h5 class="text-xs font-bold text-gray-500 uppercase mb-2">☁️ Upload Dokumen</h5>
                    <div class="space-y-2">
                        <input type="file" id="file-input-${item.purchase_id}" accept="image/png, image/jpeg, image/jpg" class="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 border rounded bg-white shadow-sm"/>
                        <button onclick="handleInlineUpload('${item.purchase_id}')" id="btn-upload-${item.purchase_id}" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded shadow transition">Upload File</button>
                    </div>
                     <p class="text-[10px] text-gray-400 mt-1 italic">*Max 2MB (Hanya Gambar: PNG, JPG, JPEG)</p>
                </div>

                <!-- B. AREA LIST FILE -->
                <div class="w-full md:w-2/3">
                    <div class="flex justify-between items-center mb-2">
                        <h5 class="text-xs font-bold text-gray-500 uppercase">File Tersimpan</h5>
                        <button onclick="refreshInlineFiles('${item.purchase_id}')" class="text-[10px] text-blue-500 hover:underline">Refresh</button>
                    </div>
                    <div id="file-list-container-${item.purchase_id}" class="flex flex-wrap gap-3 min-h-[50px] items-center">
                        <span class="text-xs text-gray-400 italic">Klik tombol lampiran untuk memuat file...</span>
                    </div>
                </div>
            </div>
        </td>
    `;

    tbody.appendChild(tr);
    tbody.appendChild(trPanel);

    // --- FIX: FETCH DATA UNTUK MENGISI JUMLAH LAMPIRAN (0 problem) ---
    // Panggil fungsi refresh secara otomatis agar counter terupdate saat pertama load
    setTimeout(() => {
      refreshInlineFiles(item.purchase_id);
    }, 100 + data.indexOf(item) * 100); // Stagger request sedikit agar tidak overload
  });
}

function toggleActionDropdown(id, event) {
  event.stopPropagation();
  document.querySelectorAll(".dropdown-menu-po").forEach((el) => {
    if (el.id !== id) el.classList.add("hidden");
  });
  const dropdown = document.getElementById(id);
  if (dropdown) dropdown.classList.toggle("hidden");
}

window.onclick = function (event) {
  if (
    !event.target.closest(".dropdown-menu-po") &&
    !event.target.closest("button")
  ) {
    document.querySelectorAll(".dropdown-menu-po").forEach((el) => {
      el.classList.add("hidden");
    });
  }
};

async function deleteActualCost(id) {
  const c = await Swal.fire({
    title: "Hapus?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Hapus",
  });
  if (c.isConfirmed) {
    try {
      const res = await fetch(`${baseUrl}/delete/actual_costing/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      if (res.ok) {
        Swal.fire("Terhapus", "", "success");
        fetchInitialData();
      }
    } catch (e) {
      Swal.fire("Gagal", "", "error");
    }
  }
}

function resetForm() {
  document.getElementById("realCalcForm").reset();
  document.getElementById("calcVendorId").value = "0";
  document.getElementById("calcContactId").value = "0";
  document.getElementById("calcNamaPic").innerHTML =
    '<option value="">-- Pilih Vendor Dulu --</option>';
  document.getElementById("calcNamaPic").disabled = true;
  document.getElementById("inputItemsBody").innerHTML = "";
  addNewRow();
  document.getElementById("summarySubtotal").value = "0";
  document.getElementById("summaryDiscPercent").value = "";
  document.getElementById("summaryDiscNominal").value = "0";
  document.getElementById("summaryTaxCheck").checked = false;
  document.getElementById("summaryTaxNominal").value = "0";
  document.getElementById("summaryGrandTotal").value = "0";
  if (document.getElementById("calcNoPoPdf"))
    document.getElementById("calcNoPoPdf").value = "";

  currentUpdateCostId = null;
  const btnSimpan = document.querySelector(
    "#realCalcForm button[type='button'][onclick*='saveTransaction']"
  );
  if (btnSimpan) {
    btnSimpan.textContent = "Simpan Transaksi";
    btnSimpan.classList.remove("bg-orange-500", "hover:bg-orange-600");
    btnSimpan.classList.add("bg-blue-600", "hover:bg-blue-700");
  }
  generateNoPO();
}

async function editActualCost(id) {
  Swal.fire({ title: "Memuat Data...", didOpen: () => Swal.showLoading() });
  try {
    const res = await fetch(`${baseUrl}/detail/actual_costing/${id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();
    if (!json.success || !json.data || !json.data.header)
      throw new Error("Data tidak ditemukan / Response Error");

    const data = json.data.header;
    const itemsRaw = data.items || [];
    const uniqueItems = [];
    const seen = new Set();
    itemsRaw.forEach((item) => {
      const uniqueKey = `${item.project_item_id}-${item.project_materials_id}-${item.name}-${item.qty}-${item.unit_price}`;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        uniqueItems.push(item);
      }
    });

    document.getElementById("calcPoDate").value = data.po_date_ymd;
    document.getElementById("calcNoPo").value = data.no_po;
    if (document.getElementById("calcNoPoPdf"))
      document.getElementById("calcNoPoPdf").value =
        data.no_po_pdf || data.no_po;

    document.getElementById("calcInvoiceDate").value = data.inv_date_ymd;
    document.getElementById("calcInvoiceNo").value = data.no_inv;
    document.getElementById("calcGlobalNotes").value = data.notes;
    document.getElementById("calcNamaVendor").value = data.vendor;
    document.getElementById("calcVendorId").value = data.vendor_id;

    await loadVendorPIC(data.vendor_id);
    setTimeout(() => {
      document.getElementById("calcNamaPic").value = data.contact_id || 0;
      document.getElementById("calcContactId").value = data.contact_id || 0;
    }, 500);

    const tbody = document.getElementById("inputItemsBody");
    tbody.innerHTML = "";
    if (uniqueItems.length > 0) {
      uniqueItems.forEach((item) => {
        addNewRow();
        const row = tbody.lastElementChild;
        const inputPekerjaan = row.querySelector(".input-pekerjaan");
        inputPekerjaan.value = item.project_item_id;
        handleRowPekerjaanChange(inputPekerjaan);
        row.querySelector(".input-product").value = item.name;
        row.querySelector(".input-price").value = finance(item.unit_price);
        row.querySelector(".input-qty").value = item.qty;
        row.querySelector(".input-unit").value = item.unit;
        setTimeout(() => {
          const matSelect = row.querySelector(".input-material");
          if (matSelect && !matSelect.disabled)
            matSelect.value = item.project_materials_id || 0;
        }, 300);
      });
    } else {
      addNewRow();
    }

    document.getElementById("summaryDiscPercent").value = data.discount_percent;
    document.getElementById("summaryDiscNominal").value = finance(
      data.discount_nominal
    );
    document.getElementById("summaryTaxCheck").checked = data.ppn_nominal > 0;
    document.getElementById("summaryTaxNominal").value = finance(
      data.ppn_nominal
    );

    currentUpdateCostId = id;
    const btnSimpan = document.querySelector(
      "#realCalcForm button[type='button'][onclick*='saveTransaction']"
    );
    if (btnSimpan) {
      btnSimpan.textContent = "Update Transaksi";
      btnSimpan.classList.replace("bg-blue-600", "bg-orange-500");
      btnSimpan.classList.replace("hover:bg-blue-700", "hover:bg-orange-600");
    }

    setTimeout(calculateGrandTotal, 600);
    document
      .getElementById("realCalcForm")
      .scrollIntoView({ behavior: "smooth" });
    Swal.close();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat detail: " + err.message, "error");
  }
}

async function openPurchaseApproval(purchaseId, noPo, currentStatus = "no") {
  try {
    const { value: formValues } = await Swal.fire({
      title: "Update Purchase Approval",
      html: `<div class="text-left space-y-3"><p class="text-sm text-gray-500">Update status untuk PO: <b>${noPo}</b></p><div><label class="block text-sm font-bold text-gray-700 mb-1">Status Approval</label><select id="approvalSelect" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"><option value="no" ${
        currentStatus !== "yes" ? "selected" : ""
      }>Pending</option><option value="yes" ${
        currentStatus === "yes" ? "selected" : ""
      }>Approved</option></select></div></div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Status",
      cancelButtonText: "Batal",
      preConfirm: () => document.getElementById("approvalSelect").value,
    });

    if (!formValues) return;
    const bodyData = {
      purchase_id: parseInt(purchaseId),
      user_id: parseInt(user.user_id),
      approved: formValues,
    };
    Swal.fire({ title: "Updating...", didOpen: () => Swal.showLoading() });
    const res = await fetch(
      `${baseUrl}/update/purchase_approval/${purchaseId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(bodyData),
      }
    );
    const result = await res.json();
    if (res.ok) {
      Swal.fire(
        "Sukses",
        result.message || "Approval berhasil diperbarui",
        "success"
      );
      fetchInitialData();
    } else {
      throw new Error(result.message || "Gagal update approval");
    }
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

async function sendPurchaseReminder(purchaseId, noPo) {
  const confirmResult = await Swal.fire({
    title: "Kirim Reminder?",
    text: `Kirim notifikasi reminder approval untuk PO: ${noPo}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Kirim",
    cancelButtonText: "Batal",
    confirmButtonColor: "#f97316",
  });
  if (!confirmResult.isConfirmed) return;
  Swal.fire({ title: "Mengirim...", didOpen: () => Swal.showLoading() });
  try {
    const payload = {
      purchase_id: parseInt(purchaseId),
      user_id: user.user_id,
      owner_id: user.owner_id,
    };
    const res = await fetch(
      `${baseUrl}/reminder/purchase_approval/${purchaseId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (res.ok && json.response == "200" && json.data?.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: json.data.message || "Reminder berhasil dikirim.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchInitialData();
    } else {
      throw new Error(
        json.data?.message || json.message || "Gagal mengirim reminder."
      );
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message || "Terjadi kesalahan koneksi.",
    });
  }
}

function getApprovalStatusBadge(status) {
  const safeStatus = (status || "").toLowerCase();
  if (safeStatus === "approved")
    return `<span class="bg-green-100 text-green-700 border border-green-300 px-2 py-1 rounded-full text-xs font-bold capitalize inline-block min-w-[80px] text-center">✅ Approved</span>`;
  else if (safeStatus === "pending")
    return `<span class="bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-1 rounded-full text-xs font-bold capitalize inline-block min-w-[80px] text-center">⏳ Pending</span>`;
  else if (safeStatus === "rejected")
    return `<span class="bg-red-100 text-red-700 border border-red-300 px-2 py-1 rounded-full text-xs font-bold capitalize inline-block min-w-[80px] text-center">❌ Rejected</span>`;
  else return `<span class="text-gray-400 font-medium">-</span>`;
}

window.printInvoice = async function (id) {
  if (!id || id == "0")
    return Swal.fire("Error", "ID Transaksi tidak ditemukan.", "error");
  try {
    Swal.fire({
      title: "Memeriksa Data...",
      didOpen: () => Swal.showLoading(),
    });
    const response = await fetch(`${baseUrl}/detail/actual_costing/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await response.json();
    const header = result?.data?.header;
    if (!header) throw new Error("Data faktur tidak ditemukan.");
    Swal.close();
    const swalResult = await Swal.fire({
      title: "Cetak Purchase Order",
      html: `Cetak PO Nomor: ${header.no_po}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Buka PDF",
      confirmButtonColor: "#3085d6",
      cancelButtonText: "Batal",
    });
    if (swalResult.isConfirmed)
      window.open(`purchaseorder_print.html?id=${id}`, "_blank");
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message || "Terjadi kesalahan saat memuat data.",
      icon: "error",
    });
  }
};

// ================================================================
// 8. FILE MANAGEMENT LOGIC (UPDATED ENDPOINTS)
// ================================================================

// A. Toggle Panel Logic
async function toggleFilePanel(id) {
  const panel = document.getElementById(`panel-${id}`);
  const arrow = document.getElementById(`arrow-${id}`);
  const btn = document.getElementById(`btn-toggle-${id}`);

  if (panel.classList.contains("hidden")) {
    panel.classList.remove("hidden");
    if (arrow) arrow.style.transform = "rotate(180deg)";
    if (btn) btn.classList.add("bg-blue-50", "ring-2", "ring-blue-100");
    // Kita tidak perlu refresh lagi di sini jika sudah di-load otomatis di awal,
    // tapi tidak ada salahnya refresh jika user ingin update terbaru.
    await refreshInlineFiles(id);
  } else {
    panel.classList.add("hidden");
    if (arrow) arrow.style.transform = "rotate(0deg)";
    if (btn) btn.classList.remove("bg-blue-50", "ring-2", "ring-blue-100");
  }
}

// B. Fetch & Render File List (ENDPOINT: list/purchase_file/{id})
async function refreshInlineFiles(purchaseId) {
  const container = document.getElementById(
    `file-list-container-${purchaseId}`
  );

  try {
    // --- ADDED: Cache Buster with timestamp to ensure fresh list ---
    const res = await fetch(
      `${baseUrl}/list/purchase_file/${purchaseId}?_t=${new Date().getTime()}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const json = await res.json();

    // Response format: { listData: [{ id, file: 'url', ... }] }
    const files = json.listData || [];

    // Update Counter (PENTING UNTUK INIT LOAD)
    const labelCount = document.getElementById(
      `label-file-count-${purchaseId}`
    );
    if (labelCount) labelCount.innerText = `${files.length} Lampiran`;

    if (files.length === 0) {
      container.innerHTML =
        '<span class="text-xs text-gray-400 italic">Belum ada file.</span>';
      return;
    }

    container.innerHTML = "";
    files.forEach((f) => {
      const fullUrl = f.file;
      const fileName = fullUrl.split("/").pop() || "Dokumen";

      const ext = fileName.split(".").pop().toLowerCase();
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
      const isPdf = ext === "pdf";
      const typeParam = isImage ? "image" : isPdf ? "pdf" : "other";

      const iconHtml = isPdf
        ? `<div class="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center text-sm"><span class="font-bold">PDF</span></div>`
        : isImage
        ? `<div class="w-8 h-8 rounded bg-blue-50 text-blue-500 flex items-center justify-center text-sm"><span class="font-bold">IMG</span></div>`
        : `<div class="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-sm"><span class="font-bold">FILE</span></div>`;

      const card = document.createElement("div");
      card.setAttribute(
        "onclick",
        `previewFile('${fileName}', '${typeParam}', '${fullUrl}')`
      );
      card.className =
        "group relative cursor-pointer flex items-center gap-3 bg-white border rounded-lg p-2 pr-8 shadow-sm hover:shadow-md transition min-w-[200px] hover:border-blue-300";
      card.innerHTML = `
                ${iconHtml}
                <div class="overflow-hidden">
                    <div class="block text-xs font-bold text-gray-700 truncate w-[120px]" title="${fileName}">${fileName}</div>
                </div>
                
                <button onclick="event.stopPropagation(); handleInlineDelete(this, '${f.id}', '${purchaseId}')" class="absolute top-1 right-1 text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition z-10">
                    🗑️
                </button>
            `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<span class="text-xs text-red-400">Gagal memuat.</span>';
  }
}

// C. Upload Action (ENDPOINT: add/purchase_file)
async function handleInlineUpload(purchaseId) {
  const input = document.getElementById(`file-input-${purchaseId}`);
  const btn = document.getElementById(`btn-upload-${purchaseId}`);

  if (!input.files[0]) return Swal.fire("Ops", "Pilih file dulu", "warning");

  // --- ADDED: Validation File Type (Only Images) ---
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(input.files[0].type)) {
    return Swal.fire(
      "Error",
      "Hanya file gambar (JPG/PNG) yang diperbolehkan!",
      "error"
    );
  }

  const formData = new FormData();
  formData.append("purchase_id", purchaseId);
  formData.append("file", input.files[0]);
  formData.append("owner_id", typeof owner_id !== "undefined" ? owner_id : 0);
  formData.append("user_id", typeof user !== "undefined" ? user.user_id : 0);
  formData.append("project_id", projectId);

  const originalText = btn.innerText;
  btn.innerText = "Mengupload...";
  btn.disabled = true;

  try {
    const res = await fetch(`${baseUrl}/add/purchase_file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });

    const json = await res.json();

    if (res.ok) {
      input.value = "";
      await refreshInlineFiles(purchaseId);

      Swal.fire("Berhasil", "File berhasil diupload.", "success");
    } else {
      throw new Error(json.message || "Gagal upload");
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", e.message, "error");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

// D. Delete Action (ENDPOINT: delete/purchase_file/{id})
async function handleInlineDelete(btn, fileId, purchaseId) {
  const c = await Swal.fire({
    title: "Hapus file?",
    text: "File akan hilang permanen",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    confirmButtonColor: "#d33",
    width: "300px",
  });

  if (c.isConfirmed) {
    try {
      const res = await fetch(`${baseUrl}/delete/purchase_file/${fileId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        // --- FIXED: Instant DOM Removal ---
        if (btn && btn.closest(".group")) {
          btn.closest(".group").remove();
        }

        // Tampilkan notifikasi sukses dulu
        await Swal.fire({
          icon: "success",
          title: "Terhapus",
          text: "File berhasil dihapus.",
          timer: 1000,
          showConfirmButton: false,
        });

        // Refresh list untuk update counter
        refreshInlineFiles(purchaseId);
      } else {
        Swal.fire("Gagal", "Hapus gagal", "error");
      }
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    }
  }
}

// E. Logic Preview Modal (FETCH BLOB FOR AUTH)
async function previewFile(title, type, url) {
  const modal = document.getElementById("previewModal");
  const modalTitle = document.getElementById("modalTitle");
  const img = document.getElementById("previewImage");
  const iframe = document.getElementById("previewFrame");
  const btnDownload = document.getElementById("btnDownload");
  const loading = document.getElementById("previewLoading");

  // Reset UI State
  img.classList.add("hidden");
  iframe.classList.add("hidden");
  loading.classList.remove("hidden");

  // Set Content
  modalTitle.innerText = title;

  // Default Download Link (akan di-override jika image)
  btnDownload.href = url;
  btnDownload.download = title;

  modal.classList.remove("hidden");

  if (type === "image") {
    try {
      // Fetch dengan header Authorization
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      if (!res.ok) throw new Error("Gagal load image");

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      img.src = objectUrl;
      img.onload = () => {
        loading.classList.add("hidden");
        img.classList.remove("hidden");
      };

      // Set download button ke Object URL
      btnDownload.href = objectUrl;
    } catch (e) {
      loading.innerHTML =
        '<span class="text-red-500">Gagal memuat gambar (Auth/Network)</span>';
    }
  } else if (type === "pdf") {
    // PDF Iframe (Note: Iframe mungkin tetap butuh trik khusus untuk Auth,
    // tapi jika browser kirim cookie aman. Jika butuh header, PDF viewer JS diperlukan)
    iframe.src = url;
    iframe.onload = () => {
      loading.classList.add("hidden");
      iframe.classList.remove("hidden");
    };
    // Fallback for iframe load event
    setTimeout(() => {
      loading.classList.add("hidden");
      iframe.classList.remove("hidden");
    }, 1000);
  } else {
    // Fallback for unknown files
    modal.classList.add("hidden");
    window.open(url, "_blank");
  }
}

function closePreview() {
  const modal = document.getElementById("previewModal");
  const img = document.getElementById("previewImage");
  const iframe = document.getElementById("previewFrame");

  modal.classList.add("hidden");
  // Clear SRC to prevent memory leak / background loading
  setTimeout(() => {
    img.src = "";
    iframe.src = "";
  }, 200);
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closePreview();
  }
});
