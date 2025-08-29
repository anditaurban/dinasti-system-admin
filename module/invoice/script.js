pagemodule = "Invoice";
colSpanCount = 9;
setDataType("sales_invoice");
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

async function fillFormData(data) {
  // Helper untuk menunggu sampai <option> tersedia
  async function waitForOption(selectId, expectedValue, timeout = 3000) {
    return new Promise((resolve) => {
      const interval = 100;
      let waited = 0;

      const check = () => {
        const select = document.getElementById(selectId);
        const exists = Array.from(select.options).some(
          (opt) => opt.value === expectedValue?.toString()
        );
        if (exists || waited >= timeout) {
          resolve();
        } else {
          waited += interval;
          setTimeout(check, interval);
        }
      };

      check();
    });
  }

  // Pastikan value bertipe string
  const projectValue = data.pesanan_id?.toString() || "";
  const pmValue = data.project_manager_id?.toString() || "";

  // Tunggu sampai option-nya ada
  await waitForOption("formProject", projectValue);
  await waitForOption("formPM", pmValue);

  // Set nilai ke form
  const formProject = document.getElementById("formProject");
  const formPM = document.getElementById("formPM");
  formProject.value = projectValue;
  formPM.value = pmValue;

  document.getElementById("formStartDate").value = data.start_date || "";
  document.getElementById("formDeadline").value = data.deadline || "";

  // Debug log
  console.log("[fillFormData] formProject set to:", formProject.value);
  console.log("[fillFormData] formPM set to:", formPM.value);
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
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.invoice_date}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No. Invoice</span>
      ${item.inv_number}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No. PO</span>  
      ${item.po_number}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Project</span>
      ${item.project_name}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Pelanggan</span>
      ${item.pelanggan_nama}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Jenis Project</span>
      ${item.project_type}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">PIC</span>
      ${item.user_nama}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Status</span>
      ${
        item.status || "Pending"
      } <!-- Assuming status might not be in the response -->
    </td>

    ${
      (item.status && item.status != 2) || !item.status
        ? `
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">

      <button 
    onclick="event.stopPropagation(); 
      if ('${item.project_type}' === 'Turn Key') {
        loadModuleContent('invoice_detail_turnkey', '${item.invoice_id}', '${item.no_qtn}');
      } else {
        loadModuleContent('invoice_detail', '${item.invoice_id}', '${item.no_qtn}');
      }
      showVersionHistory('${item.invoice_id}', '${item.no_qtn}');"
    class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    👁️ View Detail
  </button>
        <button 
          onclick="openSalesReceiptModal('${item.pesanan_id}', '${item.pelanggan_id}')"
          class="block w-full text-left px-4 py-2 hover:bg-gray-100">
          📝 Add Receipt
        </button>
      </div>
    `
        : ""
    }

  </tr>`;
};

async function confirmPaymentInvoice(invoice_id, status_value) {
  const { isConfirmed } = await Swal.fire({
    title: "Konfirmasi Pembayaran",
    text: "Apakah Anda yakin ingin mengonfirmasi pembayaran ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Konfirmasi",
    cancelButtonText: "Batal",
  });

  if (!isConfirmed) return;

  try {
    const response = await fetch(
      `${baseUrl}/update/sales_invoice_status/${invoice_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ status_id: status_value, user_id: user_id }),
      }
    );

    const result = await response.json();

    if (result?.response === "200" && result.data) {
      Swal.fire({
        title: "Berhasil!",
        text: `${result.message} (Invoice ID: ${result.data.invoice_id}, Status: ${result.data.status})`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      // refresh data tabel/list
      fetchAndUpdateData();
    } else {
      throw new Error(result.message || "Gagal memperbarui status");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("addButton")) {
    const pesananId = e.target.getAttribute("data-id");
    showFormModal();
    loadDropdownCall(pesananId);
  }
});

formHtml = `
<form id="dataform" class="space-y-2">
    <!-- Tanggal Transaksi -->
  <label for="formTanggal" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Tanggal Transaksi</label>
  <input id="formTanggal" name="tanggal_transaksi" type="date" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500">

  <!-- Nominal -->
  <label for="formNominal" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left formatNumber">Nominal</label>
  <input id="formNominal" name="nominal" type="number" placeholder="Masukkan nominal" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500 format">

  <!-- Transaction Type -->
  <label for="formType" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Transaction Type</label>
  <select id="formType" name="transaction_type" 
          class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
          rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
          focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">Pilih tipe</option>
    <option value="income">Income</option>
    <option value="expense">Expense</option>
  </select>

  <!-- Category -->
  <label for="formCategory" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Category</label>
  <input id="formCategory" name="category" type="text" placeholder="Contoh: payment" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500">

  <!-- Jenis Transaksi -->
  <label for="formJenis" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Jenis Transaksi</label>
  <input id="formJenis" name="jenis_transaksi" type="text" placeholder="Contoh: bank" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500">

  <!-- Tipe -->
  <label for="formTipe" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Tipe</label>
  <input id="formTipe" name="tipe" type="text" placeholder="Contoh: receipt" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500">

  <!-- Keterangan -->
  <label for="formKeterangan" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Keterangan</label>
  <textarea id="formKeterangan" name="keterangan" rows="2" placeholder="Tambahkan keterangan" 
            class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
            rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
            focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>

  <!-- Akun -->
  <label for="formAkun" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Akun</label>
  <input id="formAkun" name="akun" type="text" placeholder="Contoh: Bank ABC" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500">

  <!-- Nomor Rekening -->
  <label for="formRekening" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">No Rekening</label>
  <input id="formRekening" name="no_rekening" type="text" placeholder="Contoh: 123456789" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500">

  <!-- Upload File -->
  <label for="formFile" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Upload File</label>
  <input id="formFile" name="file" type="file" 
         class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
         focus:outline-none focus:ring-2 focus:ring-blue-500">
</form>
`;

