// Inisialisasi
pagemodule = 'Contact';
colSpanCount = 9;
setDataType('client');
fetchAndUpdateData();

// Validasi form field wajib
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

// Isi data form untuk edit
async function fillFormData(data) {
  async function waitForOption(selectId, expectedValue, timeout = 500) {
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

  const religiValue = data.religion_id?.toString() || '';
  await waitForOption('formReligi', religiValue);
  document.getElementById('formReligi').value = religiValue;

  const citySelect = document.getElementById('formCitySelect');
  citySelect.value = String(data.region_id || '');
  console.log(data.region_id);
  const option = document.createElement('option');
  option.value = String(data.region_id);
  option.textContent = String(data.region_name || '');
  citySelect.appendChild(option);
  citySelect.value = String(data.region_id);


  document.getElementById('formID').value = data.no_membership || '';
  document.getElementById('formNama').value = data.nama || '';
  document.getElementById('formAlias').value = data.alias || '';
  document.getElementById('formPhone').value = (data.whatsapp?.toString() || '');
  document.getElementById('formEmail').value = data.email || '';
  document.getElementById('formNIK').value = data.nik || '';
  document.getElementById('formNpwp').value = data.no_npwp || '';
  document.getElementById('formBirth').value = data.birth || '';
  document.getElementById('formWeb').value = data.website || '';
  document.getElementById('formAlamat').value = data.alamat || '';
  document.getElementById('cityInput').value = data.region_name || '';
}

// Load data dropdown
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

function setupCityAutocomplete() {
  const input = document.getElementById("cityInput");
  const suggestions = document.getElementById("citySuggestions");
  const hiddenSelect = document.getElementById("formCitySelect");

  let debounceTimeout;

  input.addEventListener("input", () => {
    const keyword = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';

    if (keyword.length < 3) {
      suggestions.classList.add("hidden");
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fetchRegions(owner_id, keyword);
    }, 300); // debounce fetch untuk efisiensi
  });

  async function fetchRegions(owner_id, keyword) {
    try {
      const res = await fetch(`https://prod.katib.cloud/table/region/${owner_id}/1?search=${encodeURIComponent(keyword)}`, {
        headers: { 'Authorization': `Bearer DpacnJf3uEQeM7HN` }
      });
      const data = await res.json();
      const regionList = data.tableData || [];

      if (regionList.length === 0) {
        suggestions.classList.add("hidden");
        return;
      }

      regionList.slice(0, 10).forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.region_name;
        li.className = "px-3 py-1 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer text-sm";
        li.onclick = () => {
          input.value = item.region_name;
          hiddenSelect.innerHTML = `<option value="${item.region_id}" selected>${item.region_name}</option>`;
          suggestions.classList.add("hidden");
        };
        suggestions.appendChild(li);
      });

      suggestions.classList.remove("hidden");
    } catch (err) {
      console.error("Gagal memuat data kota:", err);
    }
  }

  // Sembunyikan jika klik di luar
  document.addEventListener("click", (e) => {
    if (!suggestions.contains(e.target) && e.target !== input) {
      suggestions.classList.add("hidden");
    }
  });
}


// Load dropdown pada modal
function loadDropdownCall() {
  loadDropdown('formReligi', `${baseUrl}/list/religion/${owner_id}`, 'religion_id', 'religion');
  setupCityAutocomplete();
  // loadDropdown('formCat', `${baseUrl}/list/business_category/${owner_id}`, 'business_category_id', 'business_category');
}

// Template baris tabel
window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
    <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
      <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
        <span class="font-medium sm:hidden">No.Member</span>${item.no_membership}
      </td>
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Nama</span>${item.nama}
      </td>
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Email</span>${item.email}
      </td>
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Whatsapp</span>${item.whatsapp}
      </td>
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Alamat</span>${item.alamat}
      </td>
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        ${item.region_name}
      </td>
      <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        ${item.business_categories.length > 0 
          ? item.business_categories.map(cat => cat.business_category).join(', ') 
          : '-'}
      </td>
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
        <button onclick="event.stopPropagation(); openBusinessCategoryForm(${item.pelanggan_id})" class="block w-full text-left px-4 py-2 hover:bg-gray-100">✏️ Add Business.Cat</button>
        <button onclick="event.stopPropagation(); handleEdit(${item.pelanggan_id}, '${item.nama}')" class="block w-full text-left px-4 py-2 hover:bg-gray-100">✏️ Edit Contact</button>
        <button onclick="event.stopPropagation(); handleDelete(${item.pelanggan_id})" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">🗑 Delete Contact</button>
      </div>
    </tr>
  `;
};

// Tombol tambah data
document.getElementById('addButton').addEventListener('click', async() => {
  showFormModal();
  loadDropdownCall();
  await loadRegionAutocomplete();
  setupCityAutocomplete();
});

// Template HTML Form
formHtml = `
<form id="dataform" class="grid grid-cols-1 md:grid-cols-2 gap-4">
  ${[
    { id: 'formID', name: 'no_membership', label: 'MemberID', type: 'text' },
    { id: 'formNama', name: 'nama', label: 'Contact Name', type: 'text' },
    { id: 'formAlias', name: 'alias', label: 'Alias', type: 'text' },
    { id: 'formPhone', name: 'whatsapp', label: 'Phone', type: 'phone' },
    { id: 'formEmail', name: 'email', label: 'Email', type: 'text' },
    { id: 'formNIK', name: 'nik', label: 'NIK', type: 'text' },
    { id: 'formNpwp', name: 'no_npwp', label: 'Tax ID', type: 'text' },
    { id: 'formBirth', name: 'birth', label: 'Birthday', type: 'date' },
    { id: 'formWeb', name: 'website', label: 'Website', type: 'text' },
    { id: 'formAlamat', name: 'alamat', label: 'Address', type: 'text' }
  ].map(field => `
    <div>
      <label for="${field.id}" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">${field.label}</label>
      <input id="${field.id}" name="${field.name}" type="${field.type}" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
  `).join('')}

  <div>
    <label for="formReligi" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Religion</label>
    <select id="formReligi" name="religion_id" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Loading...</option>
    </select>
  </div>

