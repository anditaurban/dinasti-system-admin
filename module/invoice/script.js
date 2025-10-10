pagemodule = "Invoice";
subpagemodule = "";
renderHeader();
colSpanCount = 9;
setDataType("sales_invoice");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;
  const dpString = encodeURIComponent(JSON.stringify(item.invoiceDP || []));

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.invoice_date}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No. Invoice</span>
      ${item.inv_number}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No. PO</span>  
      ${item.po_number}
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
      <span class="font-medium sm:hidden">Jenis Project</span>
      ${item.project_type}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">PIC</span>
      ${item.pic_name}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Status</span>
      ${
        item.status || "Pending"
      } <!-- Assuming status might not be in the response -->
    </td>


      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">

      <button 
    onclick="event.stopPropagation(); 
      loadModuleContent('invoice_detail', '${item.invoice_id}', '${item.inv_number}');
      ;"
    class="block w-full text-left px-4 py-2 hover:bg-gray-100">
    👁️ View Detail
  </button>
        
      ${
      (item.project === 'yes')
        ? `<button 
          onclick="openCreateProject('${item.pesanan_id}', '${item.nilai_kontrak}')"
          class="block w-full text-left px-4 py-2 hover:bg-gray-100">
          📝 Create Project
        </button>
    `
        : ""
    }
      </div>


  </tr>`;
};

async function openSalesReceiptModal(pesananId, pelangganId, totalInvoice, sisaBayar, invoiceDP) {
  const totalOrder = totalInvoice;
  const remainingAmount = sisaBayar;
  // console.log('data invoice DP: ', invoiceDP)
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
      const value = encodeURIComponent(JSON.stringify({
        reference_type: "dp",
        reference_id: dp.invoiceDP_id,
        nominal: dp.nominal_invoiceDP,
        description: dp.description || "",
        status_payment: dp.status_payment
      }))

        return `
        <label class="flex items-center space-x-2 border rounded p-2 hover:bg-gray-50 cursor-pointer ${disabled && "opacity-50"}">
          <input type="radio" name="reference_radio" 
                 value="${value}"
                 data-nominal="${dp.nominal_invoiceDP}" 
                 data-description="${dp.description || ""}"
                 class="form-radio" ${disabled}>
          <span class="text-sm">
            ${dp.nomor_invoiceDP} - ${formatRupiah(dp.nominal_invoiceDP)} 
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

        <!-- Tanggal -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
          <input type="date" id="tanggal"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" required>
        </div>

        <!-- Pilihan sumber pembayaran -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pembayaran Berdasarkan</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 border rounded p-2 hover:bg-gray-50 cursor-pointer">
              <input type="radio" name="reference_radio" value="main" data-nominal="${remainingAmount}" class="form-radio" checked>
              <span class="text-sm">Invoice Utama (Total: ${formatRupiah(totalOrder)}, Sisa: ${formatRupiah(remainingAmount)})</span>
            </label>
            ${dpOptions}
          </div>
        </div>

        <!-- Nominal -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nominal Bayar</label>
          <input type="text" id="sr_nominal"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            placeholder="Masukkan nominal">
        </div>

        <!-- Keterangan -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
          <textarea id="keterangan" rows="2"
            class="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            placeholder="Masukkan keterangan"></textarea>
        </div>

        <!-- Akun -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Akun</label>
          <select id="akun_select"
            class="w-full border rounded px-3 py-2 bg-white focus:ring focus:ring-blue-200 focus:border-blue-500"
            required>
            ${akunOptions}
          </select>
        </div>

        <!-- File -->
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
      document.querySelectorAll("input[name='reference_radio']").forEach((radio) => {
        radio.addEventListener("change", (e) => {
          const nominal = e.target.dataset.nominal || 0;
          const desc = e.target.dataset.description || "";
          document.getElementById("sr_nominal").value = formatRupiah(nominal);
          if (desc) {
            document.getElementById("keterangan").value = desc;
          } else {
            document.getElementById("keterangan").value = "Pembayaran Invoice Utama";
          }
        });
      });

      // Set default nominal = sisa invoice utama
      document.getElementById("sr_nominal").value = formatRupiah(remainingAmount);
      document.getElementById("keterangan").value = "Pembayaran Invoice Utama";
    },
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
preConfirm: () => {
  const refRadio = document.querySelector("input[name='reference_radio']:checked").value;
  let refData;

  try {
    refData = JSON.parse(decodeURIComponent(refRadio));
  } catch {
    // default untuk invoice utama
    refData = {
      reference_type: "main",
      reference_id: pesananId,
      nominal: remainingAmount,
      description: "Pembayaran invoice utama",
    };
  }

return {
        pesanan_id: pesananId,
        owner_id: 1,
        user_id: 1,
        tanggal_transaksi: document.getElementById("tanggal")?.value || new Date().toISOString().split("T")[0],
        nominal: parseInt((document.getElementById("sr_nominal").value || "").replace(/\D/g, "")) || refData.nominal,
        keterangan: document.getElementById("keterangan").value || refData.description,
        akun_id: document.getElementById("akun_select").value,
        pelanggan_id: pelangganId || "",
        branch_id: 1,
        file: document.getElementById("file").files[0] || null,
        reference_type: refData.reference_type,
        reference_id: refData.reference_id,
      };
    }
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
          Swal.fire("Success", "Sales receipt berhasil ditambahkan!", "success");
        } else {
          Swal.fire("Error", data.message || "Gagal menambahkan receipt", "error");
        }
      } catch (err) {
        console.error("❌ Error:", err);
        Swal.fire("Error", "Terjadi kesalahan saat mengirim data", "error");
      }
    }
  });
}

