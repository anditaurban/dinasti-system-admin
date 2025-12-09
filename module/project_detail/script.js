// --- SETUP HEADER ---
pagemodule = "Project";
subpagemodule = "Project Costing";
renderHeader();

var projectId = window.detail_id;
var projectDetailData = null; // Pastikan variabel global ini terdefinisi

// --- 1. FUNGSI UTAMA: FETCH & RENDER (REVISI PESANAN ID 0) ---
async function fetchAndRenderProject(isRefresh = false) {
  if (!isRefresh) {
    Swal.fire({
      title: "Memuat Data...",
      html: "Mohon tunggu...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  try {
    const res = await fetch(`${baseUrl}/detail/project/${projectId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!res.ok) throw new Error("Gagal mengambil data project");

    const json = await res.json();
    projectDetailData = json.detail;
    const data = projectDetailData;

    // ============================================================
    // LOGIKA LOCK / KUNCI (REVISI HANDLING ID 0)
    // ============================================================
    // Jika pesanan_id = "0" atau 0, anggap BELUM ada pesanan.
    const hasPesanan =
      data.pesanan_id != null &&
      data.pesanan_id !== "" &&
      data.pesanan_id != "0" &&
      data.pesanan_id !== 0;
    const isDirectSales = data.position === "Direct Project";

    // Status Lock:
    const isLocked = hasPesanan && isDirectSales;

    // 1. Handle Tombol Update
    const btnSave = document.getElementById("saveAllPlanCostBtn");
    if (btnSave) {
      if (isLocked) {
        btnSave.disabled = true;
        btnSave.classList.remove("bg-yellow-500", "hover:bg-yellow-600");
        btnSave.classList.add("bg-gray-400", "cursor-not-allowed");
        btnSave.innerHTML = "🔒 Locked (Direct Project)";
        btnSave.onclick = null;
      } else {
        btnSave.disabled = false;
        btnSave.classList.remove("bg-gray-400", "cursor-not-allowed");
        btnSave.classList.add("bg-yellow-500", "hover:bg-yellow-600");
        btnSave.innerHTML = "💾 Update Plan Costing";
        btnSave.onclick = handleUpdateAllPlanCosting;
      }
    }

    const getInputClass = (locked) => {
      return locked
        ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300"
        : "bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300";
    };
    const getReadOnlyAttr = (locked) => (locked ? "disabled readonly" : "");

    // ============================================================
    // A. RENDER CARD INFO
    // ============================================================
    document.getElementById("projectNameDisplay").textContent = `${
      data.project_name
    } (${data.project_number || "-"})`;

    document.getElementById("projectAmount").innerHTML = `
        <div>${finance(data.project_value)}</div>
        <div class="text-[10px] text-gray-400 font-normal mt-1">100% Base</div>
    `;

    document.getElementById("plan_costing").innerHTML = `
        <div>${finance(data.plan_costing)}</div>
        <div class="text-[10px] text-gray-500 font-normal mt-1">
            ${data.plan_costing_percent}% dari Value
        </div>
    `;

    const isOverBudget =
      parseFloat(data.actual_costing) > parseFloat(data.plan_costing);
    document.getElementById("actual_costing").innerHTML = `
        <div>${finance(data.actual_costing)}</div>
        <div class="text-[10px] font-normal mt-1 ${
          isOverBudget ? "text-red-600 font-bold" : "text-gray-500"
        }">
            ${data.actual_costing_percent}% dari Value
        </div>
    `;

    const balVal = parseFloat(data.balance_costing);
    document.getElementById("balance_costing").innerHTML = `
        <div class="${balVal < 0 ? "text-red-600" : "text-green-600"}">
            ${finance(data.balance_costing)}
        </div>
        <div class="text-[10px] text-gray-500 font-normal mt-1">
            ${data.balance_costing_percent}% (Efisiensi)
        </div>
    `;

    document.getElementById("margin").innerHTML = `
        <div>${finance(data.margin)}</div>
        <div class="text-[10px] text-blue-600 font-normal mt-1">
            ${data.margin_percent}% Est.
        </div>
    `;

    const profitVal = parseFloat(data.profit);
    document.getElementById("profit").innerHTML = `
        <div class="${profitVal < 0 ? "text-red-600" : "text-green-600"}">
            ${finance(data.profit)}
        </div>
        <div class="text-[10px] font-bold text-gray-500 mt-1">
            ${data.profit_percent}% Nett
        </div>
    `;

    document.getElementById("detailNoQO").textContent = data.no_qtn || "---";
    document.getElementById("detailNoInv").textContent =
      data.inv_number || "---";
    document.getElementById("detailNoPO").textContent = data.po_number || "---";
    document.getElementById("detailPIC").textContent =
      data.project_manager_name || data.pic_name || "---";

    // ============================================================
    // B. RENDER TABEL ITEMS
    // ============================================================
    const tbody = document.getElementById("tabelItemView");
    tbody.innerHTML = "";

    if (data.items?.length) {
      const groups = {};
      data.items.forEach((item) => {
        const cat = item.sub_category || "Uncategorized";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      });

      let nomor = 1;
      Object.keys(groups).forEach((subCat) => {
        const trHeader = document.createElement("tr");
        trHeader.className = "bg-gray-200 font-bold text-gray-700";
        trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase text-xs">${subCat}</td>`;
        tbody.appendChild(trHeader);

        groups[subCat].forEach((item) => {
          const tr = document.createElement("tr");
          tr.className = "border-b bg-gray-50";
          tr.dataset.itemId = item.project_item_id;

          const displayActual = item.actual_total || 0;

          tr.innerHTML = `
              <td class="px-3 py-2 align-top font-semibold text-center">${nomor++}</td>
              <td class="px-3 py-2 align-top">
                  <div class="font-medium text-gray-800">${item.product}</div>
                  <div class="text-xs text-gray-500">${
                    item.description || ""
                  }</div>
              </td>
              ${
                item.materials?.length
                  ? `<td colspan="6" class="text-gray-400 text-xs italic px-3 py-2 text-center bg-gray-50">Rincian di sub-item</td>`
                  : `<td class="px-3 py-2 text-right align-top">${item.qty}</td>
                     <td class="px-3 py-2 text-center align-top">${
                       item.unit
                     }</td>
                     <td class="px-3 py-2 text-right align-top">${finance(
                       item.unit_price
                     )}</td>
                     <td class="px-3 py-2 text-right align-top">${finance(
                       item.item_total
                     )}</td>
                     <td class="px-3 py-2 text-center align-top">
                       <input class="plancosting text-right border px-2 py-1 w-full rounded text-sm ${getInputClass(
                         isLocked
                       )}" 
                              value="${finance(item.plan_total)}"
                              ${getReadOnlyAttr(isLocked)}>
                     </td>
                     <td class="px-3 py-2 text-center align-top">
                       <div class="flex items-center justify-end gap-2 ${
                         displayActual > item.plan_total
                           ? "text-red-600"
                           : "text-green-600"
                       } font-bold">
                           <span>${finance(displayActual)}</span>
                           <button class="view-actual-cost-btn text-gray-500 hover:text-blue-600" 
                                   data-korelasi="${
                                     item.product
                                   }" title="Lihat Detail">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                           </button>
                       </div>
                     </td>`
              }
          `;
          tbody.appendChild(tr);

          if (item.materials?.length) {
            item.materials.forEach((m, idx) => {
              const subTr = document.createElement("tr");
              subTr.className = "border-b bg-white text-sm";
              subTr.dataset.materialId = m.project_materials_id;

              const subActual = m.actual_total || 0;

              subTr.innerHTML = `
                  <td></td>
                  <td class="px-3 py-1 italic pl-8 text-gray-600 flex items-center gap-2">
                    <span class="text-xs text-gray-400">↳</span> ${idx + 1}. ${
                m.name
              }
                  </td>
                  <td class="px-3 py-1 text-right">${m.qty}</td>
                  <td class="px-3 py-1 text-center">${m.unit}</td>
                  <td class="px-3 py-1 text-right">${finance(m.unit_price)}</td>
                  <td class="px-3 py-1 text-right text-gray-500">${finance(
                    m.material_total
                  )}</td>
                  <td class="px-3 py-1 text-center">
                      <input class="plancosting text-right border px-2 py-1 w-full rounded text-sm ${getInputClass(
                        isLocked
                      )}" 
                             value="${finance(m.plan_total)}"
                             ${getReadOnlyAttr(isLocked)}>
                  </td>
                  <td class="px-3 py-1 text-center">
                      <div class="flex items-center justify-end gap-2 ${
                        subActual > m.plan_total
                          ? "text-red-600"
                          : "text-green-600"
                      } font-bold">
                          <span>${finance(subActual)}</span>
                          <button class="view-actual-cost-btn text-gray-400 hover:text-blue-600" 
                                  data-korelasi="${
                                    item.product
                                  }" data-material-name="${
                m.name
              }" title="Lihat Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                          </button>
                      </div>
                  </td>
              `;
              tbody.appendChild(subTr);
            });
          }
        });
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">Belum ada item project.</td></tr>`;
    }

    // ============================================================
    // C. EVENT LISTENERS
    // ============================================================
    if (!isLocked) {
      tbody.querySelectorAll(".plancosting").forEach((input) => {
        input.addEventListener("input", (e) => {
          e.target.value = finance(e.target.value.replace(/\D/g, ""));
        });
      });
    }

    tbody.onclick = (e) => {
      const btn = e.target.closest(".view-actual-cost-btn");
      if (btn) {
        showActualCostDetail(btn.dataset.korelasi, btn.dataset.materialName);
      }
    };

    if (!isRefresh) Swal.close();
  } catch (err) {
    console.error(err);
    if (!isRefresh) Swal.fire("Error", "Gagal load data project", "error");
  }
}

