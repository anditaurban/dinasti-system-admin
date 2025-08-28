pagemodule = "Sales";
colSpanCount = 9;
setDataType("sales");
fetchAndUpdateData();

function validateFormData(formData, requiredFields = []) {
  console.log("Validasi Form");
  for (const { field, message } of requiredFields) {
    if (!formData[field] || formData[field].trim() === "") {
      alert(message);
      return false;
    }
  }
  return true;
}

async function loadDropdown(selectId, apiUrl, valueField, labelField) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">Loading...</option>`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    console.log(`Data untuk ${selectId}:`, result);
    const listData = result.listData;

    select.innerHTML = `<option value="">Pilih...</option>`;

    if (Array.isArray(listData)) {
      listData.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[labelField];
        select.appendChild(option);
      });
    } else {
      console.error("Format listData tidak sesuai:", listData);
    }
  } catch (error) {
    console.error(`Gagal memuat data untuk ${selectId}:`, error);
    select.innerHTML = `<option value="">Gagal memuat data</option>`;
  }
}

function loadDropdownCall() {
  loadDropdown(
    "formProject",
    `${baseUrl}/list/project_won/${owner_id}`,
    "pesanan_id",
    "project_name"
  );
  loadDropdown(
    "formPM",
    `${baseUrl}/list/project_manager/${owner_id}`,
    "project_manager_id",
    "name"
  );
}

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">${globalIndex}</td>  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.tanggal_invoice}
    </td>
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <!-- Mobile -->
      <div class="flex flex-col sm:hidden w-full">
        <div class="flex justify-between">
          <span class="font-medium">Sales#</span>
          <span class="text-gray-300">${item.no_qtn}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="font-medium"></span>
          <span class="font-medium text-right">${item.project_name}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="font-medium"></span>
          <span class="text-gray-300 text-xs text-right">${
            item.user_nama
          }</span>
        </div>
      </div>

      <!-- Desktop -->
      <div class="hidden sm:block">
        <div class="text-gray-500 text-xs">${item.no_qtn}</div>
        <div class="font-medium">${item.project_name}</div>
        <div class="text-gray-500 text-xs">${item.user_nama}</div>
      </div>
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b text-right sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Type</span>
      ${item.project_type}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b text-right sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Amount</span>
      ${formatRupiah(item.contract_amount)}
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border-b text-right sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">PPN</span>
      ${formatRupiah(item.ppn)}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Client</span>
      ${item.pelanggan_nama}
    </td>
  
    <td class="px-6 py-4 text-center text-sm text-gray-700 sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Status</span>
      <span class="${getStatusClass(
        item.status
      )} px-2 py-1 rounded-full text-xs font-medium">
        ${item.status}
      </span>
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">

  <!-- View Order -->
  <button 
    onclick="event.stopPropagation(); 
      if ('${item.project_type}' === 'Turn Key') {
        loadModuleContent('quotation_turnkey', '${item.pesanan_id}', '${
    item.no_qtn
  }');
      } else {
        loadModuleContent('quotation_detail', '${item.pesanan_id}', '${
    item.no_qtn
  }');
      }
      showVersionHistory('${item.pesanan_id}', '${item.no_qtn}');"
    class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    👁️ View Detail
  </button>

  <!-- Log -->
  <!-- Log -->
<button 
  onclick="event.stopPropagation(); 
    if ('${item.project_type}' === 'Turn Key') {
      loadModuleContent('quotation_log_turnkey', '${item.pesanan_id}', '${
    item.no_qtn
  }');
    } else {
      loadModuleContent('quotation_log_detail', '${item.pesanan_id}');
    }"
  class="block w-full text-left px-4 py-2 hover:bg-gray-100">
  🧾 Log
</button>


  <!-- Add Invoice (hanya jika WON) -->
  ${
    item.status_id === 2
      ? `<button onclick="openInvoiceModal('${item.pesanan_id}')" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600">
          ➕ Add Invoice
        </button>`
      : ""
  }

  <!-- Delete Order -->
  ${
    item.status_id !== 2
      ? `<button onclick="handleDelete('${item.pesanan_id}')" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
          🗑 Delete Order
        </button>`
      : ""
  }

