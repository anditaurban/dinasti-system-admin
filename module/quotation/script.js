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
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50" id="row-${
    item.pesanan_id
  }">

    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.tanggal_invoice}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
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

      <div class="hidden sm:block">
        <div class="font-medium">${item.no_qtn}  ${`R${
          item.revision_number || 0
        }`}</div>
        <div class="text-gray-500 text-xs">${item.project_type}</div>
        <div class="text-gray-500 text-xs">PIC : ${item.user_nama}</div>
      </div>
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      
  <span class="font-medium sm:hidden">Description</span>
  ${item.project_name}
  ${
    item.internal_notes &&
    item.internal_notes.trim() !== "" &&
    item.internal_notes.trim() !== "-"
      ? `<div class="text-gray-500 text-xs">${item.internal_notes}</div>`
      : ``
  }
</td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b text-right sm:border-0 flex justify-between sm:table-cell">
      <div class="flex flex-col items-end w-full">
        <span>${finance(item.contract_amount)}</span>
        <span class="text-xs text-gray-500">inc. Tax ${finance(item.ppn)}</span>
      </div>
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Client</span>
      ${item.pelanggan_nama}
    </td>

    <td class="px-6 py-4 text-center text-sm text-gray-700 sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Status</span>
      
      <div class="flex flex-col items-end sm:items-center w-full">
        <span class="${getStatusClass(
          item.status,
        )} px-2 py-1 rounded-full text-xs font-medium statusLabel">
            ${item.status}
        </span>
      </div>

      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm text-left">
          <button onclick="event.stopPropagation(); loadModuleContent('quotation_1form', '${
            item.pesanan_id
          }', '${
            item.no_qtn
          }');" class="block w-full text-left px-4 py-2 hover:bg-gray-100"> 
            👁️ View Detail 
          </button>

          ${
            item.status_id === 3 && item.invoice != "yes"
              ? `<button onclick="openInvoiceModal('${item.pesanan_id}')" 
                  class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600">
                  ➕ Add Invoice
                </button>`
              : ""
          }

          ${
            item.approval_status === "pending"
              ? `
                <button 
                  onclick="event.stopPropagation(); openSalesApproval('${item.pesanan_id}', '${item.approved}')"
                  class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600">
                  🟢 Update Approval
                </button>
                `
              : ""
          }

          ${
            // Tombol Reminder HANYA jika status pending DAN belum di-remind
            item.approval_status === "pending" &&
            item.approval_reminder !== "reminded"
              ? `
                <button 
                  onclick="event.stopPropagation(); sendApprovalReminder('${item.pesanan_id}', '${item.no_qtn}')"
                  class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-500">
                  📧 Reminder Approval
                </button>
                `
              : ""
          } 

          ${
            item.status_id != 3
              ? `
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

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell align-top">
      <span class="font-medium sm:hidden">Approval</span>
      
      <div class="flex flex-col sm:items-center items-end gap-1">
        
        <div class="approvalLabel">
            ${getApprovalStatusBadge(item.approval_status)}
        </div>

        ${
          item.approved_by &&
          item.approval_status &&
          item.approval_status.toLowerCase() === "approved"
            ? `<div class="text-[10px] sm:text-xs text-gray-500 mt-1 whitespace-nowrap">
                 by <span class="font-semibold text-gray-700">${item.approved_by}</span>
               </div>`
            : ""
        }

        ${
          item.approval_reminder === "reminded" &&
          item.approval_status === "pending"
            ? `<div class="flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full mt-1" title="Reminder Sent">
                 <span class="text-[10px] font-bold">🔔 Reminded</span>
               </div>`
            : ""
        }
        
      </div>
    </td>
    
  </tr>`;
};

