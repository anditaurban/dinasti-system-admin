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
  const fileCount = item.file_count || 0;
  const filesEncoded = encodeURIComponent(JSON.stringify(item.files || []));

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
      <div class="flex flex-col group items-start">
        <span>${item.project_name}</span>
        <div class="flex items-center gap-2 mt-1">
          <div class="text-gray-500 text-xs italic">
            ${(item.internal_notes && item.internal_notes.trim() !== "" && item.internal_notes.trim() !== "-") 
                ? item.internal_notes 
                : '<span class="text-gray-300">No notes...</span>'}
          </div>
          <button onclick="event.stopPropagation(); openEditNotes('${item.pesanan_id}', \`${item.internal_notes || ''}\`, '${item.status_id}')" class="text-blue-400 hover:text-blue-600 transition-colors" title="Edit Internal Notes">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        
        <button id="btn-lampiran-${item.pesanan_id}" data-files="${filesEncoded}" onclick="event.stopPropagation(); openLampiranModal('${item.pesanan_id}', '${item.owner_id || 1}')" class="mt-2 flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition">
  📎 <span id="count-${item.pesanan_id}"></span> Lampiran
  <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
</button>
      </div>
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

         ${item.status_id === 3 && item.invoice !== "yes" 
      ? `<button onclick="openInvoiceModal('${item.pesanan_id}')" 
                 class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600">
            ➕ Add Invoice
         </button>` 
      : ""
    }

    ${item.project_id === 0
      ? `<button onclick="openCreateProject('${item.pesanan_id}', '${item.contract_amount}')"
                 class="block w-full text-left px-4 py-2 hover:bg-gray-100">
            📝 Create Project
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
          item.approval_status === "pending"
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
        ? `<button 
            onclick="event.stopPropagation(); openUpdateStatus('${item.pesanan_id}', '${item.status_id}','${item.internal_notes}')"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600">
            🔄 Update Status
          </button>` 
        : ""
    }

             ${
      (item.status_id != 3 || Number(item.contract_amount) === 0)
        ? `<button onclick="handleDelete('${item.pesanan_id}')" 
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
          item.approval_reminder && item.approval_status === "pending"
            ? `<div class="flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full mt-1" title="Reminder Sent">
                <span class="text-[10px] font-bold capitalize">🔔 ${item.approval_reminder}</span>
              </div>`
            : ""
        }
                
      </div>
    </td>
    
  </tr>`;
};


async function openEditNotes(pesananId, currentNotes) {
  try {
    const { value: notes } = await Swal.fire({
      title: "Edit Internal Notes",
      html: `
        <div class="text-left">
          <label class="block text-sm text-gray-600 mb-1 font-medium">Internal Notes</label>
          <textarea id="notesInput" rows="4" placeholder="Masukkan catatan internal"
            class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm">${currentNotes === 'null' || !currentNotes ? '' : currentNotes}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const input = document.getElementById("notesInput").value.trim();
        if (!input) {
          Swal.showValidationMessage("Catatan tidak boleh kosong");
          return false;
        }
        return input;
      },
    });

    if (!notes) return;

    // Loading State
    Swal.fire({ 
      title: 'Updating...', 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });

    // Sesuaikan dengan API: /update/internal_notes_sales/{id}
    const updateRes = await fetch(`${baseUrl}/update/internal_notes_sales/${pesananId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      // Body hanya mengirimkan internal_notes sesuai foto Postman
      body: JSON.stringify({ 
        internal_notes: notes 
      }),
    });

    const result = await updateRes.json();

    // Cek response "200" sesuai format API Anda
    if (updateRes.ok && result.response === "200") {
      Swal.fire("Berhasil", "Catatan internal telah diperbarui", "success");

      // Refresh data table agar perubahan langsung terlihat
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }
    } else {
      throw new Error(result.message || "Gagal memperbarui catatan");
    }
  } catch (err) {
    Swal.fire("❌ Error", err.message, "error");
  }
}

async function openCreateProject(pesanan_id, nilai_kontrak) {
  // ambil daftar project manager
  let pmOptions = "";
  try {
    const res = await fetch(`${baseUrl}/list/project_manager/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();

    if (data.listData && data.listData.length > 0) {
      pmOptions = data.listData
        .map(
          (pm) =>
            `<option value="${pm.employee_id}">${pm.name} (${pm.alias})</option>`
        )
        .join("");
    }
  } catch (err) {
    console.error("Gagal ambil PM:", err);
    pmOptions = `<option value="">Gagal load PM</option>`;
  }

  Swal.fire({
    title: "Buat Project Baru",
    html: `
      <div class="space-y-3 text-left">
        <label class="block text-sm font-medium text-gray-700">Project Manager</label>
        <select id="project_manager_id" class="w-full p-2 border rounded-lg">
          ${pmOptions}
        </select>

        <label class="block text-sm font-medium text-gray-700">Start Date</label>
        <input id="start_date" type="date" class="w-full p-2 border rounded-lg">

        <label class="block text-sm font-medium text-gray-700">Finish Date</label>
        <input id="finish_date" type="date" class="w-full p-2 border rounded-lg">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    preConfirm: async () => {
      const project_manager_id =
        document.getElementById("project_manager_id").value;
      const start_date = document.getElementById("start_date").value;
      const finish_date = document.getElementById("finish_date").value;

      try {
        const res = await fetch(`${baseUrl}/add/project`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`,
          },
          body: JSON.stringify({
            pesanan_id,
            project_manager_id: Number(project_manager_id),
            start_date,
            finish_date,
          }),
        });

        const data = await res.json();
        if (data.data.success === true) {
          Swal.fire(
            "Sukses",
            data.data.message || "Project berhasil dibuat",
            "success"
          );
        loadModuleContent("quotation");
        } else {
          Swal.fire(
            "Gagal",
            data.data.message || "Gagal membuat project",
            "error"
          );
        }
      } catch (err) {
        console.error("Error create project:", err);
        Swal.fire("Error", "Terjadi kesalahan server", "error");
      }
    },
  });
}

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