</div>

    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Revision</span>
      ${`R${item.revision_number || 0}`}
    </td>
  </tr>`;
};

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

// Export ke Excel pakai SheetJS
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

function openInvoiceModal(pesananId) {
  const modal = document.getElementById("invoiceModal");
  const box = document.getElementById("invoiceBox");

  document.getElementById("invoicePesananId").value = pesananId;

  modal.classList.remove("hidden");

  // Delay biar animasi jalan
  setTimeout(() => {
    box.classList.remove("scale-90", "opacity-0");
    box.classList.add("scale-100", "opacity-100");
  }, 10);
}

function closeInvoiceModal() {
  const modal = document.getElementById("invoiceModal");
  const box = document.getElementById("invoiceBox");

  // animasi keluar
  box.classList.remove("scale-100", "opacity-100");
  box.classList.add("scale-90", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300); // sesuai duration-300
}

document
  .getElementById("invoiceForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const pesanan_id = document.getElementById("invoicePesananId").value;
    const po_number = document.getElementById("po_number").value.trim();
    const invoice_date = document.getElementById("invoice_date").value;

    if (!po_number || !invoice_date) {
      alert("PO Number dan Invoice Date wajib diisi!");
      return;
    }

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
          pesanan_id,
          po_number,
          invoice_date,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Berhasil!", "Invoice berhasil ditambahkan", "success");
        closeInvoiceModal();
        loadModuleContent("quotation"); // refresh data
      } else {
        throw new Error(data.message || "Gagal menambahkan invoice");
      }
    } catch (err) {
      Swal.fire("Error!", err.message, "error");
    }
  });

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
async function applyFilter() {
  const status = document.getElementById("filterStatus").value;
  const project = document.getElementById("filterProject").value.trim();
  const pelanggan = document.getElementById("filterPelanggan").value.trim();

  // Gabungkan jadi 1 query string (bisa pakai spasi biar fleksibel)
  let searchQuery = [status, project, pelanggan]
    .filter((v) => v !== "")
    .join(" ");

  const url = `${baseUrl}/table/sales/${owner_id}/1?search=${encodeURIComponent(
    searchQuery
  )}`;
  console.log("Filter URL:", url);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();
    console.log("Filtered Data:", data);

    // TODO: render ulang table dengan data.tableData
    renderSalesTable(data.tableData);
  } catch (err) {
    console.error("Gagal filter data:", err);
  }
}

function renderSalesTable(tableData) {
  // contoh sederhana, nanti sesuaikan sama struktur table kamu
  const tbody = document.getElementById("salesTableBody");
  tbody.innerHTML = tableData
    .map(
      (row) => `
      <tr>
        <td>${row.no_qtn}</td>
        <td>${row.project_name}</td>
        <td>${row.pelanggan_nama}</td>
        <td>${row.status}</td>
      </tr>
    `
    )
    .join("");
}

document.getElementById("addButton").addEventListener("click", async () => {
  const result = await Swal.fire({
    title: "Pilih Jenis Faktur",
    text: "Silakan pilih jenis faktur yang ingin dibuat",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "📦 Add Material",
    denyButtonText: "🔑 Add Turn Key",
    showDenyButton: true,
    cancelButtonText: "❌ Batal",
  });

  if (result.isConfirmed) {
    // === ADD MATERIAL ===
    statusLoaded = false;
    await loadModuleContent("quotation_detail");
    loadCustomerList();
    loadStatusOptions(); // status select sudah ready
    loadDetailSales(id, detail);
  } else if (result.isDenied) {
    // === ADD TURN KEY ===
    statusLoaded = false;
    await loadModuleContent("quotation_turnkey");
    loadCustomerList();
    loadStatusOptions();
    loadDetailSales(id, detail);
  }
});

formHtml = ``;
requiredFields = [
  { field: "formProject", message: "Project Name is required!" },
  { field: "formPM", message: "Project Manager is required!" },
  { field: "formStartDate", message: "Starting Date is required!" },
  { field: "formDeadline", message: "Deadline is required!" },
];
