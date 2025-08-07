pagemodule = 'Product';
colSpanCount = 9;
setDataType('product');
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
    const typeValue = data.category_id?.toString() || '';
    await waitForOption('formCategory', typeValue);
    const formType = document.getElementById('formCategory');
    formType.value = typeValue;

    const BusinessValue = data.business_category_id?.toString() || '';
    await waitForOption('formCatB', BusinessValue);
    const formCatB = document.getElementById('formCatB');
    formCatB.value = BusinessValue;    

    const unitValue = data.unit_id?.toString() || '';
    await waitForOption('formUnit', unitValue);
    const formUnit = document.getElementById('formUnit');
    formUnit.value = unitValue;

    const statusValue = data.status_id?.toString() || '';
    await waitForOption('formStatus', statusValue);
    const formStatus = document.getElementById('formStatus');
    formStatus.value = statusValue;
  
    document.getElementById('formSKU').value = data.productcode || '';
    document.getElementById('formCode').value = data.barcode || '';
    document.getElementById('formProduct').value = data.product || '';
    document.getElementById('formCogs').value = data.cogs || '';
    document.getElementById('formPrice').value = data.sale_price || '';
    document.getElementById('formWholesale').value = data.wholesale_price || '';
    document.getElementById('formLimit').value = data.limitstock || '';
    document.getElementById('formCategory').value = data.category_id || '';
    document.getElementById('formCatB').value = data.business_category_id || '';
    document.getElementById('formUnit').value = data.unit_id || '';
    document.getElementById('formStatus').value = data.status_id || '';
    document.getElementById('formDescription').value = data.description || '';
  }


async function loadDropdown(selectId, apiUrl, valueField, labelField) {
  console.log(selectId, apiUrl, valueField, labelField);
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
  loadDropdown('formCategory', `${baseUrl}/list/product_category/${owner_id}`, 'category_id', 'category');
  loadDropdown('formCatB', `${baseUrl}/list/business_category/${owner_id}`, 'business_category_id', 'business_category');
  loadDropdown('formUnit', `${baseUrl}/list/product_unit/${owner_id}`, 'unit_id', 'unit');
  loadDropdown('formStatus', `${baseUrl}/list/product_status/${owner_id}`, 'status_id', 'status');
} 


  window.rowTemplate = function (item, index, perPage = 10) {
    const { currentPage } = state[currentDataType];
    const globalIndex = (currentPage - 1) * perPage + index + 1;
  
    return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Kode</span>
      ${item.productcode}
    </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">Barang</span>  
    ${item.product}
    </td>
  
     <td class="px-6 py-4 text-sm text-center text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">Barcode</span>  
    ${item.barcode}
    </td>
  
    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Harga</span>
      ${formatRupiah(item.sale_price)}
    </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">Kategori</span>  
    ${item.category}
    </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">Stok</span>  
    ${item.stock}
    </td>
  
  
    <td class="px-6 py-4 text-sm text-center text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Kemitraan</span>
      ${item.business_category}
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
        <button onclick="event.stopPropagation(); handleEdit(${item.product_id}, '${item.product}')" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
          ✏️ Edit Product
        </button>
        <button onclick="event.stopPropagation(); handleDelete(${item.product_id})" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
          🗑 Delete Product
        </button>
      </div>
    </td>
  </tr>`;
  };
  
  

  document.getElementById('addButton').addEventListener('click', () => {
    showFormModal();
    loadDropdownCall();
  });

formHtml = `
<form id="dataform" class="grid grid-cols-1 md:grid-cols-2 gap-4">
  ${[
    { id: 'formSKU', name: 'productcode', label: 'SKU', type: 'text' },
    { id: 'formCode', name: 'barcode', label: 'Barcode', type: 'text' },
    { id: 'formProduct', name: 'product', label: 'Product', type: 'text' },
    { id: 'formCogs', name: 'cogs', label: 'COGS', type: 'text' },
    { id: 'formPrice', name: 'sale_price', label: 'Sale Price', type: 'text' },
    { id: 'formWholesale', name: 'wholesale_price', label: 'Wholesale Price', type: 'text' },
    { id: 'formLimit', name: 'limitstock', label: 'Stock Alert', type: 'text' }
  ].map(field => `
    <div>
      <label for="${field.id}" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">${field.label}</label>
      <input id="${field.id}" name="${field.name}" type="${field.type}" class="form-control w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white">
    </div>
  `).join('')}

  <div>
    <label for="formCategory" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Category</label>
    <select id="formCategory" name="category_id" class="form-control w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white">
      <option value="">Loading...</option>
    </select>
  </div>

  <div>
    <label for="formUnit" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Unit</label>
    <select id="formUnit" name="unit_id" class="form-control w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white">
      <option value="">Loading...</option>
    </select>
  </div>

  <div>
    <label for="formStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Status</label>
    <select id="formStatus" name="status_id" class="form-control w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white">
      <option value="">Loading...</option>
    </select>
  </div>

  <div>
    <label for="formCatB" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Business.Cat</label>
    <select id="formCatB" name="business_category_id" class="form-control w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white">
      <option value="">Loading...</option>
    </select>
  </div>

  <div>
    <label for="formDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Description</label>
    <textarea id="formDescription" name="description" class="form-control w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white">
    </textarea>
  </div>
</form>
`;

requiredFields = [
    { field: 'formCode', message: 'Project Name is required!' },
    { field: 'formProduct', message: 'Project Manager is required!' },
    { field: 'formPrice', message: 'Starting Date is required!' },
    { field: 'formCategory', message: 'Deadline is required!' },
    { field: 'formUnit', message: 'Deadline is required!' }
  ];  



