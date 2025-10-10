pagemodule = "Employee";
colSpanCount = 6;
setDataType("employee");
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
  console.log("🔄 Isi form dengan data:", data);
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
  const roleValue = data.role_id || '';
  const levelValue = data.level_id || '';

  await waitForOption('formRole', roleValue);
  await waitForOption('formLevel', levelValue);

  const formRole = document.getElementById('formRole');
  const formLevel = document.getElementById('formLevel');

  // Hidden owner_id
  document.querySelector("input[name='owner_id']").value = data.owner_id || "1";

  // Isi field form sesuai API baru
  document.getElementById("formName").value = data.name || "";
  document.getElementById("formAlias").value = data.alias || "";
  document.getElementById("formEmail").value = data.email || "";
  document.getElementById("formLevel").value = data.level_id || "";
  document.getElementById("formRole").value = data.role_id || "";
  document.getElementById("formPhone").value = data.phone || "";
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
  loadDropdown('formRole', `${baseUrl}/list/role/${owner_id}`, 'role_id', 'role');
  loadDropdown('formLevel', `${baseUrl}/list/level/${owner_id}`, 'level_id', 'level');
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

  <!-- Hidden owner_id -->
  <input type="hidden" name="owner_id" value="1">

  <label for="formName" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Nama</label>
  <input id="formName" name="name" type="text" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formAlias" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Alias</label>
  <input id="formAlias" name="alias" type="text" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Email</label>
  <input id="formEmail" name="email" type="email" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formLevel" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Level</label>
  <select id="formLevel" name="level_id" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    <option value="">-- Pilih Level --</option>
  </select>

  <label for="formRole" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Role</label>
  <select id="formRole" name="role_id" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    <option value="">-- Pilih Role --</option>
  </select>

  <label for="formPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Phone</label>
  <input id="formPhone" name="phone" type="text" 
    class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

</form>
`;

requiredFields = [
  { field: "name", message: "Nama wajib diisi!" },
  { field: "alias", message: "Alias wajib diisi!" },
  { field: "email", message: "Email wajib diisi!" },
  { field: "level_id", message: "Level wajib dipilih!" },
  { field: "role_id", message: "Role wajib dipilih!" },
  { field: "phone", message: "Nomor Telepon wajib diisi!" },
];
