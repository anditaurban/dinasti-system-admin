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

    if (document.getElementById("calcPoDate").value) {
      // Opsional: Jika ingin generate ulang setiap refresh
      // await generateNoPO();
      // ATAU: Biarkan kosong jika user belum mengganti tanggal
    }

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
    // Struktur: listData.items[] -> materials[]
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
        // --- PERBAIKAN: BERSIHKAN TAG HTML ---
        // Ambil data mentah dari server
        const rawNoPo = json.data.no_po;

        // Hapus semua tag HTML (<b>, <i>, dll) menggunakan Regex
        const cleanNoPo = rawNoPo.replace(/<[^>]*>?/gm, "");

        // Masukkan teks bersih ke Input agar user melihat teks biasa
        inputPo.value = cleanNoPo;

        // --- UPDATE PDF FIELD ---
        if (inputPoPdf) {
          // Untuk PDF (nama file), kita gunakan yang bersih juga
          // lalu ganti garis miring dengan underscore
          const cleanForPdf = cleanNoPo.replace(/[\/\\ ]/g, "_");

          // Prioritas: gunakan data dari server jika ada, jika tidak gunakan hasil generate sendiri
          inputPoPdf.value = json.data.no_po_pdf || cleanForPdf;
        }
      } else {
        inputPo.value = "";
        if (inputPoPdf) inputPoPdf.value = "";
        console.warn("Response OK tapi data No PO kosong");
      }
    } else {
      inputPo.value = "";
      console.error("Gagal generate PO:", res.status, res.statusText);
    }
  } catch (err) {
    inputPo.value = "";
    console.error("Silent Error Generate PO:", err);
  }
}
// ================================================================
// 3. CORE: SAVE TRANSACTION (ADAPTED FROM saveInvoice)
// ================================================================

