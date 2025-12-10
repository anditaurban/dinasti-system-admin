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

      <td class="px-6 py-4 text-sm border border-gray-200">
        <span class="font-medium sm:hidden">Project#</span>
        ${item.project_number}
      </td>

      <td class="px-6 py-4 text-sm border border-gray-200">
  <span class="font-medium sm:hidden block mb-1 text-gray-600">Project Name</span>

  <!-- Project Name + Type -->
  <div class="font-semibold text-black">
    ${item.project_name}
    <span class="text-black">(${item.project_type || "-"})</span>
  </div>

  <!-- Customer -->
  <div class="text-black mt-1">
    ${item.customer}
  </div>

  <!-- Position -->
  <div class="mt-2">
    <span
      class="px-2 py-1 rounded-full text-xs font-medium ${getPositionClass(
        item.position
      )}"
    >
      ${item.position || "-"}
    </span>
  </div>
</td>

      

      <td class="px-6 py-4 text-sm border border-gray-200 text-right">
        <span class="font-medium sm:hidden">Project Value</span>
        ${finance(item.project_value)}
      </td>

      <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 ">
      <div class="grid grid-cols-[100px_auto] gap-x-2 gap-y-1">
        <span class="font-medium">Plan(%)</span>
        <span class="text-gray-600">${item.plan_costing_percent}%</span>

        <span class="font-medium">Actual(%)</span>
        <span class="text-gray-600">${item.actual_costing_percent}%</span>

        <span class="font-medium">Margin(%)</span>
        <span class="text-gray-600">${item.margin_percent}%</span>

        <span class="font-medium">Balance(%)</span>
        <span class="text-gray-600"> ${item.balance_costing_percent}%</span>

        <span class="font-medium">Profit(%)</span>
        <span class="text-gray-600"> ${item.profit_percent}%</span>
      </div>
    </td>

      <td class="px-6 py-4 text-sm border border-gray-200 text-center">
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

function getPositionClass(position) {
  if (!position) return "bg-gray-200 text-gray-700";

  const pos = position.toLowerCase();

  if (pos.includes("direct"))
    return "bg-yellow-100 text-yellow-700 border border-yellow-300";
  if (pos.includes("sales"))
    return "bg-green-100 text-green-700 border border-green-300";

  return "bg-gray-100 text-gray-700"; // default
}
