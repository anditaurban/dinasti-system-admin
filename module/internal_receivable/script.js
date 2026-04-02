pagemodule = "Internal Receivable";
subpagemodule = "";
renderHeader();
colSpanCount = 13;
setDataType("internal_receivable");
fetchAndUpdateData();



window.rowTemplate = function (item, index, perPage = 10) {
  return `
  <tr class="flex flex-col sm:table-row border-b border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition">
    
    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
       <div class="text-gray-900 line-clamp-2">${item.receivable_date}</div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-bold text-gray-900 line-clamp-2">${item.employee}</div>
        <div class="text-xs text-gray-500">Category: ${item.category}</div>
      </div>
    </td>
    
    
    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="text-gray-700 line-clamp-3">${item.information}</div>
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow-lg z-50 text-sm right-0 mt-2 py-1">
            
            <button onclick="event.stopPropagation(); handleEdit('${
            item.internal_receivable_id
          }', '${item.information}')" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100" data-id="${
              item.internal_receivable_id
            }">✏️ Edit Data</button>
            <button 
  onclick="event.stopPropagation(); window.currentReceivableId = '${item.internal_receivable_id}'; loadModuleContent('internal_receipt', '${item.internal_receivable_id}');"
  class="block w-full text-left px-4 py-2 hover:bg-gray-100">
  👁️ View Detail
</button>
          <button onclick="event.stopPropagation(); handleDelete(${
            item.internal_receivable_id
          })" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
            🗑 Delete Data
          </button>
        </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      
        <div class="text-gray-900 line-clamp-2">${finance(item.nominal)}</div>
      
    </td>

    <td class="align-middle px-4 py-3 text-center sm:table-cell">
    
      <span class="text-xs font-bold px-2 py-1 rounded ${
        item.status === "Paid"
          ? "text-green-700 bg-green-100"
          : "text-red-600 bg-red-100"
      }">
        ${item.status.toUpperCase()}
      </span>
    </td>

  </tr>`;
};



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
  let source = data.detail ? data.detail : data;
  const item = Array.isArray(source) ? source[0] : source;

  console.log("🔄 Isi form dengan data (Edit Mode):", item);

  // 1. Logic User ID
  let userId = item.user_id;
  if (!userId || userId == 0 || userId == "0") {
    const userSessionStr = localStorage.getItem("user");
    if (userSessionStr) {
      try {
        const userSession = JSON.parse(userSessionStr);
        userId = userSession.user_id;
      } catch (e) {
        userId = "";
      }
    } else {
      userId = "";
    }
  }

  // 2. Set Hidden Inputs
  const formId = document.getElementById("formId");
  if (formId) formId.value = item.internal_receivable_id || "";

  const formUserId = document.getElementById("formUserId");
  if (formUserId) formUserId.value = userId;

  const formStatusId = document.getElementById("formStatusId");
  if (formStatusId) formStatusId.value = item.status_id || 1;

  // JIKA DATA DROPDOWN BELUM ADA, KITA LOAD DULU SECARA PAKSA SAAT EDIT
  await loadCategories();
  await loadEmployees();

  // 3. Set Value Dropdown
  // Pastikan key dari item cocok dengan JSON (employee_id & category_id)
  const employeeValue = item.employee_id ? String(item.employee_id) : "";
  const categoryValue = item.category_id ? String(item.category_id) : "";

  const formEmployee = document.getElementById("formEmployee");
  if (formEmployee) formEmployee.value = employeeValue;

  const formCategory = document.getElementById("formCategory");
  if (formCategory) formCategory.value = categoryValue;

  // 4. Set Value Input Teks/Tanggal
  const formTanggal = document.getElementById("formTanggal");
  if (formTanggal) formTanggal.value = item.receivable_date || "";

  const formNominal = document.getElementById("formNominal");
  if (formNominal) formNominal.value = item.nominal || "";

  const formKeterangan = document.getElementById("formKeterangan");
  if (formKeterangan) formKeterangan.value = item.information || "";
}

async function loadCategories() {
  const selectCategory = document.getElementById("formCategory");
  
  try {
    const response = await fetch(`${baseUrl}/list/income_category/${owner_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();

    selectCategory.innerHTML = '<option value="">-- Pilih Kategori --</option>';

    if (data.listData && data.listData.length > 0) {
      data.listData.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.category_id;
        option.textContent = item.category;
        selectCategory.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Gagal memuat data kategori:", error);
    selectCategory.innerHTML = '<option value="">Gagal memuat data</option>';
  }
}

async function loadEmployees() {
  const selectEmployee = document.getElementById("formEmployee");
  
  try {
    const response = await fetch(`${baseUrl}/list/employee/${owner_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();

    selectEmployee.innerHTML = '<option value="">-- Pilih Karyawan --</option>';

    if (data.listData && data.listData.length > 0) {
      data.listData.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.employee_id;
        
        const roleText = item.role ? ` - ${item.role}` : '';
        option.textContent = `${item.name}${roleText}`;
        
        selectEmployee.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Gagal memuat data karyawan:", error);
    selectEmployee.innerHTML = '<option value="">Gagal memuat data</option>';
  }
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


document.getElementById("addButton").addEventListener("click", () => {
  showFormModal(); // Pastikan modal muncul dulu agar elemen HTML ada di DOM
  loadCategories();
  loadEmployees();
  loadAccountOptions();

  // 3. PASANG LISTENER KE INPUT SEARCH
  const searchInput = document.getElementById("formProjectSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      handleProjectSearch(e.target.value);
    });
  }
});

// Update formHtml agar sesuai dengan modul AR
formHtml = `
<div class="px-2">
  <form id="dataform" class="space-y-5">
    <input type="hidden" id="formId" name="internal_receivable_id">
    <input type="hidden" id="formUserId" name="user_id">
    <input type="hidden" id="formStatusId" name="status_id">

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">Karyawan <span class="text-red-500">*</span></label>
      <select id="formEmployee" name="employee_id" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none bg-no-repeat bg-right pr-10"
              style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E'); background-size: 1.25rem;">
        <option value="">-- Pilih Karyawan --</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">Kategori <span class="text-red-500">*</span></label>
      <select id="formCategory" name="category_id" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none bg-no-repeat bg-right pr-10"
              style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E'); background-size: 1.25rem;">
        <option value="">-- Pilih Kategori --</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">Tanggal Transaksi <span class="text-red-500">*</span></label>
      <input id="formTanggal" name="receivable_date" type="date" 
             class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm">
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">Nominal <span class="text-red-500">*</span></label>
      <input id="formNominal" name="nominal" type="number" 
             class="w-full px-4 py-2.5 border border-gray-300 rounded-md" 
             placeholder="0">
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">Deskripsi <span class="text-red-500">*</span></label>
      <textarea id="formKeterangan" name="information" rows="3" 
                class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                placeholder="Masukkan keterangan pinjaman/transaksi..."></textarea>
    </div>
  </form>
</div>
`;
 requiredFields = [
  { field: "employee_id", message: "Karyawan wajib dipilih!" },
  { field: "category_id", message: "Kategori wajib dipilih!" },
  { field: "receivable_date", message: "Tanggal Transaksi wajib diisi!" },
  { field: "nominal", message: "Nominal wajib diisi!" },
  { field: "information", message: "Deskripsi wajib diisi!" },
];

