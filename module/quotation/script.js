pagemodule = "Quotation";
subpagemodule = "";
renderHeader();
colSpanCount = 9;
setDataType("sales");
fetchAndUpdateData();

document.getElementById("addButton").addEventListener("click", async () => {
  loadModuleContent("quotation_1form");
});

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">

    <!-- Tanggal -->
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.tanggal_invoice}
    </td>

    <!-- Sales Info -->
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <!-- Mobile -->
      <div class="flex flex-col sm:hidden w-full">
        <div class="flex justify-between">
          <span class="font-medium">Sales#</span>
          <span class="font-medium text-right">${item.no_qtn} ${`R${
    item.revision_number || 0
  }`}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span></span>
          <span class="text-gray-300 text-xs text-right">${
            item.project_type
          }</span>
        </div>
        <div class="flex justify-between mt-1">
          <span></span>
          <span class="text-gray-300 text-xs text-right">${
            item.user_nama
          }</span>
        </div>
      </div>

      <!-- Desktop -->
      <div class="hidden sm:block">
        <div class="font-medium">${item.no_qtn}  ${`R${
    item.revision_number || 0
  }`}</div>
        <div class="text-gray-500 text-xs">${item.project_type}</div>
        <div class="text-gray-500 text-xs">PIC : ${item.user_nama}</div>
      </div>
    </td>

    <!-- Project Name -->
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Description</span>
      ${item.project_name}
    </td>

    <!-- Amount -->
    <td class="px-6 py-4 text-sm text-gray-700 border-b text-right sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Amount</span>
      <div class="flex flex-col items-end w-full">
        <span>${finance(item.contract_amount)}</span>
        <span class="text-xs text-gray-500">inc. Tax ${finance(item.ppn)}</span>
      </div>
    </td>

    <!-- Client -->
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Client</span>
      ${item.pelanggan_nama}
    </td>

    <!-- Status + Actions -->
    <td class="px-6 py-4 text-center text-sm text-gray-700 sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Status</span>
      <span class="${getStatusClass(
        item.status
      )} px-2 py-1 rounded-full text-xs font-medium">
        ${item.status}
      </span>

      <!-- Dropdown -->
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
  <!-- View Order -->
  <button 
    onclick="event.stopPropagation(); loadModuleContent('quotation_1form', '${
      item.pesanan_id
    }', '${item.no_qtn}');"
    class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    👁️ View Detail
  </button>

  <!-- Add Invoice (hanya jika WON) -->
  ${
    item.status_id === 3 && item.invoice != "yes"
      ? `<button onclick="openInvoiceModal('${item.pesanan_id}')" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600">
          ➕ Add Invoice
        </button>`
      : ""
  }

  <!-- Update Approval (hanya jika masih Pending) -->
  ${
    item.approval_status === "pending"
      ? `<button 
          onclick="event.stopPropagation(); openSalesApproval('${item.pesanan_id}', '${item.approved}')"
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600">
          🟢 Update Approval
        </button>`
      : ""
  }

  <!-- Update Status dan Delete Order -->
  ${
    item.status_id != 3
      ? `
      <!-- Update Status -->
      <button 
        onclick="event.stopPropagation(); openUpdateStatus('${item.pesanan_id}', '${item.status_id}')"
        class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600">
        🔄 Update Status
      </button>

      <button onclick="handleDelete('${item.pesanan_id}')" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
          🗑 Delete Order
        </button>`
      : ""
  }