requiredFields = [
  { field: "formProject", message: "Project Name is required!" },
  { field: "formPM", message: "Project Manager is required!" },
  { field: "formStartDate", message: "Starting Date is required!" },
  { field: "formDeadline", message: "Deadline is required!" },
];

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.text("Invoice List", 14, 15);
  doc.autoTable({
    html: "#invoiceTable",
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }, // biru untuk header
  });

  doc.save("Invoice_List.pdf");

  Swal.fire({
    icon: "success",
    title: "Export Sukses",
    text: "Data invoice berhasil diexport ke PDF!",
    timer: 2000,
    showConfirmButton: false,
  });
}

// Export ke Excel pakai SheetJS
function exportExcel() {
  const table = document.getElementById("invoiceTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Invoice" });
  XLSX.writeFile(wb, "Invoice_List.xlsx");

  Swal.fire({
    icon: "success",
    title: "Export Sukses",
    text: "Data invoice berhasil diexport ke Excel!",
    timer: 2000,
    showConfirmButton: false,
  });
}

async function confirmPayment(receipt_id, status_value) {
  const { isConfirmed } = await Swal.fire({
    title: "Konfirmasi Pembayaran",
    text: "Apakah Anda yakin ingin mengonfirmasi pembayaran ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Konfirmasi",
    cancelButtonText: "Batal",
  });

  if (!isConfirmed) return;

  try {
    const response = await fetch(
      `${baseUrl}/update/sales_receipt_status/${receipt_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ status_id: status_value, user_id: user_id }),
      }
    );

    const result = await response.json();

    if (result?.data?.success) {
      Swal.fire({
        title: "Berhasil!",
        text: result.data.message || "Status berhasil diperbarui.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchAndUpdateData();
    } else {
      throw new Error(result.data?.message || "Gagal memperbarui status");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}
function openSalesReceiptModal(pesananId, pelangganId) {
  const modal = document.getElementById("salesReceiptModal");
  const content = document.getElementById("salesReceiptContent");

  // Set hidden input
  document.getElementById("sr_pesanan_id").value = pesananId;
  document.getElementById("sr_pelanggan_id").value = pelangganId || "";

  // Debug biar kelihatan di console
  console.log("📌 openSalesReceiptModal()", { pesananId, pelangganId });

  modal.classList.remove("hidden");
  loadFinanceAccounts();

  setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);
}

function closeSalesReceiptModal() {
  const modal = document.getElementById("salesReceiptModal");
  const content = document.getElementById("salesReceiptContent");

  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

document
  .getElementById("salesReceiptForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Tangani file: hapus jika kosong
    const file = formData.get("file");
    if (file && file.size === 0) formData.delete("file");

    // Tangani nominal (jika ada field jumlah)
    // Tangani nominal
    const nominalField = formData.get("nominal");
    if (nominalField) {
      const nominalNumber = parseInt(nominalField.replace(/\./g, ""));
      formData.set("nominal", nominalNumber);
    }

    // Debug: lihat semua data FormData sebelum dikirim
    console.group("📌 FormData Payload to API");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(key, value.name, value.size, value.type);
      } else {
        console.log(key, value);
      }
    }
    console.groupEnd();

    try {
      const res = await fetch(`${baseUrl}/add/sales_receipt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          // Jangan set Content-Type, biarkan browser handle FormData
        },
        body: formData,
      });

      const rawText = await res.text();
      console.log("⬅️ Raw Response:", rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: rawText };
      }

      if (res.ok) {
        Swal.fire("Berhasil!", "Sales Receipt berhasil ditambahkan", "success");
        closeSalesReceiptModal();
        loadModuleContent("quotation");
      } else {
        throw new Error(data.message || "Gagal menambahkan sales receipt");
      }
    } catch (err) {
      console.error("❌ Error saat submit:", err);
      Swal.fire("Error!", err.message, "error");
    }
  });

async function loadFinanceAccounts() {
  // pastikan diganti sesuai baseUrl real
  try {
    const response = await fetch(`${baseUrl}/list/finance_accounts`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`, // kalau butuh token
      },
    });
    const result = await response.json();

    console.log("📌 API result finance_accounts:", result); // cek isi di console

    if (result.response === "200") {
      const select = document.getElementById("akun");
      if (!select) {
        console.error("⚠️ Element select#akun tidak ditemukan di modal!");
        return;
      }

      select.innerHTML = '<option value="">Pilih Akun</option>';

      const groups = {};
      result.listData.forEach((item) => {
        const group = item.tipe || "Lainnya";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
      });

      for (const [tipe, items] of Object.entries(groups)) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = tipe;
        items.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.akun_id;
          option.textContent = item.nama_akun;
          optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
      }

      console.log("✅ Akun berhasil di-load ke select");
    } else {
      console.error("⚠️ Gagal ambil data akun:", result.message);
    }
  } catch (error) {
    console.error("❌ Error fetch akun:", error);
  }
}
