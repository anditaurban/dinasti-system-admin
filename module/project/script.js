pagemodule = "Project";
subpagemodule = "";
renderHeader();
colSpanCount = 5;
setDataType("project");
fetchAndUpdateData();

document.getElementById("addButton").addEventListener("click", async () => {
  setProjectModeAndLoad("add");
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
        <br>${item.customer}
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
        ${item.actual_cost_percent}%
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-right">
        <span class="font-medium sm:hidden">Margin %</span>
        ${item.margin_percent}%
      </td>

      <td class="px-6 py-4 text-sm border-b sm:border-0 text-center">
        <span class="font-medium sm:hidden">Status</span>
        <span class="${getStatusClass(
          item.status
        )} px-2 py-1 rounded-full text-xs font-medium">
          ${item.status}
        </span>

        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
          
          <button
            onclick="event.stopPropagation(); setProjectModeAndLoad('view', '${
              item.project_id
            }', '${cleanProjectName}');"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            👁️ View Project
          </button>

          ${
            // Tampilkan tombol "Update" HANYA jika 'pesanan_id' tidak ada (null, undefined, atau 0)
            !item.pesanan_id
              ? `
          <button
            onclick="event.stopPropagation(); setProjectModeAndLoad('update', '${item.project_id}', '${cleanProjectName}');"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600"
          >
            ✏️ Update Project
          </button>
          `
              : "" // Jika 'pesanan_id' ada, jangan tampilkan tombol update
          }
          <button
            onclick="handleDelete('${item.project_id}')"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            🗑 Delete Project
          </button>
        </div>
      </td>
    </tr>
  `;
};