</div>

    </td>

    <!-- Project Name -->
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Approval</span>
      ${item.approval_status}
    </td>
    
  </tr>`;
};

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.text("Quotation List", 14, 15);
  doc.autoTable({
    html: "#quotationTable",
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save("Quotation_List.pdf");

  Swal.fire({
    icon: "success",
    title: "Export Sukses",
    text: "Data berhasil diexport ke PDF!",
    timer: 2000,
    showConfirmButton: false,
  });
}

function exportExcel() {
  const table = document.getElementById("quotationTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Quotation" });
  XLSX.writeFile(wb, "Quotation_List.xlsx");

  Swal.fire({
    icon: "success",
    title: "Export Sukses",
    text: "Data berhasil diexport ke Excel!",
    timer: 2000,
    showConfirmButton: false,
  });
}

async function applyFilter() {
  const status = document.getElementById("filterStatus").value;

  // Gabungkan jadi 1 query string (bisa pakai spasi biar fleksibel)
  let searchQuery = [status, project, pelanggan]
    .filter((v) => v !== "")
    .join(" ");

  const url = `${baseUrl}/table/${currentDataType}/${owner_id}/1?search=${encodeURIComponent(
    searchQuery
  )}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();
    // console.log("Filtered Data:", data);

    // TODO: render ulang table dengan data.tableData
    renderSalesTable(data.tableData);
  } catch (err) {
    console.error("Gagal filter data:", err);
  }
}

async function loadStatusFilters() {
  try {
    const res = await fetch(`${baseUrl}/status/sales`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });
    const result = await res.json();

    if (res.ok && result.data?.length) {
      const menu = document.getElementById("dropdownFilterMenu");

      // Build dynamic buttons
      menu.innerHTML =
        result.data
          .map(
            (status) => `
          <button onclick="applyFilter('status=${status.status_id}')" 
            class="flex justify-between w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            <span>${status.status_sales}</span>
            <span id="status-${status.status_id}" class="font-bold">0</span>
          </button>
        `
          )
          .join("") +
        `
        <!-- Reset -->
        <button onclick="applyFilter('')" 
          class="block w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Semua</button>
      `;
    } else {
      console.warn("Status list kosong / gagal");
    }
  } catch (err) {
    console.error("Gagal ambil status sales:", err);
  }
}

// panggil saat halaman load
loadStatusFilters();

function openQuotationDetail(type, pesanan_id, no_qtn) {
  currentPesananId = pesanan_id;
  currentNoQtn = no_qtn;

  if (type === "Turn Key") {
    loadModuleContent("quotation_turnkey", pesanan_id, no_qtn);
  } else {
    loadModuleContent("quotation_detail", pesanan_id, no_qtn);
  }

  showVersionHistory(pesanan_id, no_qtn);
}

function getStatusClass(status) {
  switch (status) {
    case "On Going":
      return "bg-yellow-100 text-yellow-800 border border-yellow-400";
    case "Won":
      return "bg-green-100 text-green-800 border border-green-400";
    case "Lose":
      return "bg-red-100 text-red-800 border border-red-400";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300";
  }
}

async function openUpdateStatus(pesananId, statusId) {
  try {
    // 🔹 Ambil list status dari API pakai Bearer Token
    const res = await fetch(`${baseUrl}/status/sales`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!res.ok) throw new Error("Gagal ambil list status");
    const response = await res.json();
    const statuses = Array.isArray(response.data) ? response.data : [];

    // console.log("statusId dari row:", statusId, typeof statusId);
    // console.log("status_id dari API:", statuses.map(s => `${s.status_id} (${typeof s.status_id})`));
    // 🔹 Generate option list dengan status aktif
    const options = statuses
      .map(
        (s) =>
          `<option value="${s.status_id}" ${
            String(s.status_id) === String(statusId) ? "selected" : ""
          }>${s.status_sales}</option>`
      )
      .join("");

    // 🔹 Popup form
    const { value: formValues } = await Swal.fire({
      title: "Update Status",
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Pilih Status</label>
            <select id="statusSelect" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
              ${options}
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Komentar</label>
            <textarea id="revisionInput" rows="3" placeholder="Masukkan komentar"
              class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const status_id = document.getElementById("statusSelect").value;
        const revision_status = document
          .getElementById("revisionInput")
          .value.trim();
        if (!status_id || !revision_status) {
          Swal.showValidationMessage("Status & komentar wajib diisi");
          return false;
        }
        return { status_id: parseInt(status_id), revision_status };
      },
    });

    if (!formValues) return;

    // 🔹 Kirim update ke API
    const updateRes = await fetch(
      `${baseUrl}/update/status_sales/${pesananId}`,
      {
        method: "PUT", // ganti ke PUT jika memang API butuh PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(formValues),
      }
    );

    const result = await updateRes.json();
    if (updateRes.ok && result.response === "200") {
      Swal.fire(
        "✅ Sukses",
        result.message || "Status berhasil diupdate",
        "success"
      );

      // kalau mau reload semua
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }

      // kalau mau update status di row langsung:
      const rowStatus = document.querySelector(
        `#row-${pesananId} .statusLabel`
      );
      if (rowStatus) rowStatus.textContent = result.data.status;
    } else {
      throw new Error(result.message || "Gagal update status");
    }
  } catch (err) {
    Swal.fire("❌ Error", err.message, "error");
  }
}

