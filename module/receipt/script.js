pagemodule = "Receipt";
subpagemodule = "";
renderHeader();
colSpanCount = 9;
setDataType("sales_receipt");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;
  // =========================================
  // 1. UPDATE ROW TEMPLATE (DENGAN TOMBOL MATA)
  // =========================================
  window.rowTemplate = function (item, index, perPage = 10) {
    const { currentPage } = state[currentDataType];
    const globalIndex = (currentPage - 1) * perPage + index + 1;

    // --- LOGIC TOMBOL LIHAT BUKTI ---
    let viewProofButton = "";

    // Cek apakah file ada, tidak null, dan tidak kosong stringnya
    if (item.file && item.file !== "null" && item.file !== "") {
      // a. Ambil nama file saja (antisipasi jika database simpan full path)
      const rawFilename = item.file.split("/").pop();

      // b. Encode nama file (antisipasi spasi/karakter khusus)
      const safeFilename = encodeURIComponent(rawFilename);

      // c. Susun URL (Gunakan 'receipt' sesuai modul ini)
      // Format: {{baseUrl}}/file/receipt/NAMA_FILE
      const fileUrl = `${baseUrl}/file/receipt/${safeFilename}`;

      // d. Buat tombol HTML
      viewProofButton = `
      <button onclick="event.stopPropagation(); handlePreview('${fileUrl}')" 
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 font-medium transition duration-150 ease-in-out">
        👁️ Lihat Bukti
      </button>
    `;
    }
    // --------------------------------

    return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.tanggal_transaksi}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No. Receipt</span>
      ${item.receipt_number}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Project</span>  
      ${item.project_name}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Pelanggan</span>
      ${item.pelanggan_nama}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Akun</span>
      ${item.nama_akun}
    </td>
  
    <td class="px-6 py-4 text-right text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Jumlah</span>
      ${finance(item.nominal)}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Keterangan</span>
      ${item.keterangan}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell relative">
      <div class="flex flex-col">
        <span class="font-medium sm:hidden">Status</span>
        <span>${item.status || "Pending"}</span>
        <span class="text-xs text-gray-500">Approved By : ${
          item.pic_name || "-"
        }</span>
      </div>
      
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow-lg z-50 text-sm right-0 mt-2">
        
        <button onclick="event.stopPropagation(); loadModuleContent('receipt_detail', '${
          item.receipt_id
        }', '${item.receipt_number}');"
          class="block w-full text-left px-4 py-2 hover:bg-gray-100">
          👁️ View Detail
        </button>

        ${viewProofButton}

        <button onclick="event.stopPropagation(); confirmPayment('${
          item.receipt_id
        }', 2);" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600">
            ✅ Valid
        </button>
        
        <button onclick="event.stopPropagation(); confirmPayment('${
          item.receipt_id
        }', 3);" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
            ❌ Tidak Valid
        </button>
      </div>
    </td>
  </tr>`;
  };

  // =========================================
  // 2. LOGIC MODAL & HANDLER (WAJIB ADA)
  // =========================================

  // Inject Modal ke Body jika belum ada
  // =========================================
  // 1. INJECT MODAL HTML (Tampilan Baru: Clean Centered)
  // =========================================

  if (!document.getElementById("filePreviewModal")) {
    const previewModalHtml = `
    <div id="filePreviewModal" class="fixed inset-0 z-[100] hidden bg-black bg-opacity-60 flex items-center justify-center p-4 transition-opacity duration-300" onclick="closePreviewModal()">
        
        <div class="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden transform scale-100 transition-transform duration-300" onclick="event.stopPropagation()">
            
            <div class="relative pt-5 pb-2 text-center">
                <h3 class="text-2xl font-bold text-gray-700 tracking-wide">Bukti Transaksi</h3>
                <button onclick="closePreviewModal()" class="absolute right-4 top-4 text-gray-300 hover:text-gray-500 transition focus:outline-none">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <div class="px-6 py-2">
                <div id="previewContent" class="bg-gray-200 rounded-lg min-h-[300px] max-h-[65vh] flex items-center justify-center overflow-auto border border-gray-300 relative">
                    <p class="text-gray-500 font-medium animate-pulse">Memuat data...</p>
                </div>
            </div>

            <div class="pb-6 pt-3 text-center">
                 <a id="downloadLink" href="#" target="_blank" class="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 font-bold text-lg transition group">
                    <div class="bg-blue-500 text-white rounded p-1 group-hover:bg-blue-700 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                    Download Gambar
                 </a>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML("beforeend", previewModalHtml);
  }

  // =========================================
  // 2. FUNGSI HANDLER UTAMA (Tetap Sama, Logic Fetch)
  // =========================================

  window.handlePreview = async function (fileUrl) {
    if (
      !fileUrl ||
      fileUrl.includes("/receipt/undefined") ||
      fileUrl.includes("/receipt/null")
    ) {
      Swal.fire({
        icon: "info",
        title: "File Tidak Ditemukan",
        text: "File fisik belum diunggah.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    Swal.fire({
      title: "Memeriksa File...",
      html: "Sedang memverifikasi...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch(fileUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });

      if (!response.ok) {
        Swal.close();
        Swal.fire({
          icon: "warning",
          title: "File Tidak Ditemukan",
          text: "File fisik tidak tersedia di server.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      Swal.close();

      // Buka Modal Baru
      openCustomModal(objectUrl, fileUrl);
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal mengambil file.",
      });
    }
  };

  // =========================================
  // 3. HELPER: OPEN & CLOSE (Disesuaikan layout baru)
  // =========================================

  function openCustomModal(objectUrl, originalUrl) {
    const modal = document.getElementById("filePreviewModal");
    const content = document.getElementById("previewContent");
    const downloadLink = document.getElementById("downloadLink");

    // Reset isi konten
    content.innerHTML =
      '<div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>';

    // Tampilkan Modal
    modal.classList.remove("hidden");

    // Set Link Download
    downloadLink.href = objectUrl;
    downloadLink.download = "bukti-transaksi-" + new Date().getTime();

    // Cek Tipe File
    const ext = originalUrl.split(".").pop().toLowerCase().split("?")[0];
    const imgExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];

    // Delay sedikit agar transisi halus
    setTimeout(() => {
      if (imgExts.includes(ext)) {
        // Render Gambar
        content.innerHTML = `<img src="${objectUrl}" class="max-w-full max-h-full object-contain rounded shadow-sm" alt="Bukti Transaksi">`;
      } else if (ext === "pdf") {
        // Render PDF
        content.innerHTML = `<iframe src="${objectUrl}" class="w-full h-full rounded border-none" frameborder="0"></iframe>`;
        // Atur tinggi khusus jika PDF agar pas di container
        content.classList.remove("min-h-[300px]");
        content.style.height = "60vh";
      } else {
        // File Lain
        content.innerHTML = `
                <div class="text-center p-10">
                    <div class="text-6xl mb-4 opacity-50">📄</div>
                    <p class="text-gray-600 font-semibold">Preview tidak tersedia</p>
                    <p class="text-sm text-gray-500 mt-2">Silakan download file untuk melihat.</p>
                </div>`;
      }
    }, 200);
  }

  window.closePreviewModal = function () {
    const modal = document.getElementById("filePreviewModal");
    modal.classList.add("hidden");
    // Bersihkan konten agar stop loading/playing
    setTimeout(() => {
      document.getElementById("previewContent").innerHTML = "";
    }, 300);
  };
  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.tanggal_transaksi}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No. Receipt</span>
      ${item.receipt_number}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Project</span>  
      ${item.project_name}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Pelanggan</span>
      ${item.pelanggan_nama}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Akun</span>
      ${item.nama_akun}
    </td>
  
    <td class="px-6 py-4 text-right text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Jumlah</span>
      ${finance(item.nominal)}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Keterangan</span>
      ${item.keterangan}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <div class="flex flex-col">
        <span class="font-medium sm:hidden">Status</span>
        <span>${item.status || "Pending"}</span>
        <span class="text-xs text-gray-500">Approved By : ${
          item.pic_name || "-"
        }</span>
      </div>
    </td>
    
    <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
      <button onclick="event.stopPropagation(); loadModuleContent('receipt_detail', '${
        item.receipt_id
      }', '${item.receipt_number}');"
        class="block w-full text-left px-4 py-2 hover:bg-gray-100">
        👁️ View Detail
      </button>
      <button onclick="event.stopPropagation(); confirmPayment('${
        item.receipt_id
      }', 2);" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
          ✅ Valid
        </button>
        <button onclick="event.stopPropagation(); confirmPayment('${
          item.receipt_id
        }', 3);" class="block w-full text-left px-4 py-2 hover:bg-gray-100">
          ❌ Tidak Valid
        </button>
    </div>
  </tr>`;
};

async function confirmPayment(receipt_id, status_value) {
  const { isConfirmed } = await Swal.fire({
    title: "Konfirmasi Pembayaran",
    text: "Apakah Anda yakin ingin mengonfirmasi pembayaran ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Konfirmasi",
    cancelButtonText: "Batal",
  });

  if (!isConfirmed) return;

  try {
    const response = await fetch(
      `${baseUrl}/update/sales_receipt_status/${receipt_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ status_id: status_value, user_id: user_id }),
      }
    );

    const result = await response.json();

    // sesuai struktur response kamu
    if (result?.response === "200") {
      Swal.fire({
        title: "Berhasil!",
        text: result.message || "Status berhasil diperbarui.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      // refresh data tabel/list
      fetchAndUpdateData();
    } else {
      throw new Error(result.message || "Gagal memperbarui status");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}
