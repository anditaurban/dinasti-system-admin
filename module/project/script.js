pagemodule = "project";
colSpanCount = 9;
setDataType("project");
fetchAndUpdateData();

document.getElementById("addButton").addEventListener("click", async () => {
  await loadModuleContent("project_detail");
  //   showFormModal();
  //   loadDetailProject(id, detail);
  loadProjectManagers();
  loadProjects();
});

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">

    <!-- Index -->

    <!-- Project Number -->
    <td class="px-6 py-4 text-sm border-b sm:border-0">
      <span class="font-medium sm:hidden">Project#</span>
      ${item.project_number}
    </td>

    <!-- Project Name -->
    <td class="px-6 py-4 text-sm border-b sm:border-0">
      <span class="font-medium sm:hidden">Project Name</span>
      ${item.project_name}
    </td>

    <!-- Type -->
    <td class="px-6 py-4 text-sm border-b sm:border-0">
      <span class="font-medium sm:hidden">Type</span>
      ${item.type || "-"}
    </td>

    <!-- Customer -->
    <td class="px-6 py-4 text-sm border-b sm:border-0">
      <span class="font-medium sm:hidden">Customer</span>
      ${item.customer}
    </td>

    <!-- Project Value -->
    <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
      <span class="font-medium sm:hidden">Project Value</span>
      ${formatRupiah(item.project_value)}
    </td>

    <!-- Plan Costing % -->
    <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
      <span class="font-medium sm:hidden">Plan Costing %</span>
      ${item.plan_costing_percent}%
    </td>

    <!-- Actual Cost % -->
    <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
      <span class="font-medium sm:hidden">Actual Cost %</span>
      ${item.actual_cost_percent}%
    </td>

    <!-- Margin % -->
    <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
      <span class="font-medium sm:hidden">Margin %</span>
      ${item.margin_percent}%
    </td>

    <!-- Status -->
    <td class="px-6 py-4 text-sm border-b sm:border-0 text-center">
      <span class="font-medium sm:hidden">Status</span>
      <span class="${getStatusClass(
        item.status
      )} px-2 py-1 rounded-full text-xs font-medium">
        ${item.status}
      </span>
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
  <!-- View Order -->
 <button onclick="event.stopPropagation(); loadModuleContent('project_detail', '${
   item.project_id
 }');" 
    class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    👁️ View Order
</button>
  <button onclick="event.stopPropagation(); loadModuleContent('sales_log_detail', '${
    item.pesanan_id
  }');" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    🧾 Log
  </button>

  <!-- Delete Order -->
  ${
    item.status_id !== 2
      ? `<button onclick="(event) => { event.stopPropagation(); loadModuleContent('sales_log_detail', '${item.pesanan_id}'); }" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
      🗑 Delete Order
    </button>`
      : ""
  }

</div>
    </td>

  </tr>`;
};

// formHtml = `
// <form id="dataform" class="space-y-4 text-center">

//   <div>
//     <select id="projectManager" name="project_manager_id"
//       class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700">
//       <option value="">Pilih Project Manager</option>
//       <option value="100">Manager 1</option>
//       <option value="101">Manager 2</option>
//       <!-- Tambah data dari API jika diperlukan -->
//     </select>
//   </div>

//   <div>
//     <select id="description" name="description"
//       class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700">
//       <option value="">Pilih Deskripsi</option>
//       <option value="SAMPLE1">SAMPLE1</option>
//       <option value="SAMPLE2">SAMPLE2</option>
//       <option value="SAMPLE3">SAMPLE3</option>
//       <!-- Bisa diisi dinamis juga -->
//     </select>
//   </div>

//   <div>
//     <input id="contractValue" name="contract_value" type="number" placeholder="Nilai Kontrak (Rp)"
//       class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
//   </div>

//   <div>
//     <input id="planCosting" name="plan_costing" type="number" placeholder="Perkiraan Biaya (Rp)"
//       class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
//   </div>

//   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//     <div>
//       <label for="startDate" class="block text-left text-sm font-medium text-gray-700">
//         Start Date <span class="text-red-500">*</span>
//       </label>
//       <input id="startDate" name="start_date" type="date"
//         class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
//     </div>

//     <div>
//       <label for="finishDate" class="block text-left text-sm font-medium text-gray-700">
//         Finish Date <span class="text-red-500">*</span>
//       </label>
//       <input id="finishDate" name="finish_date" type="date"
//         class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
//     </div>
//   </div>
// </form>
// `;

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
