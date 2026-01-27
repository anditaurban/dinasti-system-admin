pagemodule = "Invoice";
subpagemodule = "Invoice Detail";
renderHeader();

loadDetailSales(window.detail_id, window.detail_desc);
// =====================
// Render Detail Invoice
// =====================
async function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  // 🔹 Tampilkan loading
  Swal.fire({
    title: "Loading...",
    text: "Sedang memuat detail data, mohon tunggu.",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const res = await fetch(`${baseUrl}/detail/sales_invoice/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const response = await res.json();
    const data = response.detail;
    if (!data) throw new Error("Invalid API response structure");
    currentInvoiceData = data;

    document.getElementById("project_name").innerHTML = data.project_name || "";
    document.getElementById("tanggal_po").innerHTML = data.po_date || "";
    document.getElementById("tanggal_inv").innerHTML = data.invoice_date || "";
    document.getElementById("type_sales").innerHTML = data.project_type || "";
    document.getElementById("no_qtn").innerHTML = data.inv_number || "";
    document.getElementById("no_po").innerHTML = data.po_number || "";
    document.getElementById("client_name").innerHTML =
      data.pelanggan_nama || "";

    document.getElementById("due_date").innerHTML = data.due_date || "-";
    document.getElementById("internal_notes").innerHTML =
      data.internal_notes || "-";

    document.getElementById("contract_amount").innerHTML =
      finance(data.subtotal) || "";
    document.getElementById("diskon").innerHTML = finance(data.disc) || "";
    document.getElementById("ppn").innerHTML = finance(data.ppn) || "";
    document.getElementById("total").innerHTML = finance(data.total) || "";
    document.getElementById("total").innerHTML = finance(data.total) || "";

    // ... kode fetch data awal ...

    // 🔹 Inisialisasi Elemen Ringkasan
    const ppnCheckbox = document.getElementById("is_ppn_active");
    const ppnTextEl = document.getElementById("ppn");
    const totalTextEl = document.getElementById("total");
    const outstandingTextEl = document.getElementById("outstanding");

    const subtotal = parseFloat(data.subtotal || 0);
    const disc = parseFloat(data.disc || 0);
    const totalPaid = parseFloat(data.total_paid || 0);
    const ppnFromAPI = parseFloat(data.ppn || 0);

    // 1. Set State Awal Berdasarkan Data API
    ppnCheckbox.checked = ppnFromAPI > 0;
    ppnTextEl.innerHTML = finance(ppnFromAPI);

    // 2. Event Listener Checkbox dengan API Update
    ppnCheckbox.onchange = async function () {
      const isChecked = this.checked;
      const newPpnValue = isChecked ? Math.round(subtotal * 0.11) : 0;
      const revertCheckbox = () => {
        this.checked = !isChecked;
      };

      // 1. Konfirmasi Awal
      const confirm = await Swal.fire({
        title: "Update Pajak?",
        text: `Apakah Anda ingin ${isChecked ? "mengenakan" : "menghapus"} PPN 11%?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Update!",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      });

      if (!confirm.isConfirmed) {
        revertCheckbox();
        return;
      }

      // 2. Loading State (Menunggu Respon API)
      Swal.fire({
        title: "Memproses...",
        text: "Menyimpan perubahan ke server",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const response = await fetch(
          `${baseUrl}/update/ppn_sales/${data.pesanan_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_TOKEN}`,
            },
            body: JSON.stringify({ ppn: newPpnValue }),
          },
        );

        const result = await response.json();

        if (response.ok) {
          // ✅ Tampilkan pesan sukses sebentar
          await Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Data sedang disinkronkan...",
            timer: 1000, // Tampil 1 detik
            showConfirmButton: false,
          });

          // 🔄 Tampilkan Loading lagi khusus untuk Refresh Data
          Swal.fire({
            title: "Sinkronisasi...",
            text: "Memuat ulang data terbaru",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // Beri delay tambahan 1.5 detik agar database benar-benar settle
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // 🔄 Panggil fungsi utama untuk refresh UI secara total
          await loadDetailSales(Id, Detail);

          // Swal akan otomatis tertutup di akhir fungsi loadDetailSales
        } else {
          throw new Error(result.message || "Gagal update PPN");
        }
      } catch (err) {
        revertCheckbox();
        Swal.fire("Error", err.message, "error");
      }
    };

    // ... sisa kode render lainnya ...

    const paymentEl = document.getElementById("payment");
    paymentEl.textContent = formatNumber(data.total_paid || "0");
    if (data.total_paid <= 0)
      paymentEl.className = "float-right text-red-600 font-bold";
    else if (data.total_paid < data.contract_amount)
      paymentEl.className = "float-right text-orange-500 font-bold";
    else paymentEl.className = "float-right text-green-600 font-bold";

    const outstandingEl = document.getElementById("outstanding");
    outstandingEl.textContent = formatNumber(data.remaining_balance || "0");
    if (data.remaining_balance > 0 && data.total_paid === 0)
      outstandingEl.className = "float-right text-red-600 font-bold";
    else if (data.remaining_balance > 0)
      outstandingEl.className = "float-right text-orange-500 font-bold";
    else outstandingEl.className = "float-right text-green-600 font-bold";

    const statusEl = document.getElementById("status");
    statusEl.textContent = data.status || "Unpaid";
    if (data.invoice_status_id === 1)
      statusEl.className = "float-right text-red-600 font-bold";
    else if (data.invoice_status_id === 2)
      statusEl.className = "float-right text-orange-500 font-bold";
    else if (data.invoice_status_id === 3)
      statusEl.className = "float-right text-green-600 font-bold";

    // 📝 Catatan / syarat / top
    document.getElementById("catatanSection").innerHTML = data.catatan
      ? `<div>${data.catatan}</div>`
      : `<div class="text-gray-500 italic">-</div>`;
    document.getElementById("syaratKetentuanSection").innerHTML =
      data.syarat_ketentuan
        ? `<div>${data.syarat_ketentuan}</div>`
        : `<div class="text-gray-500 italic">-</div>`;
    document.getElementById("topSection").innerHTML = data.term_pembayaran
      ? `<div>${data.term_pembayaran}</div>`
      : `<div class="text-gray-500 italic">-</div>`;

    // ===========================
    // 🔹 Render Items as Document
    // ===========================
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    if (data.items?.length) {
      // --- Grouping berdasarkan sub_category ---
      const groups = {};
      data.items.forEach((item) => {
        if (!groups[item.sub_category]) groups[item.sub_category] = [];
        groups[item.sub_category].push(item);
      });

      let nomor = 1;

      // --- Render per group ---
      Object.keys(groups).forEach((subCat) => {
        // Baris header sub_category
        const trHeader = document.createElement("tr");
        trHeader.className = "bg-gray-200 font-semibold";
        trHeader.innerHTML = `
      <td colspan="6" class="px-3 py-2 uppercase">${subCat || "-"}</td>
      `;
        tbody.appendChild(trHeader);

        groups[subCat].forEach((item) => {
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
                <td class="px-3 py-2 text-center text-gray-400 italic" colspan="4">
                </td>
              `
            : `
                <td class="px-3 py-2 text-right align-top">${item.qty || 0}</td>
                <td class="px-3 py-2 text-center align-top">${
                  item.unit || ""
                }</td>
                <td class="px-3 py-2 text-right align-top">${formatNumber(
                  item.unit_price || 0,
                )}</td>
                <td class="px-3 py-2 text-right align-top">${formatNumber(
                  item.total || item.qty * item.unit_price,
                )}</td>
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
            <td class="px-3 py-1"></td> <td class="px-3 py-1 italic">${
              mIdx + 1
            }. ${m.name || ""} - ${m.specification || ""}</td>
            <td class="px-3 py-1 text-right">${m.qty || 0}</td>
            <td class="px-3 py-1 text-center">${m.unit || ""}</td>
            <td class="px-3 py-1 text-right">${formatNumber(
              m.unit_price || 0,
            )}</td>
            <td class="px-3 py-1 text-right">${formatNumber(m.total || 0)}</td>
          `;

              tbody.appendChild(subTr);
            });
          }
        });
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
    }

    // ===========================
    // 🔹 Render Pembayaran (SECURE VIEW)
    // ===========================
    // ===========================
    // 🔹 Render Pembayaran (FIX ERROR 404 & EMPTY FILE)
    // ===========================
    const pembayaranSection = document.getElementById("pembayaranSection");
    pembayaranSection.innerHTML = "";

    if (data.payments?.length) {
      data.payments.forEach((p) => {
        // Debugging: Cek data di console browser jika error lagi
        // console.log("Payment Data:", p);

        const div = document.createElement("div");
        div.className = "border p-2 rounded bg-white mb-2 shadow-sm";

        // 1. Validasi Ketat: Pastikan file ada, bukan null, bukan "null" (string), dan bukan kosong
        const hasFile =
          p.file && p.file !== "null" && String(p.file).trim() !== "";

        let actionBtn = "";

        if (hasFile) {
          let fileUrl = "";
          const rawFile = String(p.file).trim(); // Pastikan string bersih

          // Cek apakah format URL lengkap (http/https)
          if (rawFile.startsWith("http")) {
            fileUrl = rawFile;
          } else {
            // Rakit dengan Base URL jika hanya nama file
            const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, "");
            fileUrl = `${cleanBaseUrl}/file/receipt/${rawFile}`;
          }

          // Tombol View (Aktif)
          actionBtn = `
                <button onclick="handleViewProof('${fileUrl}')" 
                   class="ml-2 w-6 h-6 flex items-center justify-center text-blue-500 hover:text-blue-700 transition"
                   title="Lihat Bukti" type="button">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                </button>
             `;
        } else {
          // Tombol Disabled (File Kosong/Invalid)
          actionBtn = `
                <span class="ml-2 w-6 h-6 flex items-center justify-center text-gray-300 cursor-not-allowed" title="Tidak ada file">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29" />
                  </svg>
                </span>
             `;
        }

        div.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
                <div class="font-medium text-gray-800 text-sm flex items-center gap-2">
                    💳 ${p.description || "Pembayaran"} ${actionBtn}
                </div>
                <div class="text-[11px] text-gray-500 mt-1">
                    📅 ${p.payment_date || "-"}
                </div>
            </div>

            <div class="text-right">
                <div class="flex items-center justify-end">
                    <span class="font-bold text-green-700 text-base">
                        ${formatNumber(p.amount || 0)} 
                    </span>
                    
                </div>
                <div class="text-[11px] text-gray-500 mt-1">
                    🏦 ${p.account?.nama_akun || "Cash"}
                </div>
            </div>
          </div>`;
        pembayaranSection.appendChild(div);
      });
    } else {
      pembayaranSection.innerHTML = `<div class="text-xs text-gray-400 italic text-center py-2 border border-dashed rounded bg-gray-50">- Belum ada data pembayaran -</div>`;
    }
    // console.log('DP: ', data.down_payments);
    // console.log('DP: ', data.down_payments);
    const dpString = encodeURIComponent(
      JSON.stringify(data.down_payments || []),
    );

    // [MODIFIKASI] Ambil elemen container tombolnya
    const pembayaranButtonEl = document.getElementById("pembayaranbutton");

    // [MODIFIKASI] Cek status invoice
    // Kita gunakan 'invoice_status_id === 3' (Paid) sebagai acuan
    // Ini lebih baik daripada 'remaining_balance <= 0' karena status lebih eksplisit
    if (data.invoice_status_id === 3) {
      // Jika status 3 (Paid/Lunas), tampilkan pesan Lunas
      pembayaranButtonEl.innerHTML = `
      <div class="text-center text-xs text-green-700 italic py-1 px-2 border rounded bg-green-50">
        ( Lunas )
      </div>
      `;
    } else {
      // Jika status BUKAN 3 (masih Unpaid/Partial), tampilkan tombol
      pembayaranButtonEl.innerHTML = `
      <button onclick="openSalesReceiptModal('${data.pesanan_id}', '${data.pelanggan_id}', '${data.total}', '${data.remaining_balance}', '${dpString}', '${Id}')" 
        class="w-full py-1 px-2 border rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs">
        ➕ Add Payment Receipt
      </button>`;
    }

    // ===========================
    // 🔹 File Pendukung
    // ===========================
    const fileSection = document.getElementById("fileSection");
    fileSection.innerHTML = "";
    if (data.supporting_files?.length) {
      data.supporting_files.forEach((f) => {
        const div = document.createElement("div");
        div.className =
          "flex items-center justify-between border p-2 rounded bg-gray-50";
        div.innerHTML = `
          <a href="${baseUrl.replace("/api", "")}/${
            f.file_path
          }" target="_blank" class="text-blue-600 hover:underline">📄 ${
            f.file_name
          }</a>
          <span class="text-xs text-gray-500">${f.uploaded_at}</span>`;
        fileSection.appendChild(div);
      });
    } else {
      fileSection.innerHTML = `<div class="text-gray-500 italic">-</div>`;
    }

    // ===========================
    // 🔹 Invoice Uang Muka (VERSI COMPACT / KECIL)
    // ===========================
    const uangMukaSection = document.getElementById("uangMukaSection");
    uangMukaSection.innerHTML = "";

    if (data.down_payments?.length) {
      data.down_payments.forEach((dp) => {
        const div = document.createElement("div");
        // [UBAH] Padding jadi p-2, margin mb-2, background putih
        div.className = "border p-2 rounded bg-white mb-2 shadow-sm relative";

        const dpDataString = encodeURIComponent(JSON.stringify(dp));

        // Logic Status Badge
        let statusLabel = "Unpaid";
        let statusClass = "bg-red-50 text-red-600 border-red-100";
        if (dp.status_payment === "paid") {
          statusLabel = "Paid";
          statusClass = "bg-green-50 text-green-600 border-green-100";
        } else if (dp.status_payment === "partial") {
          statusLabel = "Partial";
          statusClass = "bg-orange-50 text-orange-600 border-orange-100";
        }

        // Logic PPN
        const ppnPercent = parseFloat(dp.ppn_percent || 0);
        const ppnAmount = parseFloat(dp.ppn_amount || 0);
        let ppnDisplay = "";

        if (ppnAmount > 0) {
          // [UBAH] Font size sangat kecil (text-[10px]) agar irit tempat
          ppnDisplay = `
                <div class="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                    <span class="bg-gray-100 px-1 rounded border">Tax ${ppnPercent}%: ${formatNumber(
                      ppnAmount,
                    )}</span>
                    <span class="font-semibold text-gray-600">Total: ${formatNumber(
                      (dp.amount || 0) + ppnAmount,
                    )}</span>
                </div>
            `;
        }

        div.innerHTML = `
        <div class="flex justify-between items-start">
          
          <div class="flex-1">
            <div class="text-xs font-bold text-gray-500 mb-0.5">
                ${dp.dp_number || "DP-XXX"}
            </div>

            <div class="flex items-center gap-2">
                <span class="font-bold text-green-700 text-base">
                    ${formatNumber(dp.amount || 0)}
                </span>
                
                <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${statusClass}">
                    ${statusLabel}
                </span>
            </div>

            ${ppnDisplay}

            <div class="text-[11px] text-gray-400 italic mt-1 leading-tight truncate w-11/12">
               ${dp.description ? dp.description : "-"}
            </div>
          </div>

          <div class="flex flex-col gap-1 ml-2">
             ${
               dp.status_payment !== "paid"
                 ? `<button 
                    onclick="openUpdateDPModal('${dpDataString}')" 
                    class="px-2 py-0.5 border rounded text-[10px] bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-medium transition whitespace-nowrap">
                    ✏️ Edit
                  </button>`
                 : ``
             }

            <button 
              onclick="printInvoiceDP('${dp.dp_id}')" 
              class="px-2 py-0.5 border rounded text-[10px] bg-green-50 text-green-700 hover:bg-green-100 font-medium transition whitespace-nowrap">
              🖨 Print
            </button>
          </div>

        </div>
      `;
        uangMukaSection.appendChild(div);
      });
    } else {
      uangMukaSection.innerHTML = `<div class="text-xs text-gray-400 italic text-center py-2 border border-dashed rounded bg-gray-50">- Tidak ada data DP -</div>`;
    }

    // [MODIFIKASI] Ambil elemen container tombol DP
    const invoiceDPButtonEl = document.getElementById("invoiceDPbutton");

    // [MODIFIKASI] Cek status invoice utama
    if (data.invoice_status_id === 3) {
      // Jika invoice utama sudah Lunas (Paid), tampilkan pesan
      invoiceDPButtonEl.innerHTML = `
      <div class="text-center text-xs text-gray-500 italic py-1 px-2 border rounded bg-gray-50">
        (Invoice Lunas)
      </div>
      `;
    } else {
      // Jika invoice utama belum lunas, tampilkan tombol tambah DP
      invoiceDPButtonEl.innerHTML = `
      <button onclick="tambahUangMuka('${data.pesanan_id}', '${data.contract_amount}')" 
        class="w-full py-1 px-2 border rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs">
        ➕ Add Invoice DP/Progress
      </button>`;
    }

    window.dataLoaded = true;

    // ✅ Tutup loading
    await fetchInvoiceFiles(Id);
    Swal.close();
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail penjualan", "error");
  }
}

/**
 * Fungsi Mengambil Gambar Terproteksi (Secure Fetch)
 * Versi Revisi: Menampilkan INFO jika file tidak ada (bukan Error)
 */
async function handleViewProof(fileUrl) {
  // 1. Cek Validitas URL di awal
  // Jika URL kosong, null, atau hanya berisi path folder tanpa nama file
  if (
    !fileUrl ||
    fileUrl === "null" ||
    fileUrl.trim() === "" ||
    fileUrl.endsWith("/receipt/")
  ) {
    Swal.fire({
      icon: "info", // 🔵 Pakai icon Info (bukan Error)
      title: "Tidak Ada File",
      text: "Bukti pembayaran belum diunggah atau data kosong.",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  // 2. Tampilkan Loading
  Swal.fire({
    title: "Memuat...",
    text: "Sedang mengecek file bukti...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 3. Request ke Server
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    // 4. Cek Status Respons
    // Jika server merespons 404 (File Not Found)
    if (response.status === 404) {
      Swal.fire({
        icon: "info", // 🔵 Info
        title: "File Tidak Ditemukan",
        text: "File fisik bukti transaksi tidak ditemukan di server.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Jika error lain (misal 500 atau 401 token expired)
    if (!response.ok) {
      // Kita anggap saja sebagai info "Gagal memuat" agar tidak terlihat error sistem
      throw new Error("Gagal mengambil data.");
    }

    // 5. Jika Berhasil, Tampilkan Gambar
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    await Swal.fire({
      title: "Bukti Transaksi",
      html: `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 200px; background: #f3f4f6; padding: 10px; border-radius: 8px;">
           <img src="${objectUrl}" 
                alt="Bukti Transaksi" 
                style="max-width: 100%; max-height: 80vh; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        </div>
        <div style="margin-top: 15px;">
           <a href="${objectUrl}" download="bukti-transaksi.jpg" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium">
             ⬇️ Download Gambar
           </a>
        </div>
      `,
      width: 600,
      showCloseButton: true,
      showConfirmButton: false,
      background: "#fff",
    });
  } catch (error) {
    // Log error asli ke console developer saja (biar user tidak bingung)
    console.warn("View proof info:", error);

    // Tampilkan pesan INFO ke user
    Swal.fire({
      icon: "info", // 🔵 Tetap Info
      title: "Data Tidak Tersedia",
      text: "Tidak dapat menampilkan bukti transaksi saat ini.",
      confirmButtonColor: "#3085d6",
    });
  }
}

function toggleSection(id) {
  const section = document.getElementById(id);
  const icon = document.getElementById("icon-" + id);
  section.classList.toggle("hidden");
  icon.textContent = section.classList.contains("hidden") ? "►" : "▼";
}

async function tambahUangMuka(pesananId, contractAmountRaw) {
  // Pastikan contractAmount berupa angka
  const contractAmount = parseFloat(contractAmountRaw) || 0;

  const { value: formValues } = await Swal.fire({
    title: "Tambah Uang Muka (DP)",
    width: "600px",
    html: `
  <div class="space-y-3 text-left text-gray-800">
    <div class="grid grid-cols-2 gap-3">
        <div>
            <label class="block text-sm mb-1">Tanggal DP <span class="text-red-500">*</span></label>
            <input type="date" id="dp_date"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring" />
        </div>
        <div>
            <label class="block text-sm mb-1">Jatuh Tempo</label>
            <input type="date" id="due_date"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring" />
        </div>
    </div>

    <div class="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded border border-gray-300">
        <div class="col-span-12 mb-1 text-xs">
            Basis Kontrak: ${formatRupiah(contractAmount)}
        </div>

        <div class="col-span-4">
            <label class="block text-sm mb-1">Persen (%) <span class="text-red-500">*</span></label>
            <div class="relative">
                <input type="number" id="percentage" step="0.1"
                    class="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring"
                    placeholder="0" />
                <span class="absolute right-3 top-2 text-sm text-gray-500">%</span>
            </div>
        </div>

        <div class="col-span-8">
            <label class="block text-sm mb-1">Nominal Dasar (Exclude PPN) <span class="text-red-500">*</span></label>
            <input type="text" id="amount" onkeyup="formatCurrencyInput(this)"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring"
                placeholder="Contoh: 1.000.000" />
        </div>
    </div>

    <div class="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-300">
        <div class="flex items-center gap-2">
            <input type="checkbox" id="is_tax" class="w-4 h-4">
            <label for="is_tax" class="text-sm">Tax / PPN</label>
        </div>
        <div class="flex items-center gap-1 w-24">
            <input type="number" id="tax_percent" value="11" disabled
                class="w-full border border-gray-300 rounded px-2 py-1 text-right text-sm bg-gray-100 focus:outline-none">
            <span class="text-sm">%</span>
        </div>
    </div>

    <div class="space-y-1 text-right border-t border-gray-300 pt-2 text-sm">
        <div class="flex justify-between">
            <span>PPN Amount:</span>
            <span id="preview_ppn_amount">Rp 0</span>
        </div>
        <div class="flex justify-between">
            <span>Total Tagihan (Include PPN):</span>
            <span id="preview_total_display">Rp 0</span>
        </div>
    </div>

    <div>
      <label class="block text-sm mb-1">Deskripsi Invoice <span class="text-red-500">*</span></label>
      <textarea id="description" rows="2"
        class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring"
        placeholder="Contoh: Uang muka 50%"></textarea>
    </div>
  </div>
`,

    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    // ... (Bagian atas Swal tetap sama) ...

    didOpen: () => {
      // Set tanggal default hari ini
      document.getElementById("dp_date").valueAsDate = new Date();

      const percentageInput = document.getElementById("percentage");
      const amountInput = document.getElementById("amount");
      const isTaxCheck = document.getElementById("is_tax");
      const taxPercentInput = document.getElementById("tax_percent");

      const previewPpn = document.getElementById("preview_ppn_amount");
      const previewTotal = document.getElementById("preview_total_display");

      // --- HELPER: Parsing angka super aman ---
      function parseRupiahInput(inputVal) {
        if (!inputVal) return 0;
        // 1. Hapus SEMUA karakter KECUALI angka (0-9) dan koma (,)
        //    Ini akan otomatis menghapus "Rp", titik ribuan, spasi, dll.
        let clean = inputVal.replace(/[^0-9,]/g, "");

        // 2. Ganti koma (,) jadi titik (.) untuk format float JavaScript
        clean = clean.replace(/,/g, ".");

        return parseFloat(clean) || 0;
      }

      // 1. Logic: Input Persen -> Hitung Nominal
      percentageInput.addEventListener("input", () => {
        let pct = parseFloat(percentageInput.value) || 0;
        let nominal = contractAmount * (pct / 100);

        // formatRupiah: asumsikan fungsi global Anda yang menambahkan format tampilan
        amountInput.value = formatRupiah(nominal);
        calculateFinal();
      });

      // 2. Logic: Input Nominal -> Hitung Persen
      amountInput.addEventListener("keyup", () => {
        let nominal = parseRupiahInput(amountInput.value);

        if (contractAmount > 0) {
          let pct = (nominal / contractAmount) * 100;
          // Tampilkan max 2 desimal
          percentageInput.value = parseFloat(pct.toFixed(2));
        }
        calculateFinal();
      });

      // 3. Logic: Hitung Pajak & Total Akhir
      function calculateFinal() {
        // Gunakan helper parsing yang aman
        let amount = parseRupiahInput(amountInput.value);
        let taxRate = 0;

        if (isTaxCheck.checked) {
          taxPercentInput.removeAttribute("disabled");
          taxPercentInput.classList.remove("bg-gray-100");
          taxRate = parseFloat(taxPercentInput.value) || 0;
        } else {
          taxPercentInput.setAttribute("disabled", true);
          taxPercentInput.classList.add("bg-gray-100");
        }

        let taxValue = amount * (taxRate / 100);
        let total = amount + taxValue;

        // Update UI dengan format Rupiah
        previewPpn.textContent = formatRupiah(taxValue);
        previewTotal.textContent = formatRupiah(total);
      }

      // Event Listeners Tambahan (Checkbox & Input Pajak)
      isTaxCheck.addEventListener("change", calculateFinal);
      taxPercentInput.addEventListener("input", calculateFinal);
    },

    preConfirm: () => {
      // Parsing nilai untuk dikirim ke API
      // Kita lakukan parsing manual di sini agar sama persis logikanya
      const rawVal = document.getElementById("amount").value;
      // Hapus selain angka dan koma -> ganti koma jadi titik
      const cleanVal = rawVal.replace(/[^0-9,]/g, "").replace(/,/g, ".");
      const amountVal = parseFloat(cleanVal) || 0;

      const isTax = document.getElementById("is_tax").checked;
      const taxRate = isTax
        ? parseFloat(document.getElementById("tax_percent").value) || 0
        : 0;

      const ppnAmount = amountVal * (taxRate / 100);
      const totalAmount = amountVal + ppnAmount;

      return {
        dp_date: document.getElementById("dp_date").value,
        due_date: document.getElementById("due_date").value,

        // Data Nominal yang sudah bersih (Float/Integer)
        amount: amountVal,
        percentage:
          parseFloat(document.getElementById("percentage").value) || 0,
        ppn_percent: taxRate,
        ppn_amount: ppnAmount,
        total_amount: totalAmount,

        description: document.getElementById("description").value,
      };
    },

    // ... (Sisa kode sama) ...
  });

  if (formValues) {
    try {
      const res = await fetch(`${baseUrl}/add/sales_dp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          pesanan_id: pesananId,
          owner_id: owner_id,
          user_id: user_id,
          dp_date: formValues.dp_date,
          due_date: formValues.due_date,

          // Sesuai Key Request Body yang diminta
          amount: formValues.amount,
          percentage: formValues.percentage,
          ppn_percent: formValues.ppn_percent,
          ppn_amount: formValues.ppn_amount,
          total_amount: formValues.total_amount,

          description: formValues.description,
          invoice_id: window.detail_id,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data DP");

      const result = await res.json();

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: result.message || "Uang muka berhasil ditambahkan",
      });

      loadModuleContent("invoice_detail", window.detail_id, window.detail_desc);
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
      });
    }
  }
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
      },
    );

    const result = await response.json();
    const detail = result?.detail;
    if (!detail) throw new Error("Data faktur tidak ditemukan");

    const swalResult = await Swal.fire({
      title: "Cetak Invoice",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Print Preview",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (swalResult.isConfirmed) {
      // Jika klik Print Preview
      window.open(`invoice_print.html?id=${pesanan_id}`, "_blank");
    }
    // Jika Cancel → Swal otomatis close, tidak perlu aksi tambahan
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message || "Terjadi kesalahan saat memuat faktur.",
      icon: "error",
    });
  }
}

async function printInvoiceDP(pesanan_id) {
  try {
    const response = await fetch(`${baseUrl}/detail/sales_dp/${pesanan_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();
    const detail = result?.detail;
    if (!detail) throw new Error("Data faktur tidak ditemukan");

    const swalResult = await Swal.fire({
      title: "Cetak Invoice DP / Progress",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Print Preview",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (swalResult.isConfirmed) {
      // Jika klik Print Preview
      window.open(`invoiceDP_print.html?id=${pesanan_id}`, "_blank");
    }
    // Jika Cancel → Swal otomatis close, tidak perlu aksi tambahan
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message || "Terjadi kesalahan saat memuat faktur.",
      icon: "error",
    });
  }
}

async function openSalesReceiptModal(
  pesananId,
  pelangganId,
  totalInvoice,
  sisaBayar,
  invoiceDP,
  mainInvoiceId,
) {
  const totalOrder = totalInvoice;
  const remainingAmount = sisaBayar;
  console.log("data invoice DP: ", invoiceDP);
  let parsedDP = [];
  try {
    parsedDP = JSON.parse(decodeURIComponent(invoiceDP));
  } catch (e) {
    console.warn("❌ Gagal parse invoiceDP:", e);
  }

  // console.log("✅ InvoiceDP parsed:", parsedDP);

  // 🔹 Load akun finance
  let akunOptions = "<option value=''>Pilih Akun</option>";
  try {
    const res = await fetch(`${baseUrl}/list/finance_accounts`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await res.json();
    if (res.ok && result.listData) {
      akunOptions += result.listData
        .map(
          (acc) =>
            `<option value="${acc.akun_id}">
              ${acc.nama_akun} - ${acc.number_account} (${acc.owner_account})
            </option>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("❌ Gagal load akun:", err);
  }

  // 🔹 Invoice DP options
  let dpOptions = "";
  if (parsedDP?.length) {
    dpOptions = parsedDP
      .map((dp) => {
        const disabled = dp.status_payment === "paid" ? "disabled" : "";

        // ⬇️ simpan semua data dalam value radio (stringify JSON)
        const value = encodeURIComponent(
          JSON.stringify({
            reference_type: "dp",
            reference_id: dp.dp_id,
            nominal: dp.remaining_balance,
            description: dp.description || "",
            status_payment: dp.status_payment,
          }),
        );

        return `
        <label class="flex items-center space-x-2 border rounded p-2 hover:bg-gray-50 cursor-pointer ${
          disabled && "opacity-50"
        }">
          <input type="radio" name="reference_radio" 
                value="${value}"
                data-nominal="${dp.remaining_balance}" 
                data-description="${dp.description || ""}"
                class="form-radio" ${disabled}>
          <span class="text-sm">
            ${dp.dp_number} - (Total: ${formatRupiah(
              dp.amount,
            )}, Sisa: ${formatRupiah(dp.remaining_balance)} 
            (${dp.status_payment}) ${dp.description}
          </span>
        </label>
      `;
      })
      .join("");
  }

  // 🔹 Tampilkan SweetAlert
  const { value: formValues } = await Swal.fire({
    title: "Tambah Sales Receipt",
    width: "700px",
    html: `
      <form id="salesReceiptForm" class="space-y-4 text-left">
        <input type="hidden" id="sr_pesanan_id" value="${pesananId}">
        <input type="hidden" id="sr_pelanggan_id" value="${pelangganId || ""}">
        <input type="hidden" id="owner_id" value="${owner_id}">
        <input type="hidden" id="user_id" value="${user_id}">
        <input type="hidden" id="branch_id" value="1">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi <span class="text-red-500">*</span></label>
          <input type="date" id="tanggal"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" required>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pembayaran Berdasarkan</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 border rounded p-2 hover:bg-gray-50 cursor-pointer">
              <input type="radio" name="reference_radio" value="main" data-nominal="${remainingAmount}" class="form-radio" checked>
              <span class="text-sm">Invoice Utama (Total: ${formatRupiah(
                totalOrder,
              )}, Sisa: ${formatRupiah(remainingAmount)})</span>
            </label>
            ${dpOptions}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nominal Bayar <span class="text-red-500">*</span></label>
          <input type="text" id="sr_nominal"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            placeholder="Masukkan nominal" onkeyup="formatCurrencyInput(this)">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Deksripsi Invoice <span class="text-red-500">*</span></label>
          <textarea id="keterangan" rows="2"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            placeholder="Masukkan Deksripsi"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Akun <span class="text-red-500">*</span></label>
          <select id="akun_select"
            class="w-full border rounded px-3 py-2 bg-white focus:ring focus:ring-blue-200 focus:border-blue-500"
            required>
            ${akunOptions}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
          <input type="file" id="file"
            class="w-full border rounded px-3 py-2 bg-white focus:ring focus:ring-blue-200 focus:border-blue-500">
        </div>
      </form>
    `,
    didOpen: () => {
      // 🔹 Auto isi nominal saat radio dipilih
      setTodayDate();
      document
        .querySelectorAll("input[name='reference_radio']")
        .forEach((radio) => {
          radio.addEventListener("change", (e) => {
            const nominal = e.target.dataset.nominal || 0;
            const desc = e.target.dataset.description || "";
            document.getElementById("sr_nominal").value = formatRupiah(nominal);
            if (desc) {
              document.getElementById("keterangan").value = desc;
            } else {
              document.getElementById("keterangan").value =
                "Pembayaran Invoice Utama";
            }
          });
        });

      // Set default nominal = sisa invoice utama
      document.getElementById("sr_nominal").value =
        formatRupiah(remainingAmount);
      document.getElementById("keterangan").value = "Pembayaran Invoice Utama";
    },
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    preConfirm: () => {
      const refRadio = document.querySelector(
        "input[name='reference_radio']:checked",
      ).value;
      let refData;

      try {
        refData = JSON.parse(decodeURIComponent(refRadio));
      } catch {
        // default untuk invoice utama
        refData = {
          reference_type: "main",
          reference_id: mainInvoiceId,
          nominal: remainingAmount,
          description: "Pembayaran invoice utama",
        };
      }

      return {
        pesanan_id: pesananId,
        owner_id: 1,
        user_id: 1,
        tanggal_transaksi:
          document.getElementById("tanggal")?.value ||
          new Date().toISOString().split("T")[0],
        nominal:
          parseInt(
            (document.getElementById("sr_nominal").value || "").replace(
              /\D/g,
              "",
            ),
          ) || refData.nominal,
        keterangan:
          document.getElementById("keterangan").value || refData.description,
        akun_id: document.getElementById("akun_select").value,
        pelanggan_id: pelangganId || "",
        branch_id: 1,
        file: document.getElementById("file").files[0] || null,
        reference_type: refData.reference_type,
        reference_id: refData.reference_id,
      };
    },
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      const formValues = result.value;

      // 🔹 kalau ada file, pakai FormData
      // console.log("📌 Payload ke API (raw):", formValues);
      const formData = new FormData();
      Object.entries(formValues).forEach(([key, val]) => {
        if (val !== null) formData.append(key, val);
      });
      // console.log("📌 Payload ke API:", formData);

      try {
        const res = await fetch(`${baseUrl}/add/sales_receipt`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_TOKEN}`, // 🔑 Bearer Token
          },
          body: formData,
        });

        const data = await res.json();
        // console.log("📌 Response API:", data);

        if (res.ok) {
          // ✅ [DIPERBAIKI] Tampilkan alert dulu, baru refresh
          await Swal.fire(
            "Success",
            "Sales receipt berhasil ditambahkan!",
            "success",
          );
          loadDetailSales(window.detail_id, window.detail_desc);
        } else {
          // ✅ [DIPERBAIKI] Tambah await
          await Swal.fire(
            "Error",
            data.message || "Gagal menambahkan receipt",
            "error",
          );
        }
      } catch (err) {
        console.error("❌ Error:", err);
        // ✅ [DIPERBAIKI] Tambah await
        await Swal.fire(
          "Error",
          "Terjadi kesalahan saat mengirim data",
          "error",
        );
      }
    }
  });
}

async function openEditInvoiceModal() {
  if (!currentInvoiceData) {
    Swal.fire("Error", "Data invoice belum ter-load penuh.", "error");
    return;
  }

  const data = currentInvoiceData;

  const { value: formValues } = await Swal.fire({
    title: "Edit Informasi Invoice",
    width: "600px",
    html: `
      <div class="space-y-4 text-left p-2 text-gray-800">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1 font-semibold">Nomor Invoice</label>
            <input type="text" id="edit_no_inv" class="w-full border rounded px-3 py-2 bg-gray-50 font-medium" readonly value="${data.inv_number || ""}">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1 font-semibold">Tanggal Invoice</label>
            <input type="date" id="edit_tanggal_inv" class="w-full border rounded px-3 py-2" value="${data.invoice_date_ymd || ""}">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1 font-semibold">Nomor PO</label>
            <input type="text" id="edit_no_po" class="w-full border rounded px-3 py-2" value="${data.po_number || ""}">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1 font-semibold">Tanggal PO</label>
            <input type="date" id="edit_tanggal_po" class="w-full border rounded px-3 py-2" value="${data.po_date_ymd || ""}">
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1 font-semibold">Jatuh Tempo (Due Date)</label>
          <input type="date" id="edit_due_date" class="w-full border rounded px-3 py-2" value="${data.due_date_ymd || ""}"> 
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1 font-semibold">Catatan Internal</label>
          <textarea id="edit_internal_notes" rows="3" class="w-full border rounded px-3 py-2" placeholder="Masukkan catatan internal di sini...">${data.internal_notes || ""}</textarea>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan Perubahan",
    cancelButtonText: "Batal",
    customClass: {
      confirmButton:
        "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-sm",
      cancelButton:
        "bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded ml-2",
    },
    buttonsStyling: false,
    preConfirm: () => {
      // Mengambil data dari form modal
      return {
        inv_number: document.getElementById("edit_no_inv").value,
        invoice_date: document.getElementById("edit_tanggal_inv").value,
        po_number: document.getElementById("edit_no_po").value,
        po_date: document.getElementById("edit_tanggal_po").value,
        due_date: document.getElementById("edit_due_date").value,
        internal_notes: document.getElementById("edit_internal_notes").value,
      };
    },
  });

  if (formValues) {
    // Tampilkan loading saat proses simpan
    Swal.fire({
      title: "Menyimpan...",
      text: "Sedang memperbarui informasi invoice",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Hanya menjalankan update info dokumen saja
      await handleSaveInvoiceInfo(formValues);

      // Notifikasi sukses
      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Informasi invoice telah diperbarui.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh data di halaman utama
      loadDetailSales(window.detail_id, window.detail_desc);
    } catch (err) {
      console.error("Gagal simpan edit:", err);
      Swal.fire("Error", "Gagal menyimpan perubahan.", "error");
    }
  }
}

async function handleSaveInvoiceInfo(formData) {
  Swal.fire({
    title: "Menyimpan...",
    text: "Sedang menyimpan perubahan data invoice.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  const bodyData = new FormData();
  bodyData.append("inv_number", formData.inv_number);
  bodyData.append("invoice_date", formData.invoice_date);
  bodyData.append("po_number", formData.po_number);
  bodyData.append("po_date", formData.po_date);

  // [BARU] Tambahkan key due_date dan internal_notes
  bodyData.append("due_date", formData.due_date);
  bodyData.append("internal_notes", formData.internal_notes);

  // Wajib ikut sesuai endpoint
  bodyData.append("pesanan_id", currentInvoiceData.pesanan_id);
  bodyData.append("owner_id", owner_id);
  bodyData.append("user_id", user_id);

  // Upload file kalau ada
  if (formData.files) {
    bodyData.append("files", formData.files);
  }

  try {
    const res = await fetch(
      `${baseUrl}/update/sales_invoice/${window.detail_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: bodyData,
      },
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal menyimpan data.");

    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: result.message || "Data invoice berhasil diperbarui.",
    });

    loadDetailSales(window.detail_id, window.detail_desc);
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
    });
  }
}

/**
 * ======================================
 * FUNGSI BARU: Update Invoice DP
 * ======================================
 */

async function openUpdateDPModal(dpDataString) {
  let dpData;
  try {
    dpData = JSON.parse(decodeURIComponent(dpDataString));
  } catch (e) {
    console.error("Gagal parse data DP:", e);
    Swal.fire("Error", "Gagal memuat data DP.", "error");
    return;
  }

  if (dpData.status_payment === "paid") {
    Swal.fire(
      "Info",
      "Invoice DP yang sudah lunas tidak dapat di-update.",
      "info",
    );
    return;
  }

  // Ambil total kontrak dari variabel global (karena tidak disimpan di table DP)
  const contractAmount = parseFloat(
    currentInvoiceData?.contract_amount || currentInvoiceData?.subtotal || 0,
  );

  // Cek Logic Pajak dari data eksisting
  // Jika ppn_percent > 0 atau is_tax == 1, maka aktifkan checkbox
  const existingTaxPercent = parseFloat(
    dpData.ppn_percent || dpData.tax_percent || 0,
  );
  const isTaxActive = existingTaxPercent > 0 || dpData.is_tax == 1;
  const displayTaxPercent = existingTaxPercent > 0 ? existingTaxPercent : 11;

  // Hitung persentase awal jika backend tidak kirim (backward compatibility)
  let initialPercent = dpData.percentage;
  if (!initialPercent && contractAmount > 0 && dpData.amount > 0) {
    initialPercent = (dpData.amount / contractAmount) * 100;
  }

  const { value: formValues } = await Swal.fire({
    title: "Update Invoice DP",
    width: "600px",
    html: `
  <div class="space-y-3 text-left text-gray-800">
    <div class="grid grid-cols-2 gap-3">
        <div>
            <label class="block text-sm mb-1">Tanggal DP</label>
            <input type="date" id="dp_date_update"
              class="w-full border border-gray-300 rounded px-3 py-2"
              value="${dpData.dp_date || ""}">
        </div>
        <div>
            <label class="block text-sm mb-1">Jatuh Tempo</label>
            <input type="date" id="due_date_update"
              class="w-full border border-gray-300 rounded px-3 py-2"
              value="${dpData.due_date || ""}">
        </div>
    </div>

    <div class="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded border border-gray-300">
        <div class="col-span-12 mb-1 text-xs">
            Basis Kontrak: ${formatRupiah(contractAmount)}
        </div>

        <div class="col-span-4">
            <label class="block text-sm mb-1">Persen (%)</label>
            <div class="relative">
                <input type="number" id="percentage_update" step="0.1"
                    class="w-full border border-gray-300 rounded px-3 py-2 text-right focus:outline-none focus:ring"
                    value="${parseFloat(initialPercent || 0).toFixed(2)}" />
                <span class="absolute right-3 top-2 text-sm text-gray-500">%</span>
            </div>
        </div>

        <div class="col-span-8">
            <label class="block text-sm mb-1">Nominal (Exclude PPN)</label>
            <input type="text" id="amount_update" onkeyup="formatCurrencyInput(this)"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring"
                value="${formatNumber(dpData.amount || 0)}">
        </div>
    </div>

    <div class="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-300">
        <div class="flex items-center gap-2">
            <input type="checkbox" id="is_tax_update" class="w-4 h-4"
              ${isTaxActive ? "checked" : ""}>
            <label for="is_tax_update" class="text-sm">Tax / PPN</label>
        </div>
        <div class="flex items-center gap-1 w-24">
            <input type="number" id="tax_percent_update"
              value="${displayTaxPercent}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none ${
                isTaxActive ? "" : "bg-gray-100"
              }"
              ${isTaxActive ? "" : "disabled"}>
            <span class="text-sm">%</span>
        </div>
    </div>

    <div class="space-y-1 text-right border-t border-gray-300 pt-2 text-sm">
        <div class="flex justify-between">
            <span>PPN Amount:</span>
            <span id="preview_ppn_update">Rp 0</span>
        </div>
        <div class="flex justify-between">
            <span>Total Tagihan (Include PPN):</span>
            <span id="preview_total_update">Rp 0</span>
        </div>
    </div>

    <div>
      <label class="block text-sm mb-1">Deskripsi Invoice</label>
      <textarea id="description_update" rows="2"
        class="w-full border border-gray-300 rounded px-3 py-2">${
          dpData.description || ""
        }</textarea>
    </div>
  </div>
`,

    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan Perubahan",
    cancelButtonText: "Batal",
    // ... (Bagian atas Swal tetap sama) ...

    didOpen: () => {
      // Set tanggal default hari ini
      document.getElementById("dp_date").valueAsDate = new Date();

      const percentageInput = document.getElementById("percentage");
      const amountInput = document.getElementById("amount");
      const isTaxCheck = document.getElementById("is_tax");
      const taxPercentInput = document.getElementById("tax_percent");

      const previewPpn = document.getElementById("preview_ppn_amount");
      const previewTotal = document.getElementById("preview_total_display");

      // --- HELPER: Parsing angka super aman ---
      function parseRupiahInput(inputVal) {
        if (!inputVal) return 0;
        // 1. Hapus SEMUA karakter KECUALI angka (0-9) dan koma (,)
        //    Ini akan otomatis menghapus "Rp", titik ribuan, spasi, dll.
        let clean = inputVal.replace(/[^0-9,]/g, "");

        // 2. Ganti koma (,) jadi titik (.) untuk format float JavaScript
        clean = clean.replace(/,/g, ".");

        return parseFloat(clean) || 0;
      }

      // 1. Logic: Input Persen -> Hitung Nominal
      percentageInput.addEventListener("input", () => {
        let pct = parseFloat(percentageInput.value) || 0;
        let nominal = contractAmount * (pct / 100);

        // formatRupiah: asumsikan fungsi global Anda yang menambahkan format tampilan
        amountInput.value = formatRupiah(nominal);
        calculateFinal();
      });

      // 2. Logic: Input Nominal -> Hitung Persen
      amountInput.addEventListener("keyup", () => {
        let nominal = parseRupiahInput(amountInput.value);

        if (contractAmount > 0) {
          let pct = (nominal / contractAmount) * 100;
          // Tampilkan max 2 desimal
          percentageInput.value = parseFloat(pct.toFixed(2));
        }
        calculateFinal();
      });

      // 3. Logic: Hitung Pajak & Total Akhir
      function calculateFinal() {
        // Gunakan helper parsing yang aman
        let amount = parseRupiahInput(amountInput.value);
        let taxRate = 0;

        if (isTaxCheck.checked) {
          taxPercentInput.removeAttribute("disabled");
          taxPercentInput.classList.remove("bg-gray-100");
          taxRate = parseFloat(taxPercentInput.value) || 0;
        } else {
          taxPercentInput.setAttribute("disabled", true);
          taxPercentInput.classList.add("bg-gray-100");
        }

        let taxValue = amount * (taxRate / 100);
        let total = amount + taxValue;

        // Update UI dengan format Rupiah
        previewPpn.textContent = formatRupiah(taxValue);
        previewTotal.textContent = formatRupiah(total);
      }

      // Event Listeners Tambahan (Checkbox & Input Pajak)
      isTaxCheck.addEventListener("change", calculateFinal);
      taxPercentInput.addEventListener("input", calculateFinal);
    },

    preConfirm: () => {
      // Parsing nilai untuk dikirim ke API
      // Kita lakukan parsing manual di sini agar sama persis logikanya
      const rawVal = document.getElementById("amount").value;
      // Hapus selain angka dan koma -> ganti koma jadi titik
      const cleanVal = rawVal.replace(/[^0-9,]/g, "").replace(/,/g, ".");
      const amountVal = parseFloat(cleanVal) || 0;

      const isTax = document.getElementById("is_tax").checked;
      const taxRate = isTax
        ? parseFloat(document.getElementById("tax_percent").value) || 0
        : 0;

      const ppnAmount = amountVal * (taxRate / 100);
      const totalAmount = amountVal + ppnAmount;

      return {
        dp_date: document.getElementById("dp_date").value,
        due_date: document.getElementById("due_date").value,

        // Data Nominal yang sudah bersih (Float/Integer)
        amount: amountVal,
        percentage:
          parseFloat(document.getElementById("percentage").value) || 0,
        ppn_percent: taxRate,
        ppn_amount: ppnAmount,
        total_amount: totalAmount,

        description: document.getElementById("description").value,
      };
    },

    // ... (Sisa kode sama) ...
  });

  if (formValues) {
    await handleUpdateDP(formValues);
  }
}

async function handleUpdateDP(formValues) {
  Swal.fire({
    title: "Menyimpan...",
    text: "Sedang memperbarui data Invoice DP.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(`${baseUrl}/update/sales_dp/${formValues.dp_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        pesanan_id: currentInvoiceData.pesanan_id,
        invoice_id: window.detail_id,
        owner_id: owner_id,
        user_id: user_id,

        dp_date: formValues.dp_date,
        due_date: formValues.due_date,

        // PAYLOAD UTAMA
        amount: formValues.amount, // Nominal Dasar
        percentage: formValues.percentage, // Persentase
        ppn_percent: formValues.ppn_percent, // 11 atau 0
        ppn_amount: formValues.ppn_amount, // Nilai Pajak
        total_amount: formValues.total_amount, // Nominal + Pajak

        description: formValues.description,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Gagal memperbarui data DP");
    }

    const result = await res.json();

    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: result.message || "Invoice DP berhasil diperbarui",
    });

    loadModuleContent("invoice_detail", window.detail_id, window.detail_desc);
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
    });
  }
}