async function openSalesApproval(pesananId, currentStatus = "Pending") {
  try {
    // 🔹 Popup pilihan approval
    const { value: formValues } = await Swal.fire({
      title: "Update Sales Approval",
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Pilih Status</label>
            <select id="approvalSelect" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
              <option value="no" ${
                currentStatus === "Pending" ? "selected" : ""
              }>Pending</option>
              <option value="yes" ${
                currentStatus === "Approved" ? "selected" : ""
              }>Approved</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Catatan</label>
            <textarea id="commentInput" rows="3" placeholder="Masukkan catatan (opsional)"
              class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const approved = document.getElementById("approvalSelect").value;
        const comment = document.getElementById("commentInput").value.trim();
        return { approved, comment };
      },
    });

    if (!formValues) return;

    // 🔹 Data dikirim ke API
    const bodyData = {
      pesanan_id: pesananId,
      user_id: 1, // ganti sesuai user login
      approved: formValues.approved, // yes / no
    };

    const updateRes = await fetch(
      `${baseUrl}/update/sales_approval/${pesananId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(bodyData),
      }
    );

    const result = await updateRes.json();

    if (updateRes.ok && result.response === "200") {
      Swal.fire(
        "✅ Sukses",
        result.message || "Approval berhasil diperbarui",
        "success"
      );

      // 🔹 Update tampilan status di tabel
      const rowStatus = document.querySelector(
        `#row-${pesananId} .approvalLabel`
      );
      if (rowStatus) {
        rowStatus.textContent =
          formValues.approved === "yes" ? "Approved" : "Pending";
      }

      // 🔹 Refresh tabel otomatis jika fungsi ada
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }
    } else {
      throw new Error(result.message || "Gagal memperbarui approval");
    }
  } catch (err) {
    Swal.fire("❌ Error", err.message, "error");
  }
}

async function openInvoiceModal(pesananId) {
  const { value: formValues } = await Swal.fire({
    title: "Add Invoice",
    width: "600px",
    html: `
      <form id="invoiceForm" class="space-y-4 text-left">
        <input type="hidden" id="invoicePesananId" value="${pesananId}" />
        <input type="hidden" id="inv_number" />

        <div>
          <label class="block text-sm font-medium mb-1">PO Number</label>
          <input type="text" id="po_number"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" 
            required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Invoice Date</label>
          <input type="date" id="invoice_date"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" 
            required />
        </div>
      </form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Tambah",
    cancelButtonText: "Batal",
    preConfirm: () => {
      const po_number = document.getElementById("po_number").value.trim();
      const invoice_date = document.getElementById("invoice_date").value;
      const inv_number =
        document.getElementById("inv_number").value.trim() || "";

      if (!po_number || !invoice_date) {
        Swal.showValidationMessage("PO Number dan Invoice Date wajib diisi!");
        return false;
      }

      return {
        pesanan_id: pesananId,
        po_number,
        inv_number,
        invoice_date,
      };
    },
  });

  if (formValues) {
    try {
      const res = await fetch(`${baseUrl}/add/sales_invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          owner_id,
          user_id,
          ...formValues,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Berhasil!", "Invoice berhasil ditambahkan", "success");
        loadModuleContent("quotation"); // refresh data
      } else {
        throw new Error(data.message || "Gagal menambahkan invoice");
      }
    } catch (err) {
      Swal.fire("Error!", err.message, "error");
    }
  }
}

