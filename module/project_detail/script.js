pagemodule = "Project";
subpagemodule = "Project Costing";
renderHeader();

loadDetailSales(window.detail_id, window.detail_desc)
// =====================
// Render Detail Invoice
// =====================
async function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  try {
    const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const response = await res.json();
    const data = response.detail;
    if (!data) throw new Error("Invalid API response structure");


    document.getElementById("projectAmount").innerHTML = finance(data.project_value) || 0;
    document.getElementById("plan_costing").innerHTML = finance(data.plan_costing) || 0;
    document.getElementById("actual_costing").innerHTML = finance(data.actual_cost) || 0;
    document.getElementById("margin").innerHTML = finance(data.margin) || 0;

    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

if (data.items?.length) {
  // --- Grouping berdasarkan sub_category ---
  const groups = {};
  data.items.forEach(item => {
    if (!groups[item.sub_category]) groups[item.sub_category] = [];
    groups[item.sub_category].push(item);
  });

  let nomor = 1;

  // --- Render per group ---
  Object.keys(groups).forEach(subCat => {
    // Baris header sub_category
    const trHeader = document.createElement("tr");
    trHeader.className = "bg-gray-200 font-semibold";
    trHeader.innerHTML = `
      <td colspan="10" class="px-3 py-2 uppercase">${subCat || "-"}</td>
    `;
    tbody.appendChild(trHeader);

    groups[subCat].forEach(item => {
      // Baris produk utama
      const tr = document.createElement("tr");
      tr.className = "border-b bg-gray-50";

      tr.innerHTML = `
        <td class="px-3 py-2 align-top text-sm font-semibold">${nomor++}</td>
        <td class="px-3 py-2 align-top">
          <div class="font-medium">${item.product || "-"}</div>
          <div class="text-xs text-gray-500">${item.description || ""}</div>
        </td>
        ${
          item.materials?.length
            ? `
              <td colspan="10" class="px-3 py-2 text-center text-gray-400 italic"></td>
            `
            : `
              <td class="px-3 py-2 text-right align-top">${item.qty || 0}</td>
              <td class="px-3 py-2 text-center align-top">${item.unit || ""}</td>
              <td class="px-3 py-2 text-right align-top">${formatNumber(item.unit_price || 0)}</td>
              <td class="px-3 py-2 text-right align-top">${formatNumber(item.total || item.qty * item.unit_price)}</td>
              <td class="px-3 py-2 text-center align-top">
                <input id="plancosting" placeholder="0" class="text-right border px-2 py-1 w-20">
              </td>
              <td class="px-3 py-2 text-center align-top">
                <input id="actualcost" placeholder="0" class="text-right border px-2 py-1 w-20">
              </td>
              <td class="px-3 py-2 text-center align-top">
                <input type="date" id="payment_date" class="border px-2 py-1">
              </td>
              <td class="px-3 py-2 text-center align-top">
                <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                  Update
                </button>
              </td>
            `
        }
      `;
      tbody.appendChild(tr);

      // Baris subItem / materials (kalau ada)
      if (item.materials?.length) {
        item.materials.forEach((m, mIdx) => {
          const subTr = document.createElement("tr");
          subTr.className = "border-b bg-gray-50 text-sm";

          subTr.innerHTML = `
            <td class="px-3 py-1"></td> <!-- kosong untuk nomor -->
            <td class="px-3 py-1 italic">
              ${mIdx + 1}. ${m.name || ""} - ${m.specification || ""}
            </td>
            <td class="px-3 py-1 text-right">${m.qty || 0}</td>
            <td class="px-3 py-1 text-center">${m.unit || ""}</td>
            <td class="px-3 py-1 text-right">${formatNumber(m.unit_price || 0)}</td>
            <td class="px-3 py-1 text-right">${formatNumber(m.total || 0)}</td>
              <td class="px-3 py-2 text-center align-top">
                <input id="plancosting" placeholder="0" class="text-right border px-2 py-1 w-20">
              </td>
              <td class="px-3 py-2 text-center align-top">
                <input id="actualcost" placeholder="0" class="text-right border px-2 py-1 w-20">
              </td>
            <td class="px-3 py-1 text-center">
              <input type="date" id="payment_date" class="border px-2 py-1">
            </td>
              <td class="px-3 py-2 text-center align-top">
                <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                  Update
                </button>
              </td>
          `;

          tbody.appendChild(subTr);
        });
      }
    });
  });
} else {
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center text-gray-500 italic py-3">
        Tidak ada item
      </td>
    </tr>
  `;
}




    window.dataLoaded = true;


  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail penjualan", "error");
  }
}

function toggleSection(id) {
  const section = document.getElementById(id);
  const icon = document.getElementById("icon-" + id);
  section.classList.toggle("hidden");
  icon.textContent = section.classList.contains("hidden") ? "►" : "▼";
}



async function printInvoice(pesanan_id) {
  try {
    const response = await fetch(
      `${baseUrl}/detail/sales_invoice/${pesanan_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );

    const result = await response.json();
    const detail = result?.detail;
    if (!detail) throw new Error("Data faktur tidak ditemukan");

    const { isConfirmed, dismiss } = await Swal.fire({
      title: "Cetak Faktur Penjualan",
      text: "Pilih metode pencetakan:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Download PDF",
      cancelButtonText: "Print Langsung",
      reverseButtons: true,
    });

    if (isConfirmed) {
      const url = `invoice_print.html?id=${pesanan_id}`;
      Swal.fire({
        title: "Menyiapkan PDF...",
        html: "File akan diunduh otomatis.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();

          const iframe = document.createElement("iframe");
          iframe.src = url + "&mode=download";
          iframe.style.width = "0";
          iframe.style.height = "0";
          iframe.style.border = "none";
          document.body.appendChild(iframe);

          setTimeout(() => {
            Swal.close();
            Swal.fire(
              "Berhasil",
              "Faktur Penjualan berhasil diunduh.",
              "success"
            );
          }, 3000);
        },
      });
    } else if (dismiss === Swal.DismissReason.cancel) {
      window.open(`invoice_print.html?id=${pesanan_id}`, "_blank");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}