// ==========================================
// Helper Function (Tambahkan di bawah rowTemplate)
// ==========================================
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
    searchQuery,
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
        `,
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
          }>${s.status_sales}</option>`,
      )
      .join("");

    // 🔹 Popup form
    const { value: formValues } = await Swal.fire({
      title: "Update Status",
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Pilih Status <span class="text-red-500">*</span></label>
            <select id="statusSelect" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
              ${options}
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Komentar <span class="text-red-500">*</span></label>
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
      },
    );

    const result = await updateRes.json();
    if (updateRes.ok && result.response === "200") {
      Swal.fire(
        "✅ Sukses",
        result.message || "Status berhasil diupdate",
        "success",
      );

      // kalau mau reload semua
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }

      // kalau mau update status di row langsung:
      const rowStatus = document.querySelector(
        `#row-${pesananId} .statusLabel`,
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
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const approved = document.getElementById("approvalSelect").value;
        if (!approved) {
          Swal.showValidationMessage("Silakan pilih status approval");
          return false;
        }
        return { approved };
      },
    });

    if (!formValues) return;

    // 🔹 Data untuk API
    const bodyData = {
      pesanan_id: pesananId,
      user_id: user.user_id, // ganti sesuai user login
      approved: formValues.approved, // yes / no
    };

    // 🔹 Kirim request ke API
    const updateRes = await fetch(
      `${baseUrl}/update/sales_approval/${pesananId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(bodyData),
      },
    );

    const result = await updateRes.json();

    if (updateRes.ok && result.response === "200") {
      Swal.fire(
        "✅ Sukses",
        result.message || "Approval berhasil diperbarui",
        "success",
      );

      // 🔹 Update tampilan langsung di tabel
      const rowStatus = document.querySelector(
        `#row-${pesananId} .approvalLabel`,
      );
      if (rowStatus) {
        rowStatus.textContent =
          formValues.approved === "yes" ? "Approved" : "Pending";
      }

      // 🔹 Auto-refresh data tabel
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
          <label class="block text-sm font-medium mb-1">PO Number <span class="text-red-500">*</span></label>
          <input type="text" id="po_number"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" 
            required />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Invoice Date <span class="text-red-500">*</span></label>
              <input type="date" id="invoice_date"
                class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" 
                required />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Due Date</label>
              <input type="date" id="due_date"
                class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" 
                />
            </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Purchase Order Date <span class="text-red-500">*</span></label>
          <input type="date" id="po_date"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" 
            required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Internal Notes</label>
          <textarea id="internal_notes" rows="3"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" 
            placeholder="Catatan internal..."></textarea>
        </div>
      </form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Tambah",
    cancelButtonText: "Batal",
    preConfirm: () => {
      // Ambil value dari element
      const po_number = document.getElementById("po_number").value.trim();
      const invoice_date = document.getElementById("invoice_date").value;
      const due_date = document.getElementById("due_date").value; // Ambil Due Date
      const po_date = document.getElementById("po_date").value;
      const internal_notes = document
        .getElementById("internal_notes")
        .value.trim(); // Ambil Internal Notes
      const inv_number =
        document.getElementById("inv_number").value.trim() || "";

      // Validasi (tambahkan due_date jika wajib diisi)
      if (!po_number || !invoice_date || !po_date) {
        Swal.showValidationMessage(
          "PO Number, Invoice Date, Due Date, dan PO Date wajib diisi!",
        );
        return false;
      }

      // Return object dengan key baru
      return {
        pesanan_id: pesananId,
        po_number,
        inv_number,
        invoice_date,
        due_date, // Key baru
        po_date,
        internal_notes, // Key baru
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
          ...formValues, // Ini akan otomatis menyertakan due_date dan internal_notes
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
    title: "Import Data QO",
    html: `
      <div class="flex flex-col items-start text-left w-full">
        <label for="excelFileQO" class="mb-2 font-medium text-gray-700">File Excel</label>
        <input 
          type="file" 
          id="excelFileQO" 
          accept=".xlsx, .xls" 
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
        <p class="mt-3 text-xs text-gray-500">
          Belum punya format? 
          <a href="#" onclick="downloadQOTemplate(); return false;" class="text-blue-600 hover:underline font-medium">Download template Excel</a>
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
      const file = document.getElementById("excelFileQO").files[0];
      if (!file) {
        Swal.showValidationMessage("Pilih file Excel terlebih dahulu!");
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

// =========================================================
// BARU: Fungsi untuk Download Template Excel
// =========================================================
function downloadQOTemplate() {
  try {
    const wb = XLSX.utils.book_new();

    const infoHeader = [
      "QO_date",
      "auto",
      "project_type",
      "project_name",
      "client (harus sesuai database)",
      "PIC_Client (harus sesuai database)",
      "Tax", // <-- Nama kolom diubah dari "Tax (Yes/No)" jadi "Tax"
      "Diskon_TotalAmount",
    ];

    const infoSample = [
      {
        QO_date: "2025-05-25",
        auto: "DEI.0525/001",
        project_type: "Material",
        project_name: "Pengadaan Grounding",
        "client (harus sesuai database)": "PT Schneider Indonesia",
        "PIC_Client (harus sesuai database)": "Pak Samudra",
        Tax: 5500, // Contoh: Isi langsung nominal pajaknya (11% dari harga atau fix)
        Diskon_TotalAmount: 0,
      },
    ];

    const wsInfo = XLSX.utils.json_to_sheet(infoSample, { header: infoHeader });
    XLSX.utils.book_append_sheet(wb, wsInfo, "info_QO");

    // ... (Sheet isi_QO tetap sama)

    XLSX.writeFile(wb, "Template_Import_QO_Final.xlsx");
  } catch (err) {
    console.error("Gagal membuat template:", err);
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

      // FIX: Cek apakah elemen ada sebelum akses innerHTML
      if (!menu) return;

      menu.innerHTML =
        result.data
          .map(
            (status) => `
          <button onclick="applyFilter('status=${status.status_id}')" 
            class="flex justify-between w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            <span>${status.status_sales}</span>
            <span id="status-${status.status_id}" class="font-bold">0</span>
          </button>
        `,
          )
          .join("") +
        `
        <button onclick="applyFilter('')" 
          class="block w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Semua</button>
      `;
    }
  } catch (err) {
    console.error("Gagal ambil status sales:", err);
  }
}

// =========================================================
// DIMODIFIKASI: Fungsi Handler Import
// =========================================================
async function handleImportQO(file) {
  try {
    const sheets = await readExcelFile(file);
    const infoData = sheets["info_QO"] || [];
    const isiData = sheets["isi_QO"] || []; // Data detail dari excel

    if (!infoData.length) {
      Swal.fire("Gagal", "Sheet 'info_QO' tidak ditemukan!", "error");
      return;
    }

    let sukses = 0;
    let gagal = 0;

    for (const info of infoData) {
      if (!info["auto"] && !info["project_name"]) continue;

      const qoKey = info["auto"];

      // Mapping type_id
      let typeId = 1;
      const projectTypeStr = (info["project_type"] || "").toUpperCase();
      if (projectTypeStr.includes("MATERIAL")) typeId = 1;
      else if (projectTypeStr.includes("JASA")) typeId = 2;
      else if (projectTypeStr.includes("TURN KEY")) typeId = 3;

      // PEMETAAN ITEMS (Disesuaikan dengan format baru Anda)
      const items = isiData
        .filter((item) => item["QO"] === qoKey)
        .map((item) => ({
          product: item["Product"] || "", // Key diganti dari 'product_name' ke 'product'
          sub_category_id: parseInt(item["sub_category_id"]) || 0, // Key baru
          description: item["Deskripsi"] || "",
          qty: Number(item["Qty"]) || 0,
          unit: item["unit"] || "",
          unit_price: Number(item["unit_price"]) || 0,
          // Materials dibikin array kosong jika import standar excel biasa
          // Kecuali jika Anda ingin parsing string JSON di kolom khusus excel
          materials: item["materials_json"]
            ? JSON.parse(item["materials_json"])
            : [],
        }));

      const payload = {
        owner_id: owner_id,
        user_id: user_id,
        type_id: typeId,
        order_date: info["QO_date"] || "",
        no_qtn: String(info["auto"] || ""),
        project_type: info["project_type"] || "",
        project_name: info["project_name"] || "",
        client: info["client (harus sesuai database)"] || "",
        pic_name: info["PIC_Client (harus sesuai database)"] || "",
        ppn: parseFloat(info["Tax"]) || 0, // Menggunakan key 'ppn'
        discount: parseFloat(info["Diskon_TotalAmount"]) || 0,
        items: JSON.stringify(items), // Dibungkus stringify agar aman saat pengiriman text
      };

      const res = await fetch(`${baseUrl}/add/sales_import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) sukses++;
      else gagal++;
    }

    Swal.fire(
      "Import Selesai",
      `✅ Berhasil: ${sukses} | ❌ Gagal: ${gagal}`,
      "info",
    );
    if (sukses > 0) fetchAndUpdateData();
  } catch (err) {
    console.error("Crash saat import:", err);
    Swal.fire("Error", "Gagal memproses struktur items baru.", "error");
  }
}

