// Set Header
pagemodule = "Project";
subpagemodule = "Project Costing";
renderHeader();

var projectId = window.detail_id;

(async function initDetail() {
  Swal.fire({ title: "Memuat Data...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${baseUrl}/detail/project/${projectId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();
    projectDetailData = json.detail;
    const data = projectDetailData;

    document.getElementById("projectNameDisplay").textContent = `${
      data.project_name
    } (${data.project_number || "-"})`;
    document.getElementById("projectAmount").innerHTML = finance(
      data.project_value
    );
    document.getElementById("plan_costing").innerHTML = finance(
      data.plan_costing
    );
    document.getElementById("actual_costing").innerHTML = finance(
      data.actual_cost
    );
    document.getElementById("margin").innerHTML = finance(data.margin);

    document.getElementById("detailNoQO").textContent = data.no_qtn || "---";
    document.getElementById("detailNoInv").textContent =
      data.inv_number || "---";
    document.getElementById("detailNoPO").textContent = data.po_number || "---";
    document.getElementById("detailPIC").textContent =
      data.project_manager_name || data.pic_name || "---";

    const tbody = document.getElementById("tabelItemView");
    tbody.innerHTML = "";

    if (data.items?.length) {
      const groups = {};
      data.items.forEach((item) => {
        if (!groups[item.sub_category]) groups[item.sub_category] = [];
        groups[item.sub_category].push(item);
      });

      let nomor = 1;
      Object.keys(groups).forEach((subCat) => {
        const trHeader = document.createElement("tr");
        trHeader.className = "bg-gray-200 font-bold text-gray-700";
        trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase">${
          subCat || "-"
        }</td>`;
        tbody.appendChild(trHeader);

        groups[subCat].forEach((item) => {
          const tr = document.createElement("tr");
          tr.className = "border-b bg-gray-50";
          tr.dataset.itemId = item.project_item_id;
          tr.innerHTML = `
                        <td class="px-3 py-2 align-top font-semibold text-center">${nomor++}</td>
                        <td class="px-3 py-2 align-top"><div class="font-medium text-gray-800">${
                          item.product
                        }</div><div class="text-xs text-gray-500">${
            item.description || ""
          }</div></td>
                        ${
                          item.materials?.length
                            ? `<td colspan="6" class="text-gray-400 text-xs italic px-3 py-2 text-center">Rincian di sub-item</td>`
                            : `
                        <td class="px-3 py-2 text-right align-top">${
                          item.qty
                        }</td>
                        <td class="px-3 py-2 text-center align-top">${
                          item.unit
                        }</td>
                        <td class="px-3 py-2 text-right align-top">${finance(
                          item.unit_price
                        )}</td>
                        <td class="px-3 py-2 text-right align-top">${finance(
                          item.item_total
                        )}</td>
                        <td class="px-3 py-2 text-center align-top"><input class="plancosting text-right border px-2 py-1 w-full rounded focus:outline-none focus:ring-1 focus:ring-blue-500" value="${finance(
                          item.plan_total
                        )}"></td>
                        <td class="px-3 py-2 text-center align-top">
                            <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
                                <span>${finance(item.actual_total)}</span>
                                <button class="view-actual-cost-btn hover:text-red-800" data-korelasi="${
                                  item.product
                                }" title="Lihat Detail"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg></button>
                            </div>
                        </td>
                        `
                        }
                    `;
          tbody.appendChild(tr);

          if (item.materials?.length) {
            item.materials.forEach((m, idx) => {
              const subTr = document.createElement("tr");
              subTr.className = "border-b bg-white text-sm";
              subTr.dataset.materialId = m.project_materials_id;
              subTr.innerHTML = `
                                <td></td>
                                <td class="px-3 py-1 italic pl-8 text-gray-600">${
                                  idx + 1
                                }. ${m.name}</td>
                                <td class="px-3 py-1 text-right">${m.qty}</td>
                                <td class="px-3 py-1 text-center">${m.unit}</td>
                                <td class="px-3 py-1 text-right">${finance(
                                  m.unit_price
                                )}</td>
                                <td class="px-3 py-1 text-right">${finance(
                                  m.material_total
                                )}</td>
                                <td class="px-3 py-1 text-center"><input class="plancosting text-right border px-2 py-1 w-full rounded" value="${finance(
                                  m.plan_total
                                )}"></td>
                                <td class="px-3 py-1 text-center">
                                    <div class="flex items-center justify-end gap-2 text-red-600 font-bold">
                                        <span>${finance(m.actual_total)}</span>
                                        <button class="view-actual-cost-btn hover:text-red-800" data-korelasi="${
                                          item.product
                                        }" data-material-name="${
                m.name
              }" title="Lihat Detail"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg></button>
                                    </div>
                                </td>
                            `;
              tbody.appendChild(subTr);
            });
          }
        });
      });
    }

    tbody.querySelectorAll(".plancosting").forEach((input) => {
      input.addEventListener("input", (e) => {
        e.target.value = finance(e.target.value.replace(/\D/g, ""));
      });
    });

    document.getElementById("saveAllPlanCostBtn").onclick =
      handleUpdateAllPlanCosting;

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".view-actual-cost-btn");
      if (btn)
        showActualCostDetail(btn.dataset.korelasi, btn.dataset.materialName);
    });

    Swal.close();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal load data", "error");
  }
})();

// --- FUNCTIONS ---

async function handleUpdateAllPlanCosting() {
  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });
  const payload = { items: [] };
  const tableBody = document.getElementById("tabelItemView");

  projectDetailData.items.forEach((item) => {
    const itemRow = tableBody.querySelector(
      `tr[data-item-id="${item.project_item_id}"]`
    );
    if (!itemRow) return;

    const itemPayload = {
      project_item_id: item.project_item_id,
      plan_total: 0,
      materials: [],
    };

    if (item.materials?.length > 0) {
      item.materials.forEach((m) => {
        const matRow = tableBody.querySelector(
          `tr[data-material-id="${m.project_materials_id}"]`
        );
        if (matRow) {
          const val = parseRupiah(matRow.querySelector(".plancosting").value);
          itemPayload.materials.push({
            project_materials_id: m.project_materials_id,
            plan_total: val,
          });
        }
      });
    } else {
      const val = parseRupiah(itemRow.querySelector(".plancosting").value);
      itemPayload.plan_total = val;
    }
    payload.items.push(itemPayload);
  });

  try {
    const res = await fetch(`${baseUrl}/update/plan_costing/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      Swal.fire("Berhasil", "Plan Costing Updated", "success");
      loadModuleContent("project_detail", projectId, window.detail_desc);
    } else {
      throw new Error(json.message);
    }
  } catch (e) {
    Swal.fire("Error", e.message, "error");
  }
}

