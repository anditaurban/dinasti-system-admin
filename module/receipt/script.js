pagemodule = 'Receipt'
colSpanCount = 9;
setDataType('sales_receipt');
fetchAndUpdateData();

function validateFormData(formData, requiredFields = []) {
  console.log('Validasi Form');
  for (const { field, message } of requiredFields) {
    if (!formData[field] || formData[field].trim() === '') {
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
        const exists = Array.from(select.options).some(opt => opt.value === expectedValue?.toString());
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
  const projectValue = data.pesanan_id?.toString() || '';
  const pmValue = data.project_manager_id?.toString() || '';

  // Tunggu sampai option-nya ada
  await waitForOption('formProject', projectValue);
  await waitForOption('formPM', pmValue);

  // Set nilai ke form
  const formProject = document.getElementById('formProject');
  const formPM = document.getElementById('formPM');
  formProject.value = projectValue;
  formPM.value = pmValue;

  document.getElementById('formStartDate').value = data.start_date || '';
  document.getElementById('formDeadline').value = data.deadline || '';

  // Debug log
  console.log('[fillFormData] formProject set to:', formProject.value);
  console.log('[fillFormData] formPM set to:', formPM.value);
}


async function loadDropdown(selectId, apiUrl, valueField, labelField) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">Loading...</option>`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(`Data untuk ${selectId}:`, result);
    const listData = result.listData;

    select.innerHTML = `<option value="">Pilih...</option>`;

    if (Array.isArray(listData)) {
      listData.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[labelField];
        select.appendChild(option);
      });
    } else {
      console.error('Format listData tidak sesuai:', listData);
    }

  } catch (error) {
    console.error(`Gagal memuat data untuk ${selectId}:`, error);
    select.innerHTML = `<option value="">Gagal memuat data</option>`;
  }
}

function loadDropdownCall() {
  loadDropdown('formProject', `${baseUrl}/list/project_won/${owner_id}`, 'pesanan_id', 'project_name');
  loadDropdown('formPM', `${baseUrl}/list/project_manager/${owner_id}`, 'project_manager_id', 'name');
} 


  window.rowTemplate = function (item, index, perPage = 10) {
    const { currentPage } = state[currentDataType];
    const globalIndex = (currentPage - 1) * perPage + index + 1;
  
    return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.date}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No.Receipt</span>
      ${item.no_receipt}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">No.Faktur</span>  
    ${item.no_inv}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Akun</span>
      ${item.account}
    </td>
  
    <td class="px-6 py-4 text-right text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Jumlah</span>
      ${formatRupiah(item.nominal)}
    </td>
  
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Catatan</span>
      ${item.notes}
    </td>
  
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">PIC</span>
      ${item.pic_name}
    </td>
  
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Status</span>
      ${item.status}
    </td>

    ${item.status_id != 2 ? `
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
  
      <button onclick="event.stopPropagation(); confirmPayment('${item.receipt_id}', 2);" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
        ✅ Valid
      </button>

      <button onclick="event.stopPropagation(); confirmPayment('${item.receipt_id}', 3);" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
        ❌ Tidak Valid
      </button>
      </div>
    ` : ''}

  </tr>`;
  };
  
  document.getElementById('addButton').addEventListener('click', () => {
    showFormModal();
    loadDropdownCall();
  });

  formHtml = `
<form id="dataform" class="space-y-2">
  <!-- Project -->
  <label for="formProject" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Project</label>
  <select id="formProject" name="pesanan_id" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">Loading...</option>
  </select>

  <!-- PM (Project Manager) -->
  <label for="formPM" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Project Manager</label>
  <select id="formPM" name="project_manager_id" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 
         text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
    <option value="">Loading...</option>
  </select>

  <!-- Starting -->
  <label for="formStartDate" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Starting</label>
  <input id="formStartDate" name="start_date" type="date" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
  
  <!-- Deadline -->
  <label for="formDeadline" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Deadline</label>
  <input id="formDeadline" name="deadline" type="date" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
  
</form>

  `
requiredFields = [
    { field: 'formProject', message: 'Project Name is required!' },
    { field: 'formPM', message: 'Project Manager is required!' },
    { field: 'formStartDate', message: 'Starting Date is required!' },
    { field: 'formDeadline', message: 'Deadline is required!' }
  ];  

async function confirmPayment(receipt_id, status_value) {
  const { isConfirmed } = await Swal.fire({
    title: 'Konfirmasi Pembayaran',
    text: 'Apakah Anda yakin ingin mengonfirmasi pembayaran ini?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Konfirmasi',
    cancelButtonText: 'Batal',
  });

  if (!isConfirmed) return;

  try {
    const response = await fetch(`${baseUrl}/update/sales_receipt_status/${receipt_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({ status_id: status_value, user_id: user_id})
    });

    const result = await response.json();

    if (result?.data?.success) {
      Swal.fire({
        title: 'Berhasil!',
        text: result.data.message || 'Status berhasil diperbarui.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    fetchAndUpdateData();
    } else {
      throw new Error(result.data?.message || 'Gagal memperbarui status');
    }
  } catch (error) {
    Swal.fire({
      title: 'Gagal',
      text: error.message,
      icon: 'error',
    });
  }
}



