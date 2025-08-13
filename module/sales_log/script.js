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
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">${globalIndex}</td>  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.tanggal_invoice}
    </td>
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
  <!-- Tampilan mobile: flex layout -->
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
      <span class="text-gray-300 text-xs text-right">${item.user_nama}</span>
    </div>
  </div>

  <!-- Tampilan desktop: table layout -->
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
      <span class="font-medium sm:hidden">Amount</span>
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
      )}  px-2 py-1 rounded-full text-xs font-medium">
        ${item.status}
      </span>
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
  <!-- View Order -->
  <button onclick="event.stopPropagation(); loadModuleContent('sales_detail', '${
    item.pesanan_id
  }', '${
    item.no_qtn
  }');" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    👁️ View Order
  </button>
  <button onclick="event.stopPropagation(); loadModuleContent('sales_log', '${
    item.pesanan_id
  }',);" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    🧾 Log
  </button>

  <!-- Delete Order -->
  ${
    item.status_id !== 2
      ? `<button onclick="handleDelete('${item.pesanan_id}')" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
      🗑 Delete Order
    </button>`
      : ""
  }

</div>

    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Revision Status</span>
      ${item.revision_status}
    </td>
  </tr>`;
};

document.getElementById("addButton").addEventListener("click", async () => {
  statusLoaded = false;
  await loadModuleContent("sales_detail");
  loadStatusOptions(); // sekarang dijamin status select-nya udah ada & function-nya udah terdefinisi
});

formHtml = ``;
requiredFields = [
  { field: "formProject", message: "Project Name is required!" },
  { field: "formPM", message: "Project Manager is required!" },
  { field: "formStartDate", message: "Starting Date is required!" },
  { field: "formDeadline", message: "Deadline is required!" },
];

async function addPayment(sales_id, nominal) {
  try {
    const res = await fetch(`${baseUrl}/list/payment_method/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const { listData } = await res.json();

    if (!listData || listData.length === 0) {
      Swal.fire("Gagal", "Tidak ada metode pembayaran tersedia.", "error");
      return;
    }

    const optionsHtml = listData
      .map(
        (acc) => `
      <option value="${acc.account_id}">
        ${acc.account} - ${acc.owner_account} (${acc.number_account})
      </option>
    `
      )
      .join("");

    const { value: result } = await Swal.fire({
      title: "Add Payment",
      html: `<form id="dataform" class="space-y-2" autocomplete="off">
<strong>Total Tagihan:</strong> ${formatRupiah(nominal)}

  <label for="swal-date" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Date</label>
  <input id="swal-date" name="date" type="date" value="${
    new Date().toISOString().split("T")[0]
  }" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">

  <!-- Informasi Total Tagihan -->
  <div class="text-sm text-left text-gray-600 dark:text-gray-300">
    
  </div>

  <div class="flex items-center gap-2">
    <div class="w-full">
      <label for="swal-nominal" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Amount</label>
      <input id="swal-nominal" name="amount" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div class="mt-6">
      <label class="text-xs whitespace-nowrap">
        <input type="checkbox" id="swal-fullpay" class="mr-1">
        Full Payment
      </label>
    </div>
  </div>

  <label for="swal-account" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Account</label>
  <select id="swal-account" name="account" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 
         text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
    <option value="">--- Pilih Akun Pembayaran ---</option>
    ${optionsHtml}
  </select>

  <label for="swal-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Notes</label>
  <input id="swal-notes" name="notes" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
</form>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      didOpen: () => {
        const inputNominal = document.getElementById("swal-nominal");
        const checkboxFullpay = document.getElementById("swal-fullpay");

        function formatRupiah(value) {
          const clean = value.replace(/\D/g, "");
          return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }

        inputNominal.addEventListener("input", function () {
          this.value = formatRupiah(this.value);
        });

        checkboxFullpay.addEventListener("change", function () {
          if (this.checked) {
            inputNominal.value = formatRupiah(nominal.toString());
          } else {
            inputNominal.value = "";
          }
        });
      },
      preConfirm: () => {
        const date = document.getElementById("swal-date").value;
        const nominalRaw = document.getElementById("swal-nominal").value;
        const account_id = document.getElementById("swal-account").value;
        const notes = document.getElementById("swal-notes").value;

        const numericNominal = parseInt(nominalRaw.replace(/\./g, "")) || 0;

        if (!date || !numericNominal || !account_id) {
          Swal.showValidationMessage(
            `Tanggal, nominal, dan akun pembayaran wajib diisi.`
          );
          return false;
        }

        if (numericNominal > nominal) {
          Swal.showValidationMessage(
            `Nominal tidak boleh lebih dari Rp ${nominal.toLocaleString(
              "id-ID"
            )}`
          );
          return false;
        }

        return {
          date,
          nominal: numericNominal,
          account_id: parseInt(account_id),
          notes: notes || "-",
        };
      },
    });

    if (!result) return;

    const payload = {
      owner_id,
      sales_id,
      account_id: result.account_id,
      date: result.date,
      nominal: result.nominal,
      notes: result.notes,
    };

    const resPost = await fetch(`${baseUrl}/add/sales_detail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resPost.json();

    if (resPost.ok) {
      Swal.fire("Sukses", "Pembayaran berhasil ditambahkan.", "success");
      fetchAndUpdateData();
      // loadSalesBadge();
    } else {
      Swal.fire(
        "Gagal",
        data.message || "Terjadi kesalahan saat menyimpan pembayaran.",
        "error"
      );
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Terjadi kesalahan saat memproses.", "error");
  }
}

async function addPackage(sales_id) {
  try {
    const { value: result } = await Swal.fire({
      title: "Tambah Paket Penjualan",
      html: `
        <form id="packageForm" class="space-y-3 text-left">
          <label for="swal-date" class="block text-sm font-medium text-gray-700">Tanggal</label>
          <input id="swal-date" name="date" type="date" 
            value="${new Date().toISOString().split("T")[0]}"
            class="form-control w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">

          <label for="swal-notes" class="block text-sm font-medium text-gray-700">Catatan</label>
          <textarea id="swal-notes" name="notes"
            class="form-control w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3">Di packing ya</textarea>
        </form>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      preConfirm: () => {
        const date = document.getElementById("swal-date").value;
        const notes = document.getElementById("swal-notes").value.trim();

        if (!date) {
          Swal.showValidationMessage("Tanggal wajib diisi.");
          return false;
        }

        return { date, notes };
      },
    });

    if (!result) return;

    const payload = {
      owner_id,
      sales_id,
      date: result.date,
      notes: result.notes || "-",
    };

    const res = await fetch(`${baseUrl}/add/sales_package`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire("Sukses", "Paket berhasil ditambahkan.", "success");
      fetchAndUpdateData(); // refresh tampilan jika perlu
    } else {
      Swal.fire(
        "Gagal",
        data.message || "Terjadi kesalahan saat menambahkan paket.",
        "error"
      );
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Terjadi kesalahan saat memproses.", "error");
  }
}

document.getElementById("tanggal").addEventListener("change", generateNoQtn);
document
  .getElementById("project_type")
  .addEventListener("change", generateNoQtn);

async function generateNoQtn() {
  const tanggal = document.getElementById("tanggal").value;
  const typeId = document.getElementById("project_type").value;
  const userId = document.querySelector("input[name='user_id']").value;
  const ownerId = 100;

  if (!tanggal || !typeId) {
    document.getElementById("no_qtn").value = "";
    return;
  }

  try {
    const response = await fetch(
      "https://devdinasti.katib.cloud/generate/noqtn",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          order_date: tanggal,
          type_id: typeId,
          user_id: parseInt(userId),
          owner_id: ownerId,
        }),
      }
    );

    if (!response.ok) throw new Error("Gagal generate");

    const data = await response.json();
    document.getElementById("no_qtn").value = data.data?.no_qtn || "Gagal";
  } catch (err) {
    console.error("Error:", err);
    document.getElementById("no_qtn").value = "Error";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("project_type");
  console.log("🔍 Select element found:", select);

  try {
    const response = await fetch("https://devdinasti.katib.cloud/type/sales");
    const result = await response.json();

    console.log("📦 Fetched result:", result);

    if (result.status_response === "200" && Array.isArray(result.data)) {
      result.data.forEach((type) => {
        console.log("🧩 Adding type:", type);

        const option = document.createElement("option");
        option.value = type.kode_type.trim();
        option.textContent = type.nama_type.trim();
        select.appendChild(option);
      });
    } else {
      console.error(
        "❌ Failed to load project types:",
        result.message || result
      );
    }
  } catch (error) {
    console.error("🔥 Error fetching project types:", error);
  }
});