// ================================================================
// MODULE: INVOICE FILE MANAGEMENT
// ================================================================

var currentInvoiceData = null; // Inisialisasi variabel global

// 1. Fetch List File
async function fetchInvoiceFiles(invoiceId) {
  const container = document.getElementById("fileSection");

  // Tampilkan loading state
  container.innerHTML = `
        <div class="flex items-center justify-center p-4 text-gray-400 text-xs">
            <span class="animate-spin mr-2">⌛</span> Memuat file...
        </div>
    `;

  try {
    // Cache buster agar list selalu fresh
    const res = await fetch(
      `${baseUrl}/list/invoice_file/${invoiceId}?_t=${new Date().getTime()}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      },
    );
    const json = await res.json();

    const files = json.listData || json.data || [];

    if (files.length === 0) {
      container.innerHTML = `<div class="text-gray-400 italic text-center p-2 text-xs">- Tidak ada file pendukung -</div>`;
      return;
    }

    container.innerHTML = "";

    files.forEach((f) => {
      const fullUrl = f.file;
      const fileName = fullUrl.split("/").pop() || "Dokumen";
      const fileId = f.id;

      const ext = fileName.split(".").pop().toLowerCase();
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
      const isPdf = ext === "pdf";

      let icon = "📄";
      if (isImage) icon = "🖼️";
      if (isPdf) icon = "📕";

      const div = document.createElement("div");
      div.className =
        "flex items-center justify-between border p-2 rounded bg-gray-50 hover:bg-gray-100 transition mb-2 group";

      const typeParam = isImage ? "image" : isPdf ? "pdf" : "other";

      div.innerHTML = `
                <div class="flex items-center gap-2 overflow-hidden cursor-pointer" onclick="previewInvoiceFile('${fileName}', '${typeParam}', '${fullUrl}')">
                    <span class="text-lg">${icon}</span>
                    <div class="flex flex-col overflow-hidden">
                        <span class="text-sm font-medium text-blue-600 truncate max-w-[180px] hover:underline" title="${fileName}">
                            ${fileName}
                        </span>
                    </div>
                </div>
                <button onclick="deleteInvoiceFile('${fileId}')" 
                    class="text-gray-300 hover:text-red-500 p-1 rounded transition opacity-0 group-hover:opacity-100" 
                    title="Hapus File">
                    🗑️
                </button>
            `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Gagal load invoice file:", err);
    container.innerHTML = `<div class="text-red-400 text-xs italic text-center p-2">Gagal memuat file.</div>`;
  }
}

// 2. Fungsi Upload (Single File: Image & PDF)
async function uploadInvoiceFile() {
  const fileInput = document.getElementById("files");
  const file = fileInput.files[0]; // Ambil file pertama saja

  // Validasi Dasar
  if (!window.detail_id) {
    return Swal.fire(
      "Error",
      "ID Invoice tidak ditemukan. Silakan refresh halaman.",
      "error",
    );
  }
  if (!file) {
    return Swal.fire("Warning", "Pilih file terlebih dahulu.", "warning");
  }

  // --- VALIDASI TIPE FILE (Gambar + PDF) ---
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return Swal.fire(
      "Error",
      "Format file tidak didukung. Harap upload Gambar (JPG/PNG) atau PDF.",
      "error",
    );
  }

  // Ambil Data Global (Pastikan Integer)
  const ownerId = typeof owner_id !== "undefined" ? parseInt(owner_id) : 0;
  const userId = typeof user_id !== "undefined" ? parseInt(user_id) : 0;
  const projectId = currentInvoiceData?.project_id
    ? parseInt(currentInvoiceData.project_id)
    : 0;
  const pesananId = currentInvoiceData?.pesanan_id
    ? parseInt(currentInvoiceData.pesanan_id)
    : 0;

  const formData = new FormData();
  formData.append("invoice_id", window.detail_id); // ID Utama
  formData.append("file", file); // Key 'file' untuk single upload

  // Data pelengkap wajib untuk menghindari 500 error di backend
  formData.append("owner_id", ownerId);
  formData.append("user_id", userId);
  formData.append("project_id", projectId);

  // Tambahkan pesanan_id (Sales Order ID) karena ini modul Sales
  if (pesananId > 0) {
    formData.append("pesanan_id", pesananId);
  }

  Swal.fire({ title: "Mengupload...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${baseUrl}/add/invoice_file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });

    // Handle jika response bukan JSON (misal HTML error 500)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server Error (500). Gagal memproses data.");
    }

    const json = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "File berhasil diunggah.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Reset input & Refresh list
      fileInput.value = "";
      fetchInvoiceFiles(window.detail_id);
    } else {
      throw new Error(json.message || "Gagal upload file.");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", err.message, "error");
  }
}

// 3. Fungsi Delete
async function deleteInvoiceFile(fileId) {
  const result = await Swal.fire({
    title: "Hapus File?",
    text: "File akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    confirmButtonColor: "#d33",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${baseUrl}/delete/invoice_file/${fileId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Terhapus",
        text: "File berhasil dihapus.",
        timer: 1000,
        showConfirmButton: false,
      });
      // Refresh list langsung
      fetchInvoiceFiles(window.detail_id);
    } else {
      throw new Error("Gagal menghapus file.");
    }
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

// 4. Fungsi Preview (Dengan Auth Token untuk Gambar & Force Download Logic)
async function previewInvoiceFile(title, type, url) {
  const modal = document.getElementById("previewModal");
  if (!modal) {
    return window.open(url, "_blank");
  }

  const modalTitle = document.getElementById("modalTitle");
  const img = document.getElementById("previewImage");
  const iframe = document.getElementById("previewFrame");
  const btnDownload = document.getElementById("btnDownload");
  const loading = document.getElementById("previewLoading");

  // Reset State UI
  img.classList.add("hidden");
  iframe.classList.add("hidden");
  loading.classList.remove("hidden");

  // Reset Loading Content (Default Spinner)
  loading.innerHTML = `
        <span class="text-2xl animate-spin">⌛</span>
        <span class="mt-2 text-sm">Memuat Preview...</span>
    `;

  img.src = "";
  iframe.src = "";

  modalTitle.innerText = title;

  // --- SETUP DOWNLOAD BUTTON AGAR LANGSUNG DOWNLOAD (Bukan New Tab) ---
  btnDownload.removeAttribute("href"); // Hapus href agar tidak link biasa
  btnDownload.style.cursor = "pointer";
  btnDownload.innerHTML = "⬇️ Download"; // Reset text

  // Handler Default untuk Download (Fetch Blob -> Auto Download)
  // Digunakan untuk PDF dan file lainnya (selain image yang sudah diload)
  btnDownload.onclick = async (e) => {
    e.preventDefault();
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = "⏳ ...";
    btnDownload.style.pointerEvents = "none";

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      if (!res.ok) throw new Error("Gagal download");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Buat anchor sementara untuk trigger download
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Gagal mengunduh file.", "error");
    } finally {
      btnDownload.innerHTML = originalText;
      btnDownload.style.pointerEvents = "auto";
    }
  };

  modal.classList.remove("hidden");

  if (type === "image") {
    // --- LOGIC GAMBAR (Preview + Download Optimized) ---
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      if (!res.ok) throw new Error("Gagal load gambar");

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      img.src = objectUrl;
      img.onload = () => {
        loading.classList.add("hidden");
        img.classList.remove("hidden");
      };

      // Override tombol download pakai Blob yang sudah ada (biar gak fetch 2x)
      btnDownload.onclick = (e) => {
        e.preventDefault();
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
    } catch (e) {
      console.error(e);
      loading.innerHTML =
        '<span class="text-red-500 text-sm">Gagal memuat gambar (Akses Ditolak/Error Network)</span>';
    }
  } else if (type === "pdf") {
    // --- LOGIC PDF (No Preview, Message Only) ---
    loading.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div class="text-6xl mb-4 text-red-500 drop-shadow-md">📄</div>
                <h3 class="text-lg font-bold text-gray-700 mb-2">Pratinjau Tidak Tersedia</h3>
                <p class="text-sm text-gray-500 mb-4 max-w-xs leading-relaxed">
                    File PDF tidak dapat ditampilkan langsung di sini. <br>
                    Silakan unduh file untuk melihat isinya.
                </p>
                <div class="text-xs text-blue-500 font-semibold bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-100">
                    ⬇️ Gunakan tombol Download di atas
                </div>
            </div>
        `;
    // Tombol download sudah di-handle oleh default handler di atas
  } else {
    // --- LOGIC FILE LAIN ---
    loading.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center">
                <div class="text-6xl mb-4 text-blue-500">📁</div>
                <h3 class="text-lg font-bold text-gray-700 mb-2">Pratinjau Tidak Tersedia</h3>
                <p class="text-sm text-gray-500 mb-4 max-w-xs">
                    Format file ini tidak mendukung pratinjau.<br>
                    Silakan unduh file untuk melihat isinya.
                </p>
            </div>
        `;
  }
}

// Helper: Close Preview
function closePreview() {
  const modal = document.getElementById("previewModal");
  if (modal) {
    modal.classList.add("hidden");
    setTimeout(() => {
      if (document.getElementById("previewImage"))
        document.getElementById("previewImage").src = "";
      if (document.getElementById("previewFrame"))
        document.getElementById("previewFrame").src = "";
    }, 300);
  }
}

// Keyboard Listener untuk tutup modal
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closePreview();
  }
});