<div class="relative">
  <label for="cityInput" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">City</label>

  <ul id="citySuggestions"
    class="absolute bottom-full mb-1 text-left z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md w-full max-h-60 overflow-y-auto shadow-lg hidden">
  </ul>

  <input id="cityInput" name="region_name" type="text" placeholder="Ketik nama kota..."
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    autocomplete="off" />

  <select id="formCitySelect" name="region_id" class="hidden form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></select>
</div>

  
</form>
`;

// Daftar field yang wajib diisi (contoh placeholder)
requiredFields = [
  { field: 'formProject', message: 'Project Name is required!' },
  { field: 'formPM', message: 'Project Manager is required!' },
  { field: 'formStartDate', message: 'Starting Date is required!' },
  { field: 'formDeadline', message: 'Deadline is required!' }
];

async function openBusinessCategoryForm(pelanggan_id) {
  console.log('pelanggan_id:', pelanggan_id);
  try {
    Swal.fire({
      title: 'Memuat kategori...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false
    });

    // 1. Ambil detail client (untuk mengetahui kategori yang sudah ada)
    const detailResponse = await fetch(`${baseUrl}/detail/client/${pelanggan_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
const detailResult = await detailResponse.json();

if (!detailResponse.ok || !detailResult.detail || !detailResult.detail.business_categories) {
  throw new Error('Gagal memuat data pelanggan');
}

const existingCategoryIds = detailResult.detail.business_categories.map(cat => cat.business_category_id);

    // 2. Ambil semua kategori bisnis
    const listResponse = await fetch(`${baseUrl}/list/business_category/${owner_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    const listResult = await listResponse.json();
    Swal.close();

    if (!listResult.listData || !Array.isArray(listResult.listData)) {
      throw new Error('Data kategori bisnis tidak valid');
    }

    // 3. Buat HTML dengan checkbox tercentang jika sudah dimiliki
    const checkboxHtml = listResult.listData.map(item => {
      const isChecked = existingCategoryIds.includes(item.business_category_id) ? 'checked' : '';
      return `
        <div style="text-align:left; margin-bottom: 4px;">
          <label>
            <input type="checkbox" value="${item.business_category_id}" class="kategori-checkbox" ${isChecked} />
            ${item.business_category}
          </label>
        </div>
      `;
    }).join('');

    // 4. Tampilkan form kategori dengan SweetAlert
    const { isConfirmed, value: selectedCategories } = await Swal.fire({
      title: 'Pilih Kategori Bisnis',
      html: `<form id="kategoriForm">${checkboxHtml}</form>`,
      confirmButtonText: 'Simpan',
      focusConfirm: false,
      preConfirm: () => {
        const selected = Array.from(document.querySelectorAll('.kategori-checkbox:checked'))
                              .map(cb => parseInt(cb.value));
        if (selected.length === 0) {
          Swal.showValidationMessage('Minimal pilih 1 kategori bisnis');
        }
        return selected;
      },
      willClose: () => {
        document.getElementById('kategoriForm')?.remove();
      }
    });

    // 5. Kirim update jika disimpan
    if (isConfirmed && selectedCategories.length > 0) {
      console.log('Kategori dipilih:', selectedCategories);
      await updateBusinessCategory(pelanggan_id, selectedCategories);
    }

  } catch (error) {
    Swal.close();
    console.error('Gagal memuat form kategori bisnis:', error);
    Swal.fire('Gagal', error.message || 'Terjadi kesalahan saat memuat data.', 'error');
  }
}



async function updateBusinessCategory(pelanggan_id, categoryIds) {
  console.log('Kategori yang dikirim:', categoryIds);

  try {
    const response = await fetch(`${baseUrl}/update/client_business_category/${pelanggan_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({ business_category: categoryIds })
    });

    const result = await response.json();

    if (response.ok) {
      fetchAndUpdateData();
      Swal.fire('Berhasil', 'Kategori bisnis berhasil diperbarui!', 'success');
    } else {
      throw new Error(result.message || 'Gagal memperbarui kategori bisnis');
    }

  } catch (error) {
    console.error('Update error:', error);
    Swal.fire('Gagal', error.message || 'Terjadi kesalahan saat update.', 'error');
  }
}