async function openUpdateStatus(pesananId, statusId, internal_notes = "") {
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
              class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">${internal_notes}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const status_id = document.getElementById("statusSelect").value;
        const internal_notes = document
          .getElementById("revisionInput")
          .value.trim();
        if (!status_id || !internal_notes) {
          Swal.showValidationMessage("Status & komentar wajib diisi");
          return false;
        }
        return { status_id: parseInt(status_id), internal_notes: internal_notes };
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
  const confirmResult = await Swal.fire({
    title: "Kirim Reminder Approval?",
    text: `Akan mengirim notifikasi reminder untuk Sales Order: ${noQtn}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Kirim",
    cancelButtonText: "Batal",
    confirmButtonColor: "#f97316",
  });

  if (!confirmResult.isConfirmed) return;

  Swal.fire({
    title: "Mengirim Reminder...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(`${baseUrl}/reminder/sales_approval/${pesananId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: result.message || "Reminder berhasil dikirim.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh data agar teks "Reminded 1st", "2nd" muncul
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }
    } else {
      throw new Error(result.message || "Gagal mengirim reminder.");
    }
  } catch (err) {
    Swal.fire("❌ Error", err.message, "error");
  }
}


// ==========================================
// FITUR MODAL LAMPIRAN DOKUMEN (SWEETALERT & ASYNC)
// ==========================================
async function openLampiranModal(pesananId, ownerId) {
  // Buka modal dengan status "Memuat data..." di bagian list
  Swal.fire({
    title: 'Lampiran Dokumen',
    width: '750px',
    showConfirmButton: false,
    showCloseButton: true,
    html: `
      <div class="flex flex-col md:flex-row gap-6 text-left mt-4 border-t pt-4">
        <div class="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4">
          <h4 class="text-xs font-bold text-gray-500 mb-3 tracking-wider">☁️ UPLOAD DOKUMEN</h4>
          <form id="formUploadLampiran" onsubmit="prosesUploadLampiran(event, '${pesananId}', '${ownerId}')">
            <input type="file" id="inputLampiranFile" class="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 border border-gray-300 rounded mb-3 cursor-pointer" required>
            <button type="submit" id="btnSubmitLampiran" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-xs font-medium transition shadow-sm">
              Upload File
            </button>
            <p class="text-[10px] text-gray-400 mt-2">*Max 2MB (PNG, JPG, JPEG & PDF)</p>
          </form>
        </div>

        <div class="w-full md:w-7/12 md:pl-2">
          <h4 class="text-xs font-bold text-gray-500 mb-3 tracking-wider">📁 FILE TERSIMPAN</h4>
          <div id="containerListLampiran" class="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
            <p class="text-xs text-blue-500 animate-pulse">Mencari file di database...</p>
          </div>
        </div>
      </div>
    `,
    didOpen: async () => {
      // SETELAH MODAL TERBUKA, KITA FETCH DATA LANGSUNG KE DATABASE
      try {
        const response = await fetch(`${baseUrl}/list/quotation_file/${pesananId}`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const result = await response.json();
        
        const container = document.getElementById('containerListLampiran');
        
        // Cek apakah API merespon sukses dan data listData ada
        if (result.success && result.listData) {
          // Render HTML berdasarkan data dari database
          container.innerHTML = generateListLampiranHTML(result.listData, pesananId);
          
          // UPDATE JUGA ANGKA DI TABEL LUAR BIAR SINKRON
          const countSpan = document.getElementById(`count-${pesananId}`);
          if (countSpan) {
            countSpan.innerText = result.listData.length;
          }
        } else {
          // Kalau response API kosong
          container.innerHTML = generateListLampiranHTML([], pesananId);
        }
      } catch (err) {
        console.error("Gagal load lampiran:", err);
        document.getElementById('containerListLampiran').innerHTML = `<span class="text-xs text-red-500">Koneksi error. Gagal menarik data.</span>`;
      }
    }
  });
}

function generateListLampiranHTML(files, pesananId) {
  if (!files || files.length === 0) {
    return `<span class="text-sm text-gray-400 italic" id="empty-lampiran-${pesananId}">Belum ada file tersimpan.</span>`;
  }

  return files.map(file => {
    const ext = file.file ? file.file.split('.').pop().toLowerCase() : 'file';
    const isPdf = ext === 'pdf';
    // Ambil nama file dari URL untuk tampilan
    const fileName = file.file ? file.file.split('/').pop() : 'Dokumen';

    return `
      <div class="flex items-center justify-between gap-2 border border-gray-200 rounded p-2 bg-gray-50 shadow-sm w-full hover:border-blue-300 transition group">
        <div class="flex items-center gap-2 truncate">
          <span class="${isPdf ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} text-[10px] font-bold px-2 py-1 rounded uppercase min-w-[40px] text-center">
            ${isPdf ? 'PDF' : 'IMG'}
          </span>
          <a href="${file.file}" target="_blank" class="text-xs text-gray-700 truncate hover:text-blue-600 font-medium" title="${fileName}">
            ${fileName}
          </a>
        </div>
        <button onclick="hapusLampiran('${file.id}', '${pesananId}')" class="text-gray-400 hover:text-red-600 transition-colors p-1" title="Hapus File">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

async function hapusLampiran(fileId, pesananId) {
  const result = await Swal.fire({
    title: 'Hapus file?',
    text: "File yang dihapus tidak dapat dikembalikan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: "Menghapus...",
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const response = await fetch(`${baseUrl}/delete/quotation_file/${fileId}`, {
        method: 'DELETE', // Atau POST tergantung dokumentasi API kamu
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "File berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false
        });

        // Refresh data setelah hapus
        if (typeof fetchAndUpdateData === "function") {
          fetchAndUpdateData();
        }
      } else {
        throw new Error("Gagal menghapus file.");
      }
    } catch (error) {
      Swal.fire("Gagal!", error.message, "error");
    }
  }
}

async function refreshLampiranList(pesananId) {
  const container = document.getElementById('containerListLampiran');
  container.innerHTML = `<p class="text-xs text-blue-500 animate-pulse">Memperbarui daftar...</p>`;

  try {
    const response = await fetch(`${baseUrl}/list/quotation_file/${pesananId}`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
    const result = await response.json();

    if (result.success) {
      // Update isi container dengan data terbaru dari API
      // Pastikan format map disesuaikan dengan response API (menggunakan result.listData)
      container.innerHTML = generateListLampiranHTML(result.listData, pesananId);
      
      // Opsional: Update juga atribut di tombol utama agar sinkron
      const btn = document.getElementById(`btn-lampiran-${pesananId}`);
      if (btn) {
        btn.setAttribute('data-files', encodeURIComponent(JSON.stringify(result.listData)));
      }
    }
  } catch (e) {
    container.innerHTML = `<span class="text-xs text-red-500">Gagal memuat ulang data.</span>`;
  }
}


async function prosesUploadLampiran(event, pesananId, ownerId) {
  event.preventDefault();
  const fileInput = document.getElementById('inputLampiranFile');

  if (fileInput.files.length === 0) return;
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append('owner_id', ownerId); 
  formData.append('quotation_id', pesananId);
  formData.append('file', file);

  try {
    // Munculkan loading alert (otomatis menimpa/menutup modal HTML)
    Swal.fire({
      title: "Uploading...",
      text: "Mohon tunggu sebentar",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const response = await fetch(`${baseUrl}/add/quotation_file`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }, 
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      // Alert sukses persis kaya yang kamu kirim
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "File dokumen berhasil ditambahkan!",
        timer: 1500,
        showConfirmButton: false,
      });

      refreshLampiranList(pesananId);

      // Refresh data tabel di background
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }
    } else {
      // Lempar ke catch kalau dari API ngasih error message
      throw new Error(result.message || "Gagal upload file.");
    }
  } catch (error) {
    console.error(error);
    // Alert gagal
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: error.message || "Koneksi bermasalah atau server error.",
      showConfirmButton: true,
    });
  }
}
async function loadAllAttachmentCounts() {
  // Cari semua elemen span yang punya ID berawalan "count-"
  const countElements = document.querySelectorAll('span[id^="count-"]');
  
  for (const element of countElements) {
    // Ambil pesanan_id dari ID elemen (contoh: "count-346" -> "346")
    const pesananId = element.id.split('-')[1];
    
    try {
      const response = await fetch(`${baseUrl}/list/quotation_file/${pesananId}`, {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      });
      const result = await response.json();
      
      if (result.success && result.listData) {
        // Update angka 0 menjadi jumlah file yang sebenarnya
        element.innerText = result.listData.length;
      }
    } catch (e) {
      console.error(`Gagal memuat count untuk ${pesananId}`, e);
    }
  }
}