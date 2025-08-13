document.addEventListener("DOMContentLoaded", function () {
  // Get pesanan_id from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const pesananId = urlParams.get("pesanan_id");
  const isDownload = urlParams.get("mode") === "download";

  if (pesananId) {
    loadPesananData(pesananId, isDownload);
  } else {
    invoiceContent.innerHTML =
      '<div class="text-red-500 p-4">Error: No pesanan_id provided in URL</div>';
  }

  // Print button event
  printBtn.addEventListener("click", function () {
    window.print();
  });
});

// Global variable to store versions
let globalVersions = [];

function terbilang(n) {
  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  n = Math.floor(n);
  if (n < 12) return satuan[n];
  if (n < 20) return terbilang(n - 10) + " Belas";
  if (n < 100)
    return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
  if (n < 200) return "Seratus " + terbilang(n - 100);
  if (n < 1000)
    return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
  if (n < 2000) return "Seribu " + terbilang(n - 1000);
  if (n < 1000000)
    return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
  if (n < 1000000000)
    return (
      terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000)
    );
  return "";
}

async function loadPesananData(pesananId, isDownload = false) {
  showLoading();

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
    globalVersions = data.detail
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

function renderInvoice(invoiceData, isDownload = false) {
  if (!invoiceData) return;

  // Ensure items is an array
  const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];

  const revisionInfo =
    invoiceData.revision_status && invoiceData.revision_number
      ? `${invoiceData.revision_status}`
      : "-";

  const itemsHtml =
    items
      .map(
        (item, idx) => `
    <tr class="${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}">
      <td class="p-3 text-center text-gray-700">${idx + 1}</td>
      <td class="p-3 text-gray-800">
        <p class="font-medium">${item.product || "-"}</p>
        <p class="text-xs text-gray-500 mt-1">${item.description || ""}</p>
      </td>
      <td class="p-3 text-center text-gray-700">${item.qty || 0}</td>
      <td class="p-3 text-center text-gray-700">${item.unit || "-"}</td>
      <td class="p-3 text-right text-gray-800">${formatCurrency(
        item.unit_price || 0
      )}</td>
      <td class="p-3 text-right text-gray-800 font-medium">${formatCurrency(
        item.total || 0
      )}</td>
    </tr>
  `
      )
      .join("") ||
    '<tr><td colspan="6" class="text-center py-4">No items found</td></tr>';

  const html = `
    <div class="invoice-container p-6 max-w-4xl mx-auto">
      <!-- HEADER -->
      <div class="relative mb-2">
        <!-- Logo di kiri -->
        <div class="absolute left-0 top-0">
          <img src="./assets/img/cropped-logo.png" class="h-16" />
        </div>

        <!-- Teks center di halaman -->
        <div class="text-center">
          <h1 class="font-bold text-red-700 text-lg">PT. DINASTI ELEKTRIK INDONESIA</h1>
          <p class="text-xs font-semibold">ELEKTRIKAL ENGINEERING & MAINTENANCE</p>
          <p class="text-xs">
            Jl. Krisa Ayu 4 RT/RW 002/008 Blok A3 No. 19, Cipondoh, Tangerang<br>
            Telp.: 0823-7142-5300, Email: admin@dinasti.id
          </p>
        </div>
      </div>

      <!-- Garis bawah -->
      <hr class="border-t-4 border-black mb-4 w-full">

      <!-- Client and Invoice Info -->
      <div class="flex justify-between mb-8 p-4 bg-gray-50 rounded-lg">
        <div class="text-sm">
          <h3 class="font-bold text-gray-700 mb-2">Kepada YTH:</h3>
          <p class="font-semibold text-gray-800">${
            invoiceData.pelanggan_nama || "-"
          }</p>
          ${
            invoiceData.project_name
              ? `<p class="text-gray-600">${invoiceData.project_name}</p>`
              : ""
          }
          ${
            invoiceData.project_type
              ? `<p class="text-gray-600">${invoiceData.project_type}</p>`
              : ""
          }
        </div>
        <div class="text-sm text-right">
          <h3 class="font-bold text-gray-700 mb-2">Detail Invoice:</h3>
          <p class="text-sm text-gray-600 mt-1"><strong>No:</strong> ${
            invoiceData.no_qtn || "-"
          }</p>
          <p class="text-sm text-gray-600"><strong>Tanggal:</strong> ${
            invoiceData.tanggal_invoice === "00/00/0000"
              ? "-"
              : invoiceData.tanggal_invoice
          }</p>
          <p class="text-gray-600"><span class="font-medium">No. Revisi:</span> ${revisionInfo}</p>
        </div>
      </div>

      <!-- PRODUCT TABLE -->
      <table class="w-full text-sm border-collapse mb-6">
        <thead class="bg-gray-100">
          <tr class="text-gray-700">
            <th class="p-3 text-center w-10">No</th>
            <th class="p-3 text-left">Description</th>
            <th class="p-3 text-center w-16">Qty</th>
            <th class="p-3 text-center w-16">Satuan</th>
            <th class="p-3 text-right w-24">Harga Satuan</th>
            <th class="p-3 text-right w-28">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="flex justify-end mb-6">
        <table class="text-sm w-72">
          <tr>
            <td class="pr-4 py-2 text-right font-semibold text-gray-700">Sub Total</td>
            <td class="py-2 text-right text-gray-800">${formatCurrency(
              invoiceData.subtotal || 0
            )}</td>
          </tr>
          <tr>
            <td class="pr-4 py-2 text-right font-semibold text-gray-700">PPN 11%</td>
            <td class="py-2 text-right text-gray-800">${formatCurrency(
              invoiceData.ppn || 0
            )}</td>
          </tr>
          <tr class="font-bold border-t-2 border-gray-300 total-row">
            <td class="pr-4 py-3 text-right text-gray-900">TOTAL</td>
            <td class="py-3 text-right text-red-600">${formatCurrency(
              invoiceData.total_order || 0
            )}</td>
          </tr>
        </table>
      </div>

      <!-- Terbilang -->
      <div class="text-sm mb-8 p-3 bg-gray-50 rounded">
        <span class="font-semibold text-gray-700">Terbilang:</span> 
        <span class="italic text-gray-800">${terbilang(
          invoiceData.total_order || 0
        )} Rupiah</span>
      </div>

      <!-- Payment Info -->
      <div class="text-sm mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p class="font-semibold text-blue-700 mb-2">Pembayaran dapat dilakukan melalui:</p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <p class="text-gray-700"><span class="font-medium">Bank:</span> BCA (Bank Central Asia)</p>
            <p class="text-gray-700"><span class="font-medium">Nama:</span> PT Dinasti Elektrik Indonesia</p>
            <p class="text-gray-700"><span class="font-medium">No. Rekening:</span> 629-0798777</p>
          </div>
        </div>
      </div>

      <!-- Notes and Signature -->
      <div class="flex justify-between items-end mt-12">
        <div class="text-sm w-1/2">
          <p class="font-semibold text-gray-700 mb-2">Catatan:</p>
          <ul class="list-disc list-inside text-gray-600">
            <li>Barang yang sudah dibeli tidak dapat dikembalikan</li>
            <li>Pembayaran dianggap lunas setelah dana diterima</li>
            <li>Invoice ini valid tanpa tanda tangan</li>
          </ul>
        </div>
        <div class="text-center signature-area w-1/2">
          <p class="text-sm text-gray-600">Jakarta, ${
            invoiceData.tanggal_invoice === "00/00/0000"
              ? "-"
              : invoiceData.tanggal_invoice
          }</p>
          <p class="text-sm text-gray-600 mb-8">Hormat kami,</p>
          <div class="flex justify-center space-x-8">
            <div>
              <img src="./assets/img/ttd.png" class="h-14 mx-auto mb-1" />
            </div>
            <div>
              <img src="./assets/img/stempel.png" class="h-14 mx-auto mb-1" />
            </div>
          </div>
          <p class="text-sm font-bold text-gray-800 mt-2">PT. DINASTI ELEKTRIK INDONESIA</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-8 pt-4 border-t border-gray-200 text-xs text-center text-gray-500">
        <p>Terima kasih atas kepercayaan Anda kepada PT Dinasti Elektrik Indonesia</p>
        <p class="mt-1">Invoice ini dikeluarkan secara elektronik dan tidak memerlukan tanda tangan</p>
      </div>
    </div>
  `;

  invoiceContent.innerHTML = html;

  // Auto download if in download mode
  if (isDownload) {
    setTimeout(() => {
      window.print();
    }, 1000);
  }
}

// Render version history list
function renderVersionHistory(versions) {
  if (!versions?.length) {
    versionHistoryList.innerHTML =
      '<li class="py-2 px-3 text-gray-500">No version history available</li>';
    versionCount.textContent = "0";
    return;
  }

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
                <button onclick="printVersion('${version.history_id}')" 
                    class="ml-2 p-1 text-gray-500 hover:text-blue-600" 
                    title="Download this version">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
            </div>
        </li>
    `
    )
    .join("");
}

// Load specific version from the global versions list
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

// Print/download specific version
async function printVersion(historyId) {
  try {
    const { isConfirmed, dismiss } = await Swal.fire({
      title: "Cetak Invoice",
      text: "Pilih metode pencetakan:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Download PDF",
      cancelButtonText: "Print Langsung",
      reverseButtons: true,
    });

    if (isConfirmed || dismiss === Swal.DismissReason.cancel) {
      // Open in new tab/window
      const url = `invoice_print.html?history_id=${historyId}${
        isConfirmed ? "&mode=download" : ""
      }`;
      window.open(url, "_blank");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}

function formatCurrency(num) {
  return new Intl.NumberFormat("id-ID").format(num);
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
