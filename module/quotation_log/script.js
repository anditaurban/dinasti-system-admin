loadPesananData(window.detail_id);

// Global variable to store versions
window.globalVersions = window.globalVersions || [];

async function loadPesananData(pesananId, isDownload = false) {
  showLoading();
  console.log("Data:", pesananId, isDownload);

  try {
    const response = await fetch(`${baseUrl}/detail/sales_log/${pesananId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response !== "200" || !data.detail?.length) {
      throw new Error("Data invoice tidak ditemukan");
    }

    // Filter and sort versions
    window.globalVersions = data.detail
      .filter((version) => version.revision_number !== null)
      .sort((a, b) => b.revision_number - a.revision_number);

    if (globalVersions.length === 0) {
      throw new Error("Tidak ada versi invoice yang valid");
    }

    // Render the latest version
    renderInvoice(globalVersions[0], isDownload);

    // Render version history
    renderVersionHistory(globalVersions);
  } catch (error) {
    showError(`Gagal memuat invoice: ${error.message}`);
    console.error("Error:", error);
  }
}

function showError(message) {
  invoiceContent.innerHTML = `
    <div class="bg-red-50 border-l-4 border-red-500 p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">${message}</p>
        </div>
      </div>
    </div>
  `;
}

async function fetchSubCategories() {
  try {
    const res = await fetch(`${baseUrl}/list/sub_category/1`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });
    const result = await res.json();
    return result.listData || [];
  } catch (err) {
    console.error("Gagal memuat kategori", err);
    return [];
  }
}

async function renderInvoice(invoiceData) {
  const container = document.getElementById("invoiceContent");
  const isWon =
    invoiceData.status_id == 2 || invoiceData.status_sales === "Won";
  const noLabel = isWon ? "No Invoice" : "No Qtn";
  const noValue = isWon
    ? invoiceData.inv_number || invoiceData.no_qtn
    : invoiceData.no_qtn;
  const revisionInfo =
    invoiceData.revision_status && invoiceData.revision_number
      ? `${invoiceData.revision_status}`
      : "-";
  const detailTitle = isWon ? "Invoice" : "Quotation";
  // mapping sub_category name ke item
  const itemsWithCategory = invoiceData.items.map((item) => {
    const category = subCategories.find(
      (c) => c.sub_category_id == item.sub_category_id
    );
    return {
      ...item,
      categoryName: category ? category.nama : "Lainnya",
    };
  });

  // grouping by sub_category
  const groupedItems = itemsWithCategory.reduce((acc, item) => {
    if (!acc[item.categoryName]) acc[item.categoryName] = [];
    acc[item.categoryName].push(item);
    return acc;
  }, {});
  let rowNumber = 1;
  let globalIndex = 1;
  const tableRows = Object.entries(groupedItems)
    .map(([category, items]) => {
      return `
    <tr class="bg-white">
      <td colspan="7" class="p-1 font-bold text-black text-xs border border-black">${category}</td>
    </tr>
    ${items
      .map(
        (item) => `
      <tr class="bg-material italic">
        <td class="text-center text-gray-700 border border-black">${globalIndex++}</td>
        <td colspan="2" class="p-1 text-black border border-black">
          ${item.product || "-"}
          ${
            item.description
              ? `<div class="text-xs text-gray-500">${item.description}</div>`
              : ""
          }
        </td>
${
  item.materials && item.materials.length > 0
    ? `
          <td colspan="4" class="text-center border border-black"></td>
        `
    : `
          <td class="text-center border border-black">${item.qty}</td>
          <td class="text-center border border-black">${item.unit}</td>
          <td class="text-right border border-black">${finance(
            item.unit_price
          )}</td>
          <td class="text-right font-medium border border-black">${finance(
            item.total
          )}</td>
        `
}
      </tr>
      ${item.materials
        .map(
          (mat) => `
        <tr>
          <td></td>
          <td class="border border-black">${rowNumber++}. ${mat.name}</td>
          <td class="border border-black">${mat.specification || "-"}</td>
          <td class="text-center border border-black">${mat.qty}</td>
          <td class="text-center border border-black">${mat.unit}</td>
          <td class="text-right border border-black">${finance(
            mat.unit_price
          )}</td>
          <td class="text-right font-medium border border-black">${finance(
            mat.total
          )}</td>
        </tr>
      `
        )
        .join("")}
    `
      )
      .join("")}
  `;
    })
    .join("");

  const html = `
<!-- Header -->
<div class="flex justify-between items-start mb-6">
  <!-- Logo -->
  <div class="shrink-0">
    <img src="./assets/img/cropped-logo.png" class="h-40 w-40 object-contain" />
  </div>

  <!-- Company Info -->
  <div class="flex-1 px-4">
    <h1 class="font-bold text-red-600 text-lg leading-tight">
      PT. Dinasti Elektrik Indonesia
    </h1>
    <p class="font-bold text-sm">ELECTRICAL ENGINEERING &amp; MAINTENANCE</p>
    <p class="text-xs leading-snug mt-1">
      Jl. Krisa Ayu IV Blok A3 No. 19 RT.002/RW.008<br />
      Petir, Cipondoh, Tangerang 11750
    </p>
    <div class="text-xs mt-2 space-y-0.5">
      <p class="font-medium">Social Media</p>
      <p>Instagram : Dinastielektrik.id</p>
      <p>Instagram : Dinasti_Electrical_Projectz</p>
    </div>
  </div>

  <!-- Quotation Box -->
<div class="flex justify-end">
  <div class="text-right shrink-0">
    <h2 class="font-bold text-xl text-indigo-400">QUOTATION</h2>
    <table class="border-collapse text-xs mt-2">
      <tr>
        <td class="px-2 py-1 text-left">DATE</td>
        <td class="border px-3 py-1 text-center">${
          invoiceData.tanggal_invoice
        }</td>
      </tr>
      <tr>
        <td class="px-2 py-1 text-left">NO</td>
        <td class="border px-3 py-1 text-center">${invoiceData.no_qtn}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 text-left">REV</td>
        <td class="border px-3 py-1 text-center">${
          invoiceData.revision_status
        }</td>
      </tr>
    </table>
  </div>
</div>

</div>

<!-- Recipient Info -->
<div class="mb-4">
  <div class="bg-indigo-800 text-white font-bold text-xs px-2 py-1 inline-block">
    TO
  </div>
<div class="text-sm mt-1 leading-snug">
  <p class="font-semibold">${invoiceData.pic_name}</p>
  <p class="font-semibold">${invoiceData.pelanggan_nama}</p>
  <p class="max-w-[500px] break-words">${invoiceData.alamat}</p>

  <hr class="my-2 border-t border-gray-300" />

  ${
    invoiceData.project_name
      ? `<p class="text-lg font-bold text-gray-800 mt-2">${invoiceData.project_name}</p>`
      : ""
  }
</div>

</div>


      <!-- Table Items -->
      <table class="w-full compact-table border-collapse border border-black mb-3">
  <thead class="bg-blue-900">
    <tr class="text-white">
      <th class="text-center w-8 border border-black">No.</th>
      ${
        invoiceData.salestype == 3
          ? `
      <th class="text-center border border-black">DESCRIPTION</th>`
          : `<th colspan='2' class='text-center border border-black'>DESCRIPTION</th>`
      }
      ${
        invoiceData.salestype == 3
          ? `
      <th class="text-center border border-black">SPESIFICATION</th>`
          : ""
      }
      <th class="text-center w-12 border border-black">QTY</th>
      <th class="text-center w-12 border border-black">UNIT</th>
      <th class="text-center w-24 border border-black">UNIT PRICE</th>
      <th class="text-center w-24 border border-black">TOTAL</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
</table>

<div class="flex justify-between items-start mt-6 text-xs">
  <!-- Comments / Special Instructions -->
  <div class="w-1/2 border">
    <!-- Header abu-abu -->
    <div class="bg-gray-300 font-semibold px-3 py-1">
      Comments or Special Instructions
    </div>

    <!-- Isi -->
    <div class="px-3 py-2 text-gray-700">
      <p><span class="font-semibold">Terms of Payment :</span></p>
      <p>
        ${
          invoiceData.term_pembayaran &&
          invoiceData.term_pembayaran.trim() !== "" &&
          invoiceData.term_pembayaran !== "-"
            ? invoiceData.term_pembayaran
            : "-"
        }
      </p>
      <br>
      <p><span class="font-semibold">Terms and Conditions :</span></p>
      <p>
        ${
          invoiceData.syarat_ketentuan &&
          invoiceData.syarat_ketentuan.trim() !== "" &&
          invoiceData.syarat_ketentuan !== "-"
            ? invoiceData.syarat_ketentuan
            : "-"
        }
      </p>
       <br>
      <p><span class="font-semibold">Notes :</span></p>
      <p>
        ${
          invoiceData.catatan &&
          invoiceData.catatan.trim() !== "" &&
          invoiceData.catatan !== "-"
            ? invoiceData.catatan
            : "-"
        }
      </p>
    </div>
  </div>

  <!-- Totals -->
  <div class="w-1/3">
    <table class="text-xs w-full">
      <tr>
        <td class="pr-3 py-0.5 text-right font-semibold text-gray-700">SUBTOTAL</td>
        <td class="py-0.5 text-right text-gray-800">${finance(
          invoiceData.subtotal
        )}</td>
      </tr>
      <tr>
        <td class="pr-3 py-0.5 text-right font-semibold text-gray-700">DISC</td>
        <td class="py-0.5 text-right text-gray-800">${
          invoiceData.disc ? `${finance(invoiceData.disc)}` : "-"
        }</td>
      </tr>
      <tr>
        <td class="pr-3 py-0.5 text-right font-semibold text-gray-700">SHIPPING</td>
        <td class="py-0.5 text-right text-gray-800">${
          invoiceData.shipping ? `${finance(invoiceData.shipping)}` : "-"
        }</td>
      </tr>
      <tr>
        <td class="pr-3 py-0.5 text-right font-semibold text-gray-700">PPN 11%</td>
        <td class="py-0.5 text-right text-gray-800">${finance(
          invoiceData.ppn
        )}</td>
      </tr>
      <tr class="font-bold border-t border-gray-300 total-row">
        <td class="pr-3 py-1 text-right text-gray-900">TOTAL</td>
        <td class="py-1 text-right text-blue-800 bg-blue-100">${finance(
          invoiceData.total
        )}</td>
      </tr>
    </table>
  </div>
</div>
`;
  container.innerHTML = html;
}

function renderVersionHistory(versions) {
  if (!versions?.length) {
    versionHistoryList.innerHTML =
      '<li class="py-2 px-3 text-gray-500">No version history available</li>';
    versionCount.textContent = "0";
    return;
  }

  console.log("Versi= ", versions);

  versionCount.textContent = versions.length;

  versionHistoryList.innerHTML = versions
    .map(
      (version, index) => `
        <li class="version-item ${index === 0 ? "version-active" : ""}">
            <div class="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                <button onclick="loadVersionFromList(${index})" 
                    class="w-full text-left flex items-center justify-between">
                    <div>
                        <div class="font-medium">${
                          version.revision_status ||
                          `Version ${version.revision_number}`
                        }</div>
                        <div class="text-xs text-gray-500">${
                          version.tanggal_invoice === "00/00/0000"
                            ? "No date"
                            : version.tanggal_invoice
                        }</div>
                    </div>
                    ${
                      index === 0
                        ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Current</span>'
                        : ""
                    }
                </button>
                
            </div>
        </li>
    `
    )
    .join("");
}

function loadVersionFromList(index) {
  try {
    if (!globalVersions || !globalVersions[index]) {
      throw new Error("Version data not available");
    }

    renderInvoice(globalVersions[index]);

    // Update active state in version list
    document.querySelectorAll(".version-item").forEach((item, i) => {
      if (i === index) {
        item.classList.add("version-active");
        // Update the "Current" badge
        const badge = item.querySelector("span");
        if (badge) {
          badge.innerHTML = "Current";
        } else {
          item
            .querySelector("button")
            .insertAdjacentHTML(
              "beforeend",
              '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Current</span>'
            );
        }
      } else {
        item.classList.remove("version-active");
        // Remove the "Current" badge from other items
        const badge = item.querySelector("span");
        if (badge) badge.remove();
      }
    });
  } catch (error) {
    showError(`Failed to load version: ${error.message}`);
  }
}
