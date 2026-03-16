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

  // Asumsi ada key 'tax_amount' dari API. 
  // Jika tidak ada dan harus hitung manual (misal PPN 11%), gunakan: 
  // const taxAmount = item.project_value * 0.11;
  const taxAmount = item.tax_amount || 0; 

  return `
    <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">

      <td class="px-6 py-4 text-sm border border-gray-200">
        <span class="font-medium sm:hidden">Project#</span>
        ${item.project_number}
      </td>

      <td class="px-6 py-4 text-sm border border-gray-200">
        <span class="font-medium sm:hidden block mb-1 text-gray-600">Project Name</span>

        <div class="font-semibold text-black">
          ${item.project_name}
          <span class="text-black">(${item.project_type || "-"})</span>
        </div>

        <div class="text-black mt-1">
          ${item.customer}
        </div>

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
        <div class="font-semibold text-gray-800">${finance(item.project_value)}</div>
        <div class="text-xs text-gray-500 mt-1 italic">
          inc. tax ${finance(taxAmount)}
        </div>
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
            <button
              onclick="event.stopPropagation(); sessionStorage.setItem('projectMode', 'update'); loadModuleContent('project_manual', '${item.project_id}', '${cleanProjectName}')"
              class="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              ✏️ Update Project
            </button>
          `
              : ""
          }

          ${
            item.status_id != 3
              ? `
            <button 
              onclick="event.stopPropagation(); openUpdateStatus('${item.project_id}', '${item.status_id}')"
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600">
              🔄 Update Status
            </button>`
              : ""
          }

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

async function openUpdateStatus(pesananId, statusId) {
  try {
    // 🔹 1. Ambil list status dari API
    const res = await fetch(`${baseUrl}/status/project`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!res.ok) throw new Error("Gagal ambil list status");
    const response = await res.json();
    const statuses = Array.isArray(response.data) ? response.data : [];

    // 🔹 2. Generate option list
    const options = statuses
      .map(
        (s) =>
          `<option value="${s.status_id}" ${
            String(s.status_id) === String(statusId) ? "selected" : ""
          }>${s.status_project}</option>`
      )
      .join("");

    // 🔹 3. Tampilkan Popup Form
    const { value: formValues } = await Swal.fire({
      title: "Update Status",
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Pilih Status</label>
            <select id="statusSelect" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
              ${options}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const selectedStatusId = document.getElementById("statusSelect").value;
        // const comment = document.getElementById("revisionInput").value.trim(); // Aktifkan jika API butuh komentar

        if (!selectedStatusId) {
          Swal.showValidationMessage("Status wajib dipilih");
          return false;
        }

        // Format payload sesuai permintaan API: {"status": 1}
        return { status: parseInt(selectedStatusId) };
      },
    });

    if (!formValues) return;

    // 🔹 4. Kirim Update ke API
    const updateRes = await fetch(
      `${baseUrl}/update/status/project/${pesananId}`,
      {
        method: "PUT", // Gunakan POST atau PUT sesuai yang berhasil di percobaan sebelumnya
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(formValues),
      }
    );

    const result = await updateRes.json();

    // 🔹 LOGIKA VALIDASI BARU (Menerima 200 & 201)
    const isSuccess =
      updateRes.ok &&
      (String(result.response) === "200" || String(result.response) === "201");

    if (isSuccess) {
      // Ambil pesan dari dalam object 'data' jika ada
      const msg =
        result.data?.message || result.message || "Status berhasil diupdate";

      Swal.fire("Sukses", msg, "success");

      // Refresh tabel data
      if (typeof fetchAndUpdateData === "function") {
        fetchAndUpdateData();
      }

      // Update tampilan status di baris tabel secara langsung (opsional/kosmetik)
      const statusText = document.querySelector(
        `#statusSelect option[value='${formValues.status}']`
      )?.text;
      const rowStatusLabel = document.querySelector(
        `#row-${pesananId} .statusLabel`
      ); // Sesuaikan selector ini dengan HTML tabelmu
      if (rowStatusLabel && statusText) {
        rowStatusLabel.textContent = statusText;
      }
    } else {
      throw new Error(result.message || "Gagal update status");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("❌ Error", err.message, "error");
  }
}