function showActualCostDetail(korelasiPekerjaan, korelasiMaterial) {
  const item = projectDetailData.items.find(
    (i) => i.product === korelasiPekerjaan
  );
  let details = [];
  let title = `Detail: ${korelasiPekerjaan}`;

  if (korelasiMaterial) {
    title += ` - ${korelasiMaterial}`;
    const mat = item.materials.find((m) => m.name === korelasiMaterial);
    if (mat && mat.actuals) details = mat.actuals;
  } else {
    if (item.materials?.length) {
      item.materials.forEach((m) => {
        if (m.actuals) details = details.concat(m.actuals);
      });
    } else if (item.actuals) {
      details = item.actuals;
    }
  }

  let html = details.length
    ? `<table class="w-full text-sm text-left"><thead class="bg-gray-100"><tr><th class="p-2">Item</th><th class="text-right p-2">Harga</th><th class="text-right p-2">Qty</th><th class="text-right p-2">Total</th></tr></thead><tbody>`
    : `<p class="text-center text-gray-500">Tidak ada data.</p>`;

  details.forEach((d) => {
    html += `<tr><td class="p-2 border-b">${
      d.cost_name
    }</td><td class="text-right p-2 border-b">${finance(
      d.unit_price
    )}</td><td class="text-right p-2 border-b">${
      d.qty
    }</td><td class="text-right p-2 border-b">${finance(d.total)}</td></tr>`;
  });
  if (details.length) html += `</tbody></table>`;

  Swal.fire({ title: title, html: html, width: "600px" });
}
