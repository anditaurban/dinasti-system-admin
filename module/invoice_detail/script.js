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

    document.getElementById("contract_amount").innerHTML =
      finance(data.subtotal) || "";
    document.getElementById("diskon").innerHTML = finance(data.disc) || "";
    document.getElementById("ppn").innerHTML = finance(data.ppn) || "";
    document.getElementById("total").innerHTML = finance(data.total) || "";

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
                  item.unit_price || 0
                )}</td>
                <td class="px-3 py-2 text-right align-top">${formatNumber(
                  item.total || item.qty * item.unit_price
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
              m.unit_price || 0
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
    // 🔹 Render Pembayaran
    // ===========================
    const pembayaranSection = document.getElementById("pembayaranSection");
    pembayaranSection.innerHTML = "";
    if (data.payments?.length) {
      data.payments.forEach((p) => {
        const div = document.createElement("div");
        div.className = "border p-2 rounded bg-gray-50 text-sm mb-1";
        div.innerHTML = `
          <div class="flex justify-between">
            <span>💳 ${p.description || "Pembayaran"}</span>
            <span class="font-medium text-green-700">${formatNumber(
              p.amount || 0
            )}</span>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>📅 ${p.payment_date || "-"}</span>
            <span>🏦 ${p.account.nama_akun || "Cash"}</span>
          </div>`;
        pembayaranSection.appendChild(div);
      });
    } else {
      pembayaranSection.innerHTML = `<div class="text-gray-500 italic">-</div>`;
    }

    // console.log('DP: ', data.down_payments);
    // console.log('DP: ', data.down_payments);
    const dpString = encodeURIComponent(
      JSON.stringify(data.down_payments || [])
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
    // 🔹 Invoice Uang Muka
    // ===========================
    const uangMukaSection = document.getElementById("uangMukaSection");
    uangMukaSection.innerHTML = "";

    if (data.down_payments?.length) {
      data.down_payments.forEach((dp) => {
        const div = document.createElement("div");
        div.className = "border p-2 rounded bg-gray-50 text-sm mb-2";

        // [BARU] Ubah data 'dp' menjadi string agar aman ditaruh di HTML
        const dpDataString = encodeURIComponent(JSON.stringify(dp));

        div.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
           <div>
            <span class="block">${dp.dp_number || "DP"}</span>
            <span class="block font-medium text-green-700 mt-1">
              ${formatNumber(dp.amount || 0)}
            </span>
          </div>

            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>${dp.description || "-"}</span>
              <span>${dp.status_payment || "Unpaid"}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1 ml-4">
            
            <button 
              onclick="openUpdateDPModal('${dpDataString}')" 
              class="px-2 py-1 border rounded text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
              ✏️ Update
            </button>

            <button 
              onclick="printInvoiceDP('${dp.dp_id}')" 
              class="px-2 py-1 border rounded text-xs bg-green-50 text-green-700 hover:bg-green-100">
              🖨 Print
            </button>
          </div>
        </div>
      `;
        uangMukaSection.appendChild(div);
      });
    } else {
      uangMukaSection.innerHTML = `<div class="text-gray-500 italic">-</div>`;
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
    Swal.close();
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

async function tambahUangMuka(pesananId) {
  const { value: formValues } = await Swal.fire({
    title: "Tambah Uang Muka",
    html: `
      <div class="space-y-3 text-left">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Tanggal DP</label>
          <input type="date" id="dp_date" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Jatuh Tempo</label>
          <input type="date" id="due_date" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Jumlah (Rp)</label>
          <input type="number" id="amount" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring" placeholder="1000000" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Keterangan</label>
          <textarea id="description" rows="2" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring" placeholder="Contoh: Uang muka 50% untuk proyek ABC"></textarea>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    preConfirm: () => {
      return {
        dp_date: document.getElementById("dp_date").value,
        due_date: document.getElementById("due_date").value,
        amount: document.getElementById("amount").value,
        description: document.getElementById("description").value,
      };
    },
  });

  if (formValues) {
    try {
      const res = await fetch(`${baseUrl}/add/sales_dp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`, // 🔑 pastikan token selalu dipakai
        },
        body: JSON.stringify({
          pesanan_id: pesananId,
          owner_id: owner_id,
          user_id: user_id,
          dp_date: formValues.dp_date,
          due_date: formValues.due_date,
          amount: parseFloat(formValues.amount) || 0,
          percentage: "", // bisa diisi manual kalau dibutuhkan
          description: formValues.description,
          invoice_id: window.detail_id,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data DP");

      const result = await res.json();

      // ✅ [DIPERBAIKI] Tunggu alert ini selesai
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: result.message || "Uang muka berhasil ditambahkan",
      });

      // ✅ [DIPERBAIKI] Baru refresh setelah alert ditutup
      loadModuleContent("invoice_detail", window.detail_id, window.detail_desc);
      console.log("✅ DP berhasil ditambahkan:", result);
    } catch (err) {
      // ✅ [DIPERBAIKI] Tambahkan await
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
      }
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
  mainInvoiceId
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
            </option>`
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
          })
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
          dp.amount
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
          <input type="date" id="tanggal"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" required>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pembayaran Berdasarkan</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 border rounded p-2 hover:bg-gray-50 cursor-pointer">
              <input type="radio" name="reference_radio" value="main" data-nominal="${remainingAmount}" class="form-radio" checked>
              <span class="text-sm">Invoice Utama (Total: ${formatRupiah(
                totalOrder
              )}, Sisa: ${formatRupiah(remainingAmount)})</span>
            </label>
            ${dpOptions}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nominal Bayar</label>
          <input type="text" id="sr_nominal"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            placeholder="Masukkan nominal">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
          <textarea id="keterangan" rows="2"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            placeholder="Masukkan keterangan"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Akun</label>
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
        "input[name='reference_radio']:checked"
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
              ""
            )
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
            "success"
          );
          loadDetailSales(window.detail_id, window.detail_desc);
        } else {
          // ✅ [DIPERBAIKI] Tambah await
          await Swal.fire(
            "Error",
            data.message || "Gagal menambahkan receipt",
            "error"
          );
        }
      } catch (err) {
        console.error("❌ Error:", err);
        // ✅ [DIPERBAIKI] Tambah await
        await Swal.fire(
          "Error",
          "Terjadi kesalahan saat mengirim data",
          "error"
        );
      }
    }
  });
}

/**
 * ======================================
 * FUNGSI BARU: Edit Info Invoice
 * ======================================
 */

/**
 * 1. Membuka modal (pop-up) SweetAlert
 * Berisi form yang sudah diisi data dari 'currentInvoiceData'
 */
async function openEditInvoiceModal() {
  if (!currentInvoiceData) {
    Swal.fire(
      "Error",
      "Data invoice belum ter-load penuh. Silakan coba lagi.",
      "error"
    );
    return;
  }

  const data = currentInvoiceData;

  // [DIHAPUS] Logika parsing tanggal (formattedInvDate) tidak diperlukan lagi

  const { value: formValues } = await Swal.fire({
    title: "Edit Informasi Invoice",
    width: "600px",
    html: `
      <div class="space-y-3 text-left p-2">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Nomor Invoice</label>
            <input type="text" id="edit_no_inv" class="w-full border rounded px-3 py-2" 
              value="${data.inv_number || ""}">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Tanggal Invoice</label>
            <input type="date" id="edit_tanggal_inv" class="w-full border rounded px-3 py-2" 
              value="${data.invoice_date_ymd || ""}">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Nomor PO</label>
            <input type="text" id="edit_no_po" class="w-full border rounded px-3 py-2" 
              value="${data.po_number || ""}">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Tanggal PO</label>
            <input type="date" id="edit_tanggal_po" class="w-full border rounded px-3 py-2" 
              value="${data.po_date_ymd || ""}">
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1">Upload File (Invoice / PO)</label>
          <input type="file" id="edit_file" class="w-full border rounded px-3 py-2 bg-white">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan Perubahan",
    cancelButtonText: "Batal",
    preConfirm: () => {
      return {
        inv_number: document.getElementById("edit_no_inv").value,
        invoice_date: document.getElementById("edit_tanggal_inv").value,
        po_number: document.getElementById("edit_no_po").value,
        po_date: document.getElementById("edit_tanggal_po").value,
        files: document.getElementById("edit_file").files[0] || null,
      };
    },
  });

  if (formValues) {
    await handleSaveInvoiceInfo(formValues);
  }
}
// ===========================================================
// FUNGSI SIMPAN KE API
// ===========================================================
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
      }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal menyimpan data.");

    // ✅ [DIPERBAIKI] Tunggu alert ini selesai
    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: result.message || "Data invoice berhasil diperbarui.",
    });

    // ✅ [DIPERBAIKI] Baru refresh setelah alert ditutup
    loadDetailSales(window.detail_id, window.detail_desc);
  } catch (err) {
    // ✅ [DIPERBAIKI] Tambah await
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

/**
 * 1. Membuka modal (pop-up) SweetAlert
 * Berisi form yang sudah diisi data DP yang ada.
 */
async function openUpdateDPModal(dpDataString) {
  let dpData;
  try {
    // Ambil data DP yang kita kirim dari tombol
    dpData = JSON.parse(decodeURIComponent(dpDataString));
  } catch (e) {
    console.error("Gagal parse data DP:", e);
    Swal.fire("Error", "Gagal memuat data DP. Data tidak valid.", "error");
    return;
  }

  // OPSIONAL: Cek jika status sudah 'paid', mungkin tidak bisa di-edit
  // Hapus blok 'if' ini jika Anda ingin tetap bisa mengedit DP yang sudah lunas
  if (dpData.status_payment === "paid") {
    Swal.fire(
      "Info",
      "Invoice DP yang sudah lunas (paid) tidak dapat di-update.",
      "info"
    );
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: "Update Invoice DP",
    html: `
      <div class="space-y-3 text-left">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Tanggal DP</label>
          <input type="date" id="dp_date_update" class="w-full border rounded px-3 py-2" value="${
            dpData.dp_date || ""
          }">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Jatuh Tempo</label>
          <input type="date" id="due_date_update" class="w-full border rounded px-3 py-2" value="${
            dpData.due_date || ""
          }">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Jumlah (Rp)</label>
          <input type="number" id="amount_update" class="w-full border rounded px-3 py-2" value="${
            dpData.amount || 0
          }">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Keterangan</label>
          <textarea id="description_update" rows="2" class="w-full border rounded px-3 py-2">${
            dpData.description || ""
          }</textarea>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan Perubahan",
    cancelButtonText: "Batal",
    preConfirm: () => {
      return {
        dp_date: document.getElementById("dp_date_update").value,
        due_date: document.getElementById("due_date_update").value,
        amount: document.getElementById("amount_update").value,
        description: document.getElementById("description_update").value,
        dp_id: dpData.dp_id, // Kirim ID DP untuk update
      };
    },
  });

  if (formValues) {
    // Jika user klik "Simpan", panggil fungsi handler
    await handleUpdateDP(formValues);
  }
}

/**
 * 2. Mengirim data update ke API
 * (Fungsi ini dipanggil oleh openUpdateDPModal)
 * * [VERSI BARU DISESUAIKAN DENGAN ENDPOINT /update/sales_dp/ID]
 */
async function handleUpdateDP(formValues) {
  // Tampilkan loading
  Swal.fire({
    title: "Menyimpan...",
    text: "Sedang memperbarui data Invoice DP.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // [DIUBAH] Gunakan endpoint dengan ID di URL
    const res = await fetch(`${baseUrl}/update/sales_dp/${formValues.dp_id}`, {
      method: "PUT", // atau PUT/PATCH, sesuaikan dengan API Anda
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      // [DIUBAH] Sesuaikan payload body
      body: JSON.stringify({
        // Ambil ID konteks dari data invoice utama
        pesanan_id: currentInvoiceData.pesanan_id,
        invoice_id: window.detail_id,

        // Data dari form modal
        dp_date: formValues.dp_date,
        due_date: formValues.due_date,
        amount: parseFloat(formValues.amount) || 0,
        description: formValues.description,
        percentage: "", // Sesuai contoh payload Anda

        // ID user/owner
        user_id: user_id,
        owner_id: owner_id,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Gagal memperbarui data DP");
    }

    const result = await res.json();

    // ✅ [DIPERBAIKI] Tunggu alert ini selesai
    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: result.message || "Invoice DP berhasil diperbarui",
    });

    // ✅ [DIPERBAIKI] Baru refresh setelah alert ditutup
    loadModuleContent("invoice_detail", window.detail_id, window.detail_desc);
  } catch (err) {
    // ✅ [DIPERBAIKI] Tambah await
    await Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
    });
  }
}