// =========================================================
// Fungsi baca file Excel (TIDAK BERUBAH)
// =========================================================
async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const allSheetsData = {};
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        // defval: "" memastikan sel kosong dibaca sebagai string kosong
        allSheetsData[sheetName] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });
      });

      resolve(allSheetsData);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function sendApprovalReminder(pesananId, noQtn) {
  // 1. Konfirmasi User
  const confirmResult = await Swal.fire({
    title: "Kirim Reminder Approval?",
    text: `Akan mengirim notifikasi reminder untuk Sales Order: ${noQtn}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Kirim",
    cancelButtonText: "Batal",
    confirmButtonColor: "#f97316", // Warna orange sesuai tombol
  });

  if (!confirmResult.isConfirmed) return;

  // 2. Tampilkan Loading
  Swal.fire({
    title: "Mengirim Reminder...",
    html: "Mohon tunggu sebentar...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    // 3. Request ke API
    // Endpoint: {{baseUrl}}/reminder/sales_approval/{{pesananId}}
    const res = await fetch(`${baseUrl}/reminder/sales_approval/${pesananId}`, {
      method: "PUT", // Menggunakan POST karena ini memicu aksi (trigger email/notif)
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();

    // 4. Validasi Response
    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: result.message || "Reminder approval berhasil dikirim.",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      throw new Error(result.message || "Gagal mengirim reminder.");
    }
  } catch (err) {
    console.error("Error sending reminder:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message || "Terjadi kesalahan saat menghubungi server.",
    });
  }
}