// --- 2. FUNGSI UPDATE DATA ---
async function handleUpdateAllPlanCosting() {
  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

  const payload = { items: [] };
  const tableBody = document.getElementById("tabelItemView");

  // Loop data dari state projectDetailData untuk memastikan struktur benar
  projectDetailData.items.forEach((item) => {
    const itemRow = tableBody.querySelector(
      `tr[data-item-id="${item.project_item_id}"]`
    );

    // Skip jika row tidak ditemukan di DOM (safety check)
    if (!itemRow && (!item.materials || item.materials.length === 0)) return;

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
          const valRaw = matRow.querySelector(".plancosting").value;
          const val = parseRupiah(valRaw);
          itemPayload.materials.push({
            project_materials_id: m.project_materials_id,
            plan_total: val,
          });
        }
      });
    } else if (itemRow) {
      const valRaw = itemRow.querySelector(".plancosting").value;
      const val = parseRupiah(valRaw);
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
      // Notifikasi Sukses Singkat
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data Plan Costing telah diperbarui",
        timer: 3000, // Jeda 3 Detik
        timerProgressBar: true,
        showConfirmButton: false,
      });

      // KEY FIX: Panggil fetchAndRenderProject(true) alih-alih reload modul
      fetchAndRenderProject(true);
    } else {
      throw new Error(json.message || "Gagal update data");
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", e.message, "error");
  }
}

// --- 3. FUNGSI HELPER (MODAL VIEW ACTUAL) ---
function showActualCostDetail(korelasiPekerjaan, korelasiMaterial) {
  const item = projectDetailData.items.find(
    (i) => i.product === korelasiPekerjaan
  );
  if (!item) return;

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
    : `<p class="text-center text-gray-500 py-4">Tidak ada data aktual.</p>`;

  details.forEach((d) => {
    html += `<tr>
        <td class="p-2 border-b">${d.cost_name}</td>
        <td class="text-right p-2 border-b">${finance(d.unit_price)}</td>
        <td class="text-right p-2 border-b">${d.qty}</td>
        <td class="text-right p-2 border-b font-medium">${finance(d.total)}</td>
    </tr>`;
  });

  if (details.length) html += `</tbody></table>`;

  Swal.fire({ title: title, html: html, width: "600px" });
}

// --- 4. EKSEKUSI AWAL ---
fetchAndRenderProject();