function showImportQOModal() {
  Swal.fire({
    title: "Import Data Quotation Order",
    html: `
      <div class="flex flex-col items-start text-left w-full">
        <label for="qoFile" class="mb-2 font-medium text-gray-700">File Excel / CSV</label>
        <input 
          type="file" 
          id="qoFile" 
          accept=".xlsx, .xls, .csv" 
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
        <p class="mt-3 text-xs text-gray-500">
          Belum punya format?
          <a href="#" onclick="downloadQOTemplate(); return false;" class="text-blue-600 hover:underline font-medium">Download template QO</a>
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Import",
    cancelButtonText: "Batal",
    customClass: {
      popup: "swal2-sm",
      confirmButton:
        "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium",
      cancelButton:
        "bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium",
    },
    preConfirm: () => {
      const file = document.getElementById("qoFile").files[0];
      if (!file) {
        Swal.showValidationMessage("Pilih file terlebih dahulu!");
        return false;
      }
      return file;
    },
  }).then((result) => {
    if (result.isConfirmed) {
      handleImportQO(result.value);
    }
  });
}

async function handleImportQO(file) {
  try {
    const data = await readExcelFile(file);
    console.log("Data dari Excel:", data);

    if (!data.length) {
      Swal.fire("Gagal", "File Excel kosong atau tidak terbaca!", "error");
      return;
    }

    let sukses = 0;
    let gagal = 0;

    for (const row of data) {
      const formData = new FormData();

      // ===== Default field wajib =====
      formData.append("owner_id", user.owner_id || 1);
      formData.append("user_id", user.user_id || 1);
      formData.append("pelanggan_id", 1);
      formData.append("type_id", 1);
      formData.append("status_id", 1);
      formData.append("revision_number", 0);
      formData.append("revision_status", row["Status"] || "Draft R0");
      formData.append("revision_update", "no");

      // ===== Data dari Excel =====
      formData.append("order_date", row["Date"] || "-");
      formData.append("no_qtn", row["No_Quotation"] || "-");
      formData.append("project_name", row["Deskripsi"] || "-");
      formData.append("client", row["Client"] || "-");
      formData.append("pic_name", row["PIC"] || "-");
      formData.append("contract_amount", parseFloat(row["Amount"]) || 0);
      formData.append("disc", 0);
      formData.append("ppn", 0);
      formData.append("subtotal", parseFloat(row["Amount"]) || 0);
      formData.append("total", parseFloat(row["Amount"]) || 0);
      formData.append("catatan", row["Approval"] || "-");
      formData.append("syarat_ketentuan", "-");
      formData.append("term_pembayaran", "-");

      // ===== Default items valid =====
      const defaultItems = [
        {
          product_id: 1, // pastikan valid di DB
          product: "Default Item",
          sub_category_id: 1, // pastikan valid di DB
          sub_category: "DEFAULT CATEGORY",
          description: "-",
          qty: 0,
          unit: "-",
          unit_price: 0,
          total: 0,
          materials: [
            {
              material_id: 1,
              subItemMaterial: "Default Material",
              subItemSpec: "-",
              subItemQty: 0,
              subItemUnit: "-",
              subItemHarga: 0,
              subItemTotal: 0,
            },
          ],
        },
      ];

      // ✅ Kirim sebagai string JSON (1x stringify)
      formData.append("items", JSON.stringify(defaultItems));
      formData.append("files", JSON.stringify([]));

      console.log("Payload FormData sebelum kirim:");
      for (let [k, v] of formData.entries()) console.log(`${k}:`, v);

      // ===== Kirim ke endpoint =====
      const res = await fetch(`${baseUrl}/add/sales`, {
        method: "POST",
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        body: formData,
      });

      const result = await res.json();
      console.log("Response QO:", result);

      if (res.ok) sukses++;
      else gagal++;
    }

    Swal.fire(
      "Import Selesai",
      `✅ Berhasil import ${sukses} data, ❌ gagal ${gagal}.`,
      "success"
    );
    loadModuleContent("quotation");
  } catch (err) {
    console.error("Error import:", err);
    Swal.fire("Error", err.message || "Gagal import data!", "error");
  }
}

// =========================================================
// Fungsi baca file Excel
// =========================================================
async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      resolve(json);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
