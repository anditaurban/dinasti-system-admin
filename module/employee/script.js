pagemodule = "Employee";
colSpanCount = 6;
setDataType("employee");
renderHeader();
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
    "formRole",
    `${baseUrl}/list/role/${owner_id}`,
    "role_id",
    "role",
  );
  loadDropdown(
    "formLevel",
    `${baseUrl}/list/level/${owner_id}`,
    "level_id",
    "level",
  );
}

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Name</span>  
        ${item.name} ${item.alias ? `(${item.alias})` : ""}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Level</span>
        ${item.level || "-"}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Role</span>
        ${item.role || "-"}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Email</span>
        ${item.email || "-"}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Phone</span>
        ${item.phone || "-"}
        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
          <button onclick="event.stopPropagation(); handleEdit('${
            item.employee_id
          }', '${item.name}')" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100" data-id="${
              item.employee_id
            }">✏️ Edit Employee</button>
          <button onclick="event.stopPropagation(); handleDelete(${
            item.employee_id
          })" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
            🗑 Delete Employee
          </button>
        </div>
     </td>
  </tr>`;
};

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadDropdownCall();
});

formHtml = `
<form id="dataform" class="space-y-2">

  <input type="hidden" name="owner_id" value="1">

  <label for="formName" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Nama <span class="text-red-500">*</span></label>
  <input id="formName" name="name" type="text" placeholder="Masukkan nama lengkap"
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formAlias" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Alias <span class="text-red-500">*</span></label>
  <input id="formAlias" name="alias" type="text" placeholder="Nama panggilan / alias"
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>
  

  <label for="formEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Email <span class="text-red-500">*</span></label>
  <input id="formEmail" name="email" type="email" placeholder="contoh@email.com"
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Phone <span class="text-red-500">*</span></label>
  <input id="formPhone" name="phone" type="text" placeholder="Contoh: 0812xxxxxxxx"
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formLevel" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Level <span class="text-red-500">*</span></label>
  <select id="formLevel" name="level_id" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    <option value="" disabled selected>-- Pilih Level --</option>
  </select>

  <label for="formRole" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Role <span class="text-red-500">*</span></label>
  <select id="formRole" name="role_id" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    <option value="" disabled selected>-- Pilih Role --</option>
  </select>


</form>
`;

requiredFields = [
  { field: "formName", message: "Nama wajib diisi!" },
  { field: "formAlias", message: "Alias wajib diisi!" },
  { field: "formEmail", message: "Email wajib diisi!" },
  { field: "formPhone", message: "Nomor Telepon wajib diisi!" },
  { field: "formLevel", message: "Level wajib dipilih!" },
  { field: "formRole", message: "Role wajib dipilih!" },
];
