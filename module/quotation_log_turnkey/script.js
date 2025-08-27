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
function formatRp(angka) {
  if (angka == null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

// Global variable to store versions
window.globalVersions = window.globalVersions || [];

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
    const response = await fetch(
      `${baseUrl}/detail/sales_log_turnkey/${pesananId}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );

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

async function renderInvoice(invoiceData, isDownload = false) {
  if (!invoiceData) return;

  // Ambil list sub kategori
  const subCategories = await fetchSubCategories();

  // Format currency function
  const formatCurrency = (val) => `Rp ${(+val).toLocaleString("id-ID")}`;

  // Terbilang function
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

  // Pastikan items adalah array
  const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];

  // Hitung nilai jika tidak disediakan
  const subtotal =
    invoiceData.subtotal ||
    items.reduce((sum, item) => sum + (item.total || 0), 0);
  const disc = invoiceData.disc || 0;
  const ppn = invoiceData.ppn || Math.round(subtotal * 0.11); // Default PPN 11%
  const total = invoiceData.total || subtotal - disc + ppn;

  const revisionInfo =
    invoiceData.revision_status && invoiceData.revision_number
      ? `${invoiceData.revision_status}`
      : "-";

  // 🔹 Cek status: jika WON maka tampilkan Invoice
  const isWon =
    invoiceData.status_id == 2 || invoiceData.status_sales === "Won";
  const headerTitle = isWon ? "INVOICE" : "QUOTATION";
  const detailTitle = isWon ? "Invoice" : "Quotation";
  const noLabel = isWon ? "No Invoice" : "No Qtn";
  const noValue = isWon
    ? invoiceData.inv_number || invoiceData.no_qtn
    : invoiceData.no_qtn;

  // Tambahkan kategori ke setiap item
  const itemsWithCategory = items.map((item) => ({
    ...item,
    categoryName: item.sub_category || "Lainnya",
  }));

  // Grouping by sub_category
  const groupedItems = itemsWithCategory.reduce((acc, item) => {
    if (!acc[item.categoryName]) acc[item.categoryName] = [];
    acc[item.categoryName].push(item);
    return acc;
  }, {});

  // Buat tabel grouped
  let rowNumber = 1;
  const tableRows = Object.entries(groupedItems)
    .map(([category, items]) => {
      return `
        <tr class="bg-gray-200">
          <td colspan="7" class="p-1 font-bold text-gray-800 text-xs">${category}</td>
        </tr>
        ${items
          .map(
            (item) => `
          <tr class="bg-gray-100 italic">
            <td colspan="7" class="p-1 text-gray-700">
              ${item.product || "-"}
              ${
                item.description
                  ? `<div class="text-xs text-gray-500">${item.description}</div>`
                  : ""
              }
            </td>
          </tr>
          ${item.materials
            .map(
              (mat) => `
            <tr>
              <td class="text-center">${rowNumber++}</td>
              <td>${mat.name}</td>
              <td>${mat.specification || "-"}</td>
              <td class="text-center">${mat.unit}</td>
              <td class="text-center">${mat.qty}</td>
              <td class="text-right">${formatCurrency(mat.unit_price)}</td>
              <td class="text-right font-medium">${formatCurrency(
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
      <div class="relative mb-2">
        <div class="absolute left-0 top-0">
          <img src="./assets/img/cropped-logo.png" class="h-12" />
        </div>
        <div class="text-center">
          <h1 class="font-bold text-red-700 text-base">PT. DINASTI ELEKTRIK INDONESIA</h1>
          <p class="text-xs font-semibold">ELEKTRIKAL ENGINEERING & MAINTENANCE</p>
          <p class="text-[10px]">
            Jl. Krisa Ayu 4 RT/RW 002/008 Blok A3 No. 19, Cipondoh, Tangerang<br>
            Telp.: 0823-7142-5300, Email: admin@dinasti.id
          </p>
        </div>
      </div>
      <hr class="border-t-2 border-black mb-2 w-full">

      <!-- Client and Invoice Info -->
      <div class="flex justify-between mb-4 p-2 bg-gray-50 rounded text-xs">
        <div>
          <h3 class="font-bold text-gray-700 mb-1">Kepada YTH:</h3>
          <p class="font-semibold text-gray-800">${invoiceData.pic_name}</p>
          <p class="font-semibold text-gray-800">${
            invoiceData.pelanggan_nama
          }</p>
          <p class="text-gray-800 max-w-[350px] break-words">${
            invoiceData.alamat
          }</p>
          ${
            invoiceData.project_name
              ? `<p class="text-gray-600">${invoiceData.project_name}</p>`
              : ""
          }
        </div>
        <div class="text-right">
          <h3 class="font-bold text-gray-700 mb-1">${detailTitle}:</h3>
          <p class="text-gray-600"><strong>${noLabel}:</strong> ${noValue}</p>
          <p class="text-gray-600"><strong>Tanggal:</strong> ${
            invoiceData.tanggal_invoice
          }</p>
          <p class="text-gray-600"><span class="font-medium">No. Revisi:</span> ${revisionInfo}</p>
        </div>
      </div>

      <!-- Table Items -->
      <table class="w-full compact-table border-collapse bordered mb-3">
        <thead class="bg-gray-100">
          <tr class="text-gray-700">
            <th class="text-center w-8">No</th>
            <th class="text-left">Deskripsi</th>
            <th class="text-left">Spesifikasi</th>
            <th class="text-center w-12">Unit</th>
            <th class="text-center w-12">Qty</th>
            <th class="text-right w-24">Harga Satuan</th>
            <th class="text-right w-24">Jumlah</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <!-- Totals -->
      <div class="flex justify-end mb-3">
        <table class="text-xs w-64">
          <tr>
            <td class="pr-3 py-0.5 text-right font-semibold text-gray-700">Sub Total</td>
            <td class="py-0.5 text-right text-gray-800">${formatCurrency(
              invoiceData.subtotal
            )}</td>
          </tr>
          <tr>
            <td class="pr-3 py-0.5 text-right font-semibold text-gray-700">Discount</td>
            <td class="py-0.5 text-right text-gray-800">${formatCurrency(
              invoiceData.disc
            )}</td>
          </tr>
          <tr>
            <td class="pr-3 py-0.5 text-right font-semibold text-gray-700">PPN 11%</td>
            <td class="py-0.5 text-right text-gray-800">${formatCurrency(
              invoiceData.ppn
            )}</td>
          </tr>
          <tr class="font-bold border-t border-gray-300 total-row">
            <td class="pr-3 py-1 text-right text-gray-900">TOTAL</td>
            <td class="py-1 text-right text-red-600">${formatCurrency(
              invoiceData.total
            )}</td>
          </tr>
        </table>
      </div>

      <!-- Terbilang -->
      <div class="text-xs mb-3">
        <span class="font-semibold text-gray-700">Terbilang:</span>
        <span class="italic text-gray-800">${terbilang(
          invoiceData.total
        )} Rupiah</span>
      </div>
      <div class="flex justify-between items-start mt-6 text-xs">
          <!-- Catatan -->
          <div class="w-1/2">
            <p class="font-semibold text-gray-700 mb-1">Catatan:</p>
            <ul class="list-disc list-inside text-gray-600">
              <li>Barang yang sudah dibeli tidak dapat dikembalikan</li>
              <li>Pembayaran dianggap lunas setelah dana diterima</li>
              <li>Invoice ini valid tanpa tanda tangan</li>
            </ul>
          </div>

          <!-- Signature Section -->
          <div class="text-sm text-right">
            <p>Jakarta, 10 Februari 2025</p>
            <div class="mt-2">
              <img src="materai.png"  class="h-20 ml-auto">
            </div>
            <p class="mt-2 font-semibold">Nanda Febby Yullantina</p>
            <p>Finance Manager</p>
          </div>
        </div>
  `;

  // Ganti dengan elemen target yang sesuai
  const invoiceContent = document.getElementById("invoiceContent");
  if (invoiceContent) {
    invoiceContent.innerHTML = html;
  }

  // Auto download jika dalam mode download
  if (isDownload) {
    setTimeout(() => {
      html2pdf()
        .set({
          margin: 0,
          filename: `${noValue || "invoice"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(invoiceContent || document.querySelector(".invoice-container"))
        .save();
    }, 1000);
  }
}

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

// Load specific version from the global versions list

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
