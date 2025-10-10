pagemodule = "Project";
subpagemodule = "";
renderHeader();
colSpanCount = 5;
setDataType("project");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
    <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">

      <!-- Project Number -->
      <td class="px-6 py-4 text-sm border-b sm:border-0">
        <span class="font-medium sm:hidden">Project#</span>
        ${item.project_number}
      </td>

      <!-- Project Name -->
      <td class="px-6 py-4 text-sm border-b sm:border-0">
        <span class="font-medium sm:hidden">Project Name</span>
        ${item.project_name} - ${item.type || "-"}
        <br>${item.customer}
      </td>

      <!-- Project Value -->
      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Project Value</span>
        ${finance(item.project_value)}
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

      <!-- Status & Actions -->
      <td class="px-6 py-4 text-sm border-b sm:border-0 text-center">
        <span class="font-medium sm:hidden">Status</span>
        <span class="${getStatusClass(item.status)} px-2 py-1 rounded-full text-xs font-medium">
          ${item.status}
        </span>

        <!-- Dropdown Menu -->
        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
          <!-- View Project -->
          <button 
            onclick="event.stopPropagation(); loadModuleContent('project_detail', '${item.project_id}');" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100">
            👁️ View Project
          </button>

          <!-- Delete Project -->
          <button 
            onclick="handleDelete('${item.project_id}')" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
            🗑 Delete Project
          </button>
        </div>
      </td>

    </tr>
  `;
};


