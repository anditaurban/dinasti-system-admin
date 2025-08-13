pagemodule = "project";
colSpanCount = 9;
setDataType("project");
fetchAndUpdateData();

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadDropdownCall();
});

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50 relative group">

    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Project Number</span>  
      ${item.project_number}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Description</span>  
      ${item.project_name}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Type</span>  
      ${item.type}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Customer</span>  
      ${item.customer}
    </td>

    <td class="px-6 py-4 text-sm text-left text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Project Value</span>  
      Rp ${item.project_value}
    </td>

    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Plan Costing (%)</span>  
      ${item.plan_costing_percent}%
    </td>

    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Actual Cost (%)</span>  
      ${item.actual_cost_percent}%
    </td>

    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Margin (%)</span>  
      ${item.margin_percent}%
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
        ${item.status}
      </span>
      <!-- Dropdown trigger -->
      <button class="sm:hidden text-gray-500 hover:text-gray-700 ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </td>

    <!-- Dropdown menu (hidden by default) -->
    <td class="absolute right-0 top-full sm:top-auto sm:relative hidden group-hover:block sm:group-hover:hidden bg-white shadow-lg rounded-md z-10 w-48 sm:w-auto sm:px-6 sm:py-4">
      <div class="py-1">
        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</a>
        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Delete</a>
        <div class="border-t border-gray-100"></div>
        <a href="#" class="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100">Set On Going</a>
        <a href="#" class="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100">Set Won</a>
        <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Set Lose</a>
      </div>
    </td>
  </tr>`;
};

formHtml = `
<form id="dataform" class="space-y-4 text-center">

  <div>
    <select id="projectManager" name="project_manager_id"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700">
      <option value="">Pilih Project Manager</option>
      <option value="100">Manager 1</option>
      <option value="101">Manager 2</option>
      <!-- Tambah data dari API jika diperlukan -->
    </select>
  </div>

  <div>
    <select id="description" name="description"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700">
      <option value="">Pilih Deskripsi</option>
      <option value="SAMPLE1">SAMPLE1</option>
      <option value="SAMPLE2">SAMPLE2</option>
      <option value="SAMPLE3">SAMPLE3</option>
      <!-- Bisa diisi dinamis juga -->
    </select>
  </div>

  <div>
    <input id="contractValue" name="contract_value" type="number" placeholder="Nilai Kontrak (Rp)"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
  </div>

  <div>
    <input id="planCosting" name="plan_costing" type="number" placeholder="Perkiraan Biaya (Rp)"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label for="startDate" class="block text-left text-sm font-medium text-gray-700">
        Start Date <span class="text-red-500">*</span>
      </label>
      <input id="startDate" name="start_date" type="date"
        class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
    </div>

    <div>
      <label for="finishDate" class="block text-left text-sm font-medium text-gray-700">
        Finish Date <span class="text-red-500">*</span>
      </label>
      <input id="finishDate" name="finish_date" type="date"
        class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
    </div>
  </div>
</form>
`;

document.querySelectorAll("tr button").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = button.closest("tr").querySelector("td:last-child");
    dropdown.classList.toggle("hidden");
  });
});

// Close dropdowns when clicking elsewhere
document.addEventListener("click", () => {
  document.querySelectorAll("td.absolute").forEach((dropdown) => {
    dropdown.classList.add("hidden");
  });
});
