pagemodule = "Project";
subpagemodule = "";
renderHeader();
colSpanCount = 5;
setDataType("project");
fetchAndUpdateData();

document.getElementById("addButton").addEventListener("click", async () => {
  sessionStorage.setItem("projectMode", "create");
  loadModuleContent("project_manual");
});
function setProjectModeAndLoad(mode, id = null, desc = null) {
  sessionStorage.setItem("projectMode", mode);
  loadModuleContent("project_detail", id, desc); // <-- Tambahkan 'desc'
}

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;
  const cleanProjectName = item.project_name.replace(/'/g, "\\'");

  return `
    <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">

      <td class="px-6 py-4 text-sm border-b sm:border-0">
        <span class="font-medium sm:hidden">Project#</span>
        ${item.project_number}
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0">
        <span class="font-medium sm:hidden">Project Name</span>
        ${item.project_name} - (${item.project_type || "-"})
        <br>${item.customer}<br>${item.position}
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Project Value</span>
        ${finance(item.project_value)}
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Plan Costing %</span>
        ${item.plan_costing_percent}%
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Actual Cost %</span>
        ${item.actual_costing_percent}%
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Margin %</span>
        ${item.margin_percent}%
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Balance %</span>
        ${item.balance_costing_percent}%
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Profit %</span>
        ${item.profit_percent}%
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-center">
        <span class="font-medium sm:hidden">Status</span>
        <span class="${getStatusClass(
          item.status
        )} px-2 py-1 rounded-full text-xs font-medium">
          ${item.status}
        </span>

        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">

    <!-- View Project -->
    <button
      onclick="event.stopPropagation(); loadModuleContent('project_detail', '${
        item.project_id
      }', '${cleanProjectName}')"
      class="block w-full text-left px-4 py-2 hover:bg-gray-100"
    >
      👁️ View Project
    </button>

    ${
      !item.pesanan_id
        ? `
      <!-- Update Project -->
      <button
        onclick="event.stopPropagation(); sessionStorage.setItem('projectMode', 'update'); loadModuleContent('project_manual', '${item.project_id}', '${cleanProjectName}')"
        class="block w-full text-left px-4 py-2 hover:bg-gray-100"
      >
        ✏️ Update Project
      </button>
    `
        : ""
    }

    <!-- Delete Project -->
    <button
      onclick="event.stopPropagation(); handleDelete('${item.project_id}')"
      class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
    >
      🗑 Delete Project
    </button>

</div>

      </td>
    </tr>
  `;
};