async function saveTransaction() {
  try {
    if (isSubmitting) return;

    console.clear();
    console.log("🚀 START: saveTransaction process...");

    isSubmitting = true;
    calculateGrandTotal();

    // --- 1. AMBIL VARIABLE GLOBAL ---
    const currentUserId =
      typeof user !== "undefined" && user.user_id
        ? parseInt(user.user_id)
        : typeof user_id !== "undefined"
        ? parseInt(user_id)
        : 0;
    const currentOwnerId =
      typeof owner_id !== "undefined" ? parseInt(owner_id) : 0;

    // --- 2. AMBIL & VALIDASI INPUT ---
    const vendorIdInput = document.getElementById("calcVendorId").value;
    const noPo = document.getElementById("calcNoPo").value;

    // ============================================================
    // 🔥 PERBAIKAN DISINI: Definisikan noPoPdf sebelum dipakai
    // ============================================================
    const inputPoPdf = document.getElementById("calcNoPoPdf");
    // Jika input hidden ada, ambil nilainya. Jika tidak, pakai noPo biasa.
    const noPoPdf = inputPoPdf ? inputPoPdf.value : noPo;
    // ============================================================

    // --- LOGIKA BARU: AMBIL NAMA PIC DARI TEXT DROPDOWN ---
    const picSelect = document.getElementById("calcNamaPic");
    let selectedPicName = null; // Default null jika kosong

    // Cek apakah ada PIC yang dipilih (value tidak 0/kosong)
    if (picSelect && picSelect.value && picSelect.value != "0") {
      selectedPicName = picSelect.options[picSelect.selectedIndex].text;
    }

    // --- DEBUG DATA HEADER ---
    console.group("🔍 Cek Header & Vendor");
    console.log("Vendor ID:", vendorIdInput);
    console.log("Contact ID (Value):", picSelect ? picSelect.value : "N/A");
    console.log("Vendor PIC (Name):", selectedPicName);
    console.groupEnd();

    if (!vendorIdInput || vendorIdInput == "0") {
      isSubmitting = false;
      return Swal.fire("Validasi", "Vendor belum dipilih.", "warning");
    }
    if (!noPo) {
      isSubmitting = false;
      return Swal.fire("Validasi", "Nomor PO belum terisi.", "warning");
    }

    // --- 3. SCRAPE ITEMS ---
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

    // --- 4. PREPARE PAYLOAD ---
    const isUpdate = currentUpdateCostId !== null;

    const payload = {
      owner_id: currentOwnerId,
      user_id: currentUserId,
      project_id: parseInt(projectId),
      vendor_id: parseInt(vendorIdInput),

      // Mengirim ID Kontak
      contact_id: parseInt(picSelect ? picSelect.value : 0),

      // +++ KEY BARU: MENGIRIM NAMA PIC +++
      vendor_pic: selectedPicName,

      po_date: document.getElementById("calcPoDate").value,
      inv_date: document.getElementById("calcInvoiceDate").value,
      no_po: noPo,

      // Variable ini sekarang sudah didefinisikan di atas (Line fix)
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

    // --- LOG FINAL PAYLOAD ---
    console.log("🔥 FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    // --- 5. KONFIRMASI ---
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

    // --- 6. EXECUTE FETCH ---
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
    console.log("📥 RESPONSE:", json);

    if (res.ok && json.success !== false) {
      // --- PERBAIKAN TIMING NOTIFIKASI ---
      // Kita pakai 'await' dan 'timer' agar script PAUSE dulu selama 1.5 detik
      // sebelum menjalankan resetForm().

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data tersimpan dengan sukses!",
        timer: 1500, // Muncul selama 1.5 detik
        showConfirmButton: false, // Hilangkan tombol OK (otomatis)
        timerProgressBar: true, // Ada bar loading kecil (visual cue)
      });

      // Kode di bawah ini baru jalan SETELAH 1.5 detik lewat
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

  // Generate Option Dropdown Items
  let itemOpts = '<option value="">-- Pilih Pekerjaan --</option>';
  dataItemDropdown.forEach((item) => {
    itemOpts += `<option value="${item.project_item_id}">${item.product}</option>`;
  });

  tr.innerHTML = `
        <td class="p-4 text-center align-top pt-6 text-gray-500 font-bold row-number">#</td>
        <td class="p-4 align-top">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="text-xs text-gray-400">Korelasi Pekerjaan</label>
                    <select class="w-full border p-2 rounded text-sm input-pekerjaan focus:ring-blue-500 focus:border-blue-500" onchange="handleRowPekerjaanChange(this)">
                        ${itemOpts}
                    </select>
                </div>
                <div>
                    <label class="text-xs text-gray-400">Korelasi Material</label>
                    <select class="w-full border p-2 rounded text-sm bg-gray-100 text-gray-400 input-material" disabled>
                        <option value="0">-- Material --</option>
                    </select>
                </div>
            </div>
            
            <div class="mb-3">
            <label class="text-xs text-gray-500">Nama Produk</label>
                <input type="text" class="w-full border p-2 rounded text-sm font-semibold input-product" placeholder="Nama Item / Produk Real (Struk)">
               
            </div>

            <div class="grid grid-cols-12 gap-2 bg-gray-50 p-2 rounded items-end">
                <div class="col-span-4">
                    <label class="text-xs text-gray-500">Harga (Rp)</label>
                    <input type="text" class="w-full border p-1 rounded text-right text-sm input-price" value="0" onkeyup="formatCurrencyInput(this); calculateGrandTotal()">
                </div>
                <div class="col-span-2">
                    <label class="text-xs text-gray-500">Qty</label>
                    <input type="number" class="w-full border p-1 rounded text-center text-sm input-qty" value="1" min="1" oninput="calculateGrandTotal()">
                </div>
                <div class="col-span-3">
                    <label class="text-xs text-gray-500">Unit</label>
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

  // Cari Item di Array Global
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
      // Sesuai endpoint, ID nya 'project_materials_id'
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
    // Reset baris terakhir jika hanya satu
    const row = btn.closest("tr");
    row.querySelector(".input-pekerjaan").value = "";
    row.querySelector(".input-product").value = "";
    row.querySelector(".input-price").value = "0";
    row.querySelector(".input-total").value = "0";
    handleRowPekerjaanChange(row.querySelector(".input-pekerjaan")); // Reset material
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

// UBAH NAMA dari calculateGrandTotal MENJADI calculateGrandTotal
function calculateGrandTotal() {
  let subTotal = 0;

  // Hitung per baris & Accumulate Subtotal
  document.querySelectorAll("#inputItemsBody tr").forEach((row) => {
    const price = parseRupiah(row.querySelector(".input-price").value);
    const qty = parseFloat(row.querySelector(".input-qty").value || 0);
    const total = price * qty;

    row.querySelector(".input-total").value = finance(total);
    subTotal += total;
  });

  // Update Field Subtotal
  const subTotalEl = document.getElementById("summarySubtotal");
  if (subTotalEl) subTotalEl.value = finance(subTotal);

  // Hitung Diskon
  // Pastikan elemen ID ini ada di HTML Footer kamu
  const discPercentEl = document.getElementById("summaryDiscPercent");
  const discNominalEl = document.getElementById("summaryDiscNominal");

  const discPercent = parseFloat(discPercentEl?.value || 0);
  const discNominal = subTotal * (discPercent / 100);

  if (discNominalEl) discNominalEl.value = finance(discNominal);

  const afterDisc = subTotal - discNominal;

  // Hitung PPN
  let tax = 0;
  const taxCheckEl = document.getElementById("summaryTaxCheck");
  if (taxCheckEl && taxCheckEl.checked) {
    tax = afterDisc * 0.11; // PPN 11%
  }

  const taxNominalEl = document.getElementById("summaryTaxNominal");
  if (taxNominalEl) taxNominalEl.value = finance(tax);

  // Grand Total
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
  // Logika pencarian unit (sama seperti sebelumnya, disesuaikan)
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

// Tutup dropdown saat klik luar
document.addEventListener("click", (e) => {
  if (!e.target.closest(".relative")) {
    document
      .querySelectorAll(".suggestions-unit, #vendorSuggestionsList")
      .forEach((el) => el.classList.add("hidden"));
  }
});

// ================================================================
// 7. UTILITY FUNCTIONS
// ================================================================
function finance(x) {
  if (!x) return "0";
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseRupiah(str) {
  if (!str) return 0;
  // Hapus titik, ganti koma dengan titik untuk desimal (format Indonesia)
  return parseFloat(str.toString().replace(/\./g, "").replace(",", ".")) || 0;
}

// ================================================================
// RENDER TABLE ACTUAL COSTING
// ================================================================

function renderHistoryTable(data) {
  const tbody = document.getElementById("actualCostTableBody");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-400 italic">Belum ada data riwayat transaksi.</td></tr>`;
    return;
  }

  data.forEach((item) => {
    // --- 1. Logic Status Badge ---
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

    // --- 2. Logic Approval HTML ---
    const isApproved = item.approval_status === "yes"; // Cek status approval

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

    // Reminder Icon
    let reminderIcon = "";
    if (item.approval_reminder === "reminded") {
      reminderIcon = `
            <span class="absolute -top-1 -right-1 flex h-3 w-3" title="Reminder Sent">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        `;
    }

    // --- 3. Logic Financial ---
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

    // --- LOGIC TOMBOL EDIT (HIDDEN IF APPROVED) ---
    const editBtnHtml = isApproved
      ? "" // Jika Approved, kosongkan string (Hidden)
      : `<button onclick="editActualCost(${item.purchase_id})" 
           class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"> 
           ✏️ Edit Transaction 
         </button>`;

    // --- LOGIC TOMBOL DELETE (HIDDEN IF APPROVED) ---
    const deleteBtnHtml = isApproved
      ? "" // Jika Approved, kosongkan string (Hidden)
      : `<button onclick="handleDeleteActualCost(${item.purchase_id})" 
           class="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
           🗑 Delete Order
         </button>`;

    // --- 4. RENDER ROW ---
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 transition group border-b";

    const dropdownId = `dropdown-action-${item.purchase_id}`;

    tr.innerHTML = `
        <td class="p-4 align-top">
            <div class="flex flex-col gap-3">
                <div>
                    <div class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Purchase Order</div>
                    <div class="text-gray-800 text-sm">${
                      item.no_po || "-"
                    }</div>
                    <div class="text-xs text-gray-500 flex items-center gap-1">📅 ${
                      item.po_date
                    }</div>
                </div>
                ${
                  item.no_inv
                    ? `
                <div class="pt-2 border-t border-dashed">
                    <div class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Invoice</div>
                    <div class="font-medium text-gray-600 text-sm">${item.no_inv}</div>
                    <div class="text-xs text-gray-500">📅 ${item.inv_date}</div>
                </div>`
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
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>${finance(item.subtotal || 0)}</span>
                </div>
                ${discDisplay}
                ${ppnDisplay}
                <div class="border-t my-1 pt-1 flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-600">Total</span>
                    <span class="text-lg font-bold text-gray-900">${finance(
                      item.total_purchase
                    )}</span>
                </div>
            </div>
        </td>

        <td class="p-4 align-top text-center">
            <div class="relative inline-block">
                ${statusBadge}
                ${reminderIcon}
            </div>
            <div class="mt-2">
                ${approvalHtml}
            </div>
        </td>

        <td class="p-4 align-top text-center relative">
            <button onclick="toggleActionDropdown('${dropdownId}', event)" 
                    class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition focus:outline-none">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
            </button>

            <div id="${dropdownId}" class="dropdown-menu-po hidden absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50 text-sm text-left overflow-hidden">
                
                ${editBtnHtml} ${
      !isApproved
        ? `
                    <button onclick="openPurchaseApproval('${item.purchase_id}', '${item.no_po}')" 
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 flex items-center gap-2">
                        🟢 Update Approval
                    </button>
                `
        : ""
    }

                ${
                  !isApproved && item.approval_reminder !== "reminded"
                    ? `
                    <button onclick="sendPurchaseReminder('${item.purchase_id}', '${item.no_po}')" 
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-500 flex items-center gap-2">
                        📧 Send Reminder
                    </button>
                `
                    : ""
                }
                
                <button onclick="printInvoice(${item.purchase_id})" 
                        class="text-left w-full px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                    📄 Print PO
                </button>

                ${!isApproved ? '<div class="border-t my-1"></div>' : ""}

                ${deleteBtnHtml} </div>
        </td>
    `;
    tbody.appendChild(tr);
  });
}

// Function untuk toggle dropdown spesifik
function toggleActionDropdown(id, event) {
  // Stop event bubbling agar tidak langsung mentrigger window onclick
  event.stopPropagation();

  // Tutup semua dropdown lain dulu
  document.querySelectorAll(".dropdown-menu-po").forEach((el) => {
    if (el.id !== id) el.classList.add("hidden");
  });

  // Toggle dropdown yang diklik
  const dropdown = document.getElementById(id);
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
}

// Event Listener Global: Tutup dropdown jika klik di luar
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

  // Reset Hidden Inputs
  document.getElementById("calcVendorId").value = "0";
  document.getElementById("calcContactId").value = "0";
  document.getElementById("calcNamaPic").innerHTML =
    '<option value="">-- Pilih Vendor Dulu --</option>';
  document.getElementById("calcNamaPic").disabled = true;

  // Reset Table
  document.getElementById("inputItemsBody").innerHTML = "";
  addNewRow(); // Tambah 1 baris kosong

  // Reset Footer
  document.getElementById("summarySubtotal").value = "0";
  document.getElementById("summaryDiscPercent").value = "";
  document.getElementById("summaryDiscNominal").value = "0";
  document.getElementById("summaryTaxCheck").checked = false;
  document.getElementById("summaryTaxNominal").value = "0";
  document.getElementById("summaryGrandTotal").value = "0";
  if (document.getElementById("calcNoPoPdf")) {
    document.getElementById("calcNoPoPdf").value = "";
  }

  // KEMBALI KE MODE CREATE
  currentUpdateCostId = null;
  const btnSimpan = document.querySelector(
    "#realCalcForm button[type='button'][onclick*='saveTransaction']"
  );
  if (btnSimpan) {
    btnSimpan.textContent = "Simpan Transaksi";
    btnSimpan.classList.remove("bg-orange-500", "hover:bg-orange-600");
    btnSimpan.classList.add("bg-blue-600", "hover:bg-blue-700");
  }

  // Generate No PO baru untuk transaksi selanjutnya
  generateNoPO();
}