async function openCreateProject(pesanan_id, nilai_kontrak) {
  // ambil daftar project manager
  let pmOptions = "";
  try {
    const res = await fetch(`${baseUrl}/list/project_manager/${owner_id}`, {
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
    });
    const data = await res.json();

    if (data.listData && data.listData.length > 0) {
      pmOptions = data.listData.map(pm => 
        `<option value="${pm.employee_id}">${pm.name} (${pm.alias})</option>`
      ).join("");
    }
  } catch (err) {
    console.error("Gagal ambil PM:", err);
    pmOptions = `<option value="">Gagal load PM</option>`;
  }

  Swal.fire({
    title: "Buat Project Baru",
    html: `
      <div class="space-y-3 text-left">
        <label class="block text-sm font-medium text-gray-700">Project Manager</label>
        <select id="project_manager_id" class="w-full p-2 border rounded-lg">
          ${pmOptions}
        </select>

        <label class="block text-sm font-medium text-gray-700">Plan Costing</label>
        <input id="plan_costing" type="number" value="${nilai_kontrak}" class="w-full p-2 border rounded-lg">

        <label class="block text-sm font-medium text-gray-700">Start Date</label>
        <input id="start_date" type="date" value="2025-09-10" class="w-full p-2 border rounded-lg">

        <label class="block text-sm font-medium text-gray-700">Finish Date</label>
        <input id="finish_date" type="date" value="2025-12-31" class="w-full p-2 border rounded-lg">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    preConfirm: async () => {
      const project_manager_id = document.getElementById("project_manager_id").value;
      const plan_costing = document.getElementById("plan_costing").value;
      const start_date = document.getElementById("start_date").value;
      const finish_date = document.getElementById("finish_date").value;

      try {
        const res = await fetch(`${baseUrl}/add/project`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify({
            pesanan_id,
            project_manager_id: Number(project_manager_id),
            plan_costing: Number(plan_costing),
            start_date,
            finish_date
          })
        });

        const data = await res.json();
        if (data.data.success === true) {
          Swal.fire("Sukses", data.data.message || "Project berhasil dibuat", "success");
        } else {
          Swal.fire("Gagal", data.data.message || "Gagal membuat project", "error");
        }
      } catch (err) {
        console.error("Error create project:", err);
        Swal.fire("Error", "Terjadi kesalahan server", "error");
      }
    }
  });
}



