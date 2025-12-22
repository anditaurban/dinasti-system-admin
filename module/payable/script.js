pagemodule = "Account Payable";
subpagemodule = "";
renderHeader();
colSpanCount = 13;
setDataType("account_payable");
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
  console.log(data);
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
  const roleValue = data.role || "";
  //   const levelValue = data.level || '';

  // Tunggu sampai option-nya ada
  await waitForOption("formRole", roleValue);
  //   await waitForOption('formLevel', levelValue);

  // Set nilai ke form
  const formRole = document.getElementById("formRole");
  //   const formLevel = document.getElementById('formLevel');
  formRole.value = roleValue;
  //   formLevel.value = levelValue;

  document.getElementById("formName").value = data.name || "";
  document.getElementById("formPhone").value = String(data.wa_login || "");
  document.getElementById("formEmail").value = data.email || "";
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
  // loadDropdown('formProject', `${baseUrl}/list/project_won/${owner_id}`, 'pesanan_id', 'project_name');
  // loadDropdown('formPM', `${baseUrl}/list/project_manager/${owner_id}`, 'project_manager_id', 'name');
}

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">  
     <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">Name</span>  
    ${item.tanggal_transaksi}
    </td>

    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
    ${item.no_po}
    </td>
  
<td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 sm:table-cell">
  <span class="font-medium sm:hidden">Email</span>
  <div class="flex flex-col">
    <div class="font-semibold">${item.project_name}</div>
    <div class="text-gray-600">${item.payable_number}</div>
    <div class="text-gray-500">${item.vendor}</div>
  </div>
</td>


  
    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      ${item.keterangan}
    </td>
  
    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      ${item.nama_akun} (${item.number_account})- ${item.owner_account}
    </td>
  
    <td class="align-top px-6 py-4 text-sm text-gray-700 text-right border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      ${finance(item.nominal)}
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">

      ${
        item.approval_status === "Approved"
          ? ""
          : `
          <button 
            onclick="event.stopPropagation(); openAccountPayableApproval('${item.payable_id}', '${item.approval_status}')"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600">
            🟢 Update Approval
          </button>
          `
      }
        
        ${
          // LOGIC REMINDER:
          // Tampilkan tombol HANYA jika status BUKAN Approved DAN approval_reminder BUKAN "reminded"
          item.approval_status !== "Approved" &&
          item.approval_reminder !== "reminded"
            ? `
          <button 
            onclick="event.stopPropagation(); sendApprovalReminder('${
              item.payable_id
            }', '${item.payable_number || item.no_po}')"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-500">
            📧 Reminder Approval
          </button>
          `
            : ""
        }

      

      </div>
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Approval</span>
      ${item.approval_status}
    </td>

  </tr>`;
};

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadDropdownCall();
});

formHtml = `
<form id="dataform" class="space-y-2">

<input type="hidden" name="app_ids[]" value="11">
<input id="formCompany" name="company" value="MKI" type="text" class="hidden form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    

  <label for="formName" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Nama</label>
  <input id="formName" name="nama" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
  

  <label for="formPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Phone</label>
  <input id="formPhone" name="phone" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">

  <label for="formEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Email</label>
  <input id="formEmail" name="email" type="email" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">



  <label for="formRole" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Role</label>
  <select id="formRole" name="role" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">Pilih Role</option>
    <option value="superadmin">Super Admin</option>
    <option value="sales">Sales</option>
    <option value="finance">Finance</option>
    <option value="packing">Packing</option>
    <option value="shipping">Shipping</option>
    <option value="viewer">Viewer</option>
  </select>

</form>

  `;
requiredFields = [
  { field: "formProject", message: "Project Name is required!" },
  { field: "formPM", message: "Project Manager is required!" },
  { field: "formStartDate", message: "Starting Date is required!" },
  { field: "formDeadline", message: "Deadline is required!" },
];

async function openAccountPayableApproval(
  payableId,
  currentStatus = "Pending"
) {
  try {
    // 🔹 Popup pilihan approval
    const { value: formValues } = await Swal.fire({
      title: "Update Account Payable Approval",
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

    // 🔹 Data untuk Body Request
    const bodyData = {
      // Perhatikan: walau di URL sudah ada ID, biasanya body tetap dikirim jika backend butuh
      payable_id: payableId,
      user_id: user.user_id, // Pastikan variabel user ini tersedia
      approved: formValues.approved, // mengirim "yes" atau "no"
    };

    // 🔹 Kirim request ke Endpoint Baru
    // URL: .../update/account_payable_approval/{id}
    const updateRes = await fetch(
      `${baseUrl}/update/account_payable_approval/${payableId}`,
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

    // 🔹 Validasi Response sesuai Gambar Postman
    // Gambar menunjukkan: result.response = "200" dan data sukses ada di result.data
    if (updateRes.ok && result.response === "200") {
      // Ambil pesan dari result.data.message (sesuai gambar)
      const successMessage = result.data
        ? result.data.message
        : "Data successfully updated";

      Swal.fire("✅ Sukses", successMessage, "success");

      // 🔹 Update tampilan langsung di tabel (DOM)
      const rowStatus = document.querySelector(
        `#row-${payableId} .approvalLabel`
      );
      if (rowStatus) {
        // Update teks visual
        rowStatus.textContent =
          formValues.approved === "yes" ? "Approved" : "Pending";

        // Opsional: Update warna badge jika perlu
        rowStatus.className = `approvalLabel px-2 py-1 rounded text-xs font-semibold ${
          formValues.approved === "yes"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`;
      }

      // 🔹 Auto-refresh data tabel (jika fungsi tersedia)
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }
    } else {
      // Handle error jika message ada di dalam data atau root
      const errorMsg =
        result.data?.message || result.message || "Gagal memperbarui approval";
      throw new Error(errorMsg);
    }
  } catch (err) {
    Swal.fire("❌ Error", err.message, "error");
  }
}

async function sendApprovalReminder(payableId, identifier) {
  // 1. Konfirmasi User
  const confirmResult = await Swal.fire({
    title: "Kirim Reminder Approval?",
    text: `Akan mengirim notifikasi reminder untuk AP: ${identifier}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Kirim",
    cancelButtonText: "Batal",
    confirmButtonColor: "#f97316", // Warna orange
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
    // Endpoint: {{baseUrl}}/reminder/account_payable_approval/{{payableId}}
    const res = await fetch(
      `${baseUrl}/reminder/account_payable_approval/${payableId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

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

      // 5. Refresh data tabel agar tombol menghilang (karena status berubah jadi reminded)
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }
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