async function editActualCost(id) {
  Swal.fire({ title: "Memuat Data...", didOpen: () => Swal.showLoading() });

  try {
    console.group("🛑 DEBUG EDIT MODE");

    const res = await fetch(`${baseUrl}/detail/actual_costing/${id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();

    if (!json.success || !json.data || !json.data.header) {
      throw new Error("Data tidak ditemukan / Response Error");
    }

    const data = json.data.header;
    const itemsRaw = data.items || [];

    // --- 1. LOGIKA HAPUS DUPLIKAT (NEW) ---
    // Kita buat "fingerprint" unik untuk setiap item.
    // Jika fingerprint sama persis, kita anggap itu duplikat sampah dari server.

    const uniqueItems = [];
    const seen = new Set();

    itemsRaw.forEach((item) => {
      // Kita buat kunci unik gabungan dari: ID Item + ID Material + Nama + Harga + Qty
      // Jika semua ini sama, berarti barisnya kembar.
      const uniqueKey = `${item.project_item_id}-${item.project_materials_id}-${item.name}-${item.qty}-${item.unit_price}`;

      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        uniqueItems.push(item);
      }
    });

    console.log(
      `📊 Data Mentah: ${itemsRaw.length}, Data Unik (Setelah Filter): ${uniqueItems.length}`
    );

    // --- 2. RENDER FORM ---
    document.getElementById("calcPoDate").value = data.po_date_ymd;
    document.getElementById("calcNoPo").value = data.no_po;
    if (document.getElementById("calcNoPoPdf")) {
      // Mengisi nilai dari database, atau fallback ke no_po biasa jika null
      document.getElementById("calcNoPoPdf").value =
        data.no_po_pdf || data.no_po;
    }

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

    // --- 3. RENDER TABEL ---
    const tbody = document.getElementById("inputItemsBody");

    // Bersihkan tabel
    tbody.innerHTML = "";

    if (uniqueItems.length > 0) {
      // Loop menggunakan data yang SUDAH DI-FILTER (uniqueItems)
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
          if (matSelect && !matSelect.disabled) {
            matSelect.value = item.project_materials_id || 0;
          }
        }, 300);
      });
    } else {
      addNewRow();
    }

    // --- 4. FOOTER ---
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

    console.groupEnd();
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
      html: `
        <div class="text-left space-y-3">
          <p class="text-sm text-gray-500">Update status untuk PO: <b>${noPo}</b></p>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">Status Approval</label>
            <select id="approvalSelect" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
              <option value="no" ${
                currentStatus !== "yes" ? "selected" : ""
              }>Pending</option>
              <option value="yes" ${
                currentStatus === "yes" ? "selected" : ""
              }>Approved</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Status",
      cancelButtonText: "Batal",
      preConfirm: () => {
        return document.getElementById("approvalSelect").value;
      },
    });

    if (!formValues) return;

    // Payload
    const bodyData = {
      purchase_id: parseInt(purchaseId),
      user_id: parseInt(user.user_id),
      approved: formValues, // 'yes' or 'no'
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
      fetchInitialData(); // Refresh Tabel
    } else {
      throw new Error(result.message || "Gagal update approval");
    }
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

async function sendPurchaseReminder(purchaseId, noPo) {
  // 1. Konfirmasi User
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

  // 2. Tampilkan Loading
  Swal.fire({ title: "Mengirim...", didOpen: () => Swal.showLoading() });

  try {
    // 3. Susun Payload (Wajib ada user_id & owner_id agar tidak error 400)
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

    // 4. Validasi Response sesuai struktur JSON terbaru
    // Cek jika HTTP OK DAN json.response == "200"
    if (res.ok && json.response == "200" && json.data?.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        // Ambil pesan dari json.data.message
        text: json.data.message || "Reminder berhasil dikirim.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchInitialData(); // Refresh tabel agar icon lonceng muncul
    } else {
      // Fallback error message
      throw new Error(
        json.data?.message || json.message || "Gagal mengirim reminder."
      );
    }
  } catch (err) {
    console.error("Error sending reminder:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message || "Terjadi kesalahan koneksi.",
    });
  }
}

function getApprovalStatusBadge(status) {
  const safeStatus = (status || "").toLowerCase();

  if (safeStatus === "approved") {
    return `<span class="bg-green-100 text-green-700 border border-green-300 px-2 py-1 rounded-full text-xs font-bold capitalize inline-block min-w-[80px] text-center">
              ✅ Approved
            </span>`;
  } else if (safeStatus === "pending") {
    return `<span class="bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-1 rounded-full text-xs font-bold capitalize inline-block min-w-[80px] text-center">
              ⏳ Pending
            </span>`;
  } else if (safeStatus === "rejected") {
    return `<span class="bg-red-100 text-red-700 border border-red-300 px-2 py-1 rounded-full text-xs font-bold capitalize inline-block min-w-[80px] text-center">
              ❌ Rejected
            </span>`;
  } else {
    return `<span class="text-gray-400 font-medium">-</span>`;
  }
}

// Pastikan fungsi ini ada di Global Scope (window)
window.printInvoice = async function (id) {
  // 1. Cek apakah ID valid
  if (!id || id == "0") {
    return Swal.fire(
      "Error",
      "ID Transaksi tidak ditemukan. Silakan pilih transaksi terlebih dahulu.",
      "error"
    );
  }

  try {
    // Tampilkan loading
    Swal.fire({
      title: "Memeriksa Data...",
      didOpen: () => Swal.showLoading(),
    });

    const response = await fetch(`${baseUrl}/detail/actual_costing/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();

    // --- PERBAIKAN DISINI ---
    // Sesuaikan dengan struktur JSON Actual Costing: result.data.header
    const header = result?.data?.header;

    if (!header) throw new Error("Data faktur tidak ditemukan di server.");

    // Tutup loading
    Swal.close();

    const swalResult = await Swal.fire({
      title: "Cetak Purchase Order",
      text: `Cetak PO Nomor: ${header.no_po}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Buka PDF",
      confirmButtonColor: "#3085d6",
      cancelButtonText: "Batal",
    });

    if (swalResult.isConfirmed) {
      // Buka window baru ke file print
      window.open(`purchaseorder_print.html?id=${id}`, "_blank");
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      title: "Gagal",
      text: error.message || "Terjadi kesalahan saat memuat data.",
      icon: "error",
    });
  }
};
