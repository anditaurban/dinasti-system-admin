pagemodule = "Account Receivable";
subpagemodule = "";
renderHeader();
colSpanCount = 13;
setDataType("account_receivable");
fetchAndUpdateData();

// Data Dummy untuk Tabel Utama AR
dummyARData = [
    {
        receipt_id: "RCP-001",
        project_name: "Pengembangan SuperApp BogoAPP",
        tanggal_transaksi: "2026-02-20",
        inv_number: "INV/2026/001",
        pelanggan_nama: "PT. Maju Bersama",
        received_amount: 5000000,
        received_percentage: 50,
        balance_amount: 5000000,
        balance_percentage: 50,
        keterangan: "Pembayaran Tahap 1",
        nama_akun: "Bank Mandiri",
        number_account: "123456789",
        owner_account: "Akbar",
        aging_days: "5 Days",
        receivable_status: "Received"
    }
];

// Data Dummy untuk Riwayat Cicilan (Detail)
dummyDetailData = [
    {
        receipt_detail_id: "DET-001",
        receipt_number: "RCP-DB-001",
        tanggal_transaksi: "2026-02-21",
        keterangan: "DP 30% Awal",
        nominal: 3000000,
        nama_akun: "BCA Digital"
    },
    {
        receipt_detail_id: "DET-002",
        receipt_number: "RCP-DB-002",
        tanggal_transaksi: "2026-02-22",
        keterangan: "Cicilan ke-2",
        nominal: 2000000,
        nama_akun: "BCA Digital"
    }
];

window.rowTemplate = function (item, index, perPage = 10) {
  return `
  <tr class="flex flex-col sm:table-row border-b border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition">
    
    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="text-xs text-gray-500">${item.tanggal_transaksi}</div>
        <div class="text-gray-900 font-medium break-all">${
          item.inv_number
        }</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-bold text-gray-900 line-clamp-2">${
          item.project_name
        }</div>
        <div class="text-xs text-gray-500">${item.pelanggan_nama}</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-medium text-gray-900">${finance(
          item.received_amount
        )}</div>
        <div class="text-xs text-gray-500">${
          item.received_percentage
        }% from Total</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-medium text-gray-900">${finance(
          item.balance_amount
        )}</div>
        <div class="text-xs text-gray-500">${
          item.balance_percentage
        }% from Total</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="text-gray-700 line-clamp-3">${item.keterangan}</div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
       <div class="flex flex-col">
        ${
          item.nama_akun !== "-"
            ? `<span class="font-semibold">${item.nama_akun} (${item.number_account})</span>`
            : "-"
        }
        <span class="text-xs text-gray-500">${
          item.owner_account !== "-" ? item.owner_account : ""
        }</span>
      </div>
    </td>

    <td class="align-middle px-4 py-3 border-r border-gray-200 text-center sm:table-cell">
      <span class="text-xs font-medium text-gray-600 block">
        ${item.aging_days.replace("days", "Days").replace("to", "<br>to")}
      </span>
    </td>

    <td class="align-middle px-4 py-3 text-center sm:table-cell">
      <span class="text-xs font-bold px-2 py-1 rounded ${
        item.receivable_status === "Received"
          ? "text-green-700 bg-green-100"
          : "text-gray-600 bg-gray-200"
      }">
        ${item.receivable_status.toUpperCase()}
      </span>
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow-lg z-50 text-sm right-0 mt-2 py-1">
        
       <button onclick="event.stopPropagation(); viewReceiptHistory('${item.receipt_id}', '${item.project_name.replace(/'/g, "\\'")}');"
    class="block w-full text-left px-4 py-2 hover:bg-gray-100 transition">
    👁️ Riwayat Penerimaan
</button>

         <button onclick="event.stopPropagation(); showExpenseModal('${
                item.keuangan_id
              }')"
                class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 transition duration-150 ease-in-out">
                ✏️ Edit
          </button>


        <div class="border-t my-1"></div>

        <button onclick="event.stopPropagation(); confirmPayment('${
          item.receipt_id
        }', 2);" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600 transition">
            ✅ Valid
        </button>
        
        <button onclick="event.stopPropagation(); confirmPayment('${
          item.receipt_id
        }', 3);" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 transition">
            ❌ Tidak Valid
        </button>

    

      </div>
    </td>

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

function validateFormData(formData, requiredFields = []) {
  console.log("Validasi Form");
  for (const { field, message } of requiredFields) {
    if (!formData[field] || formData[field].trim() === "") {
      alert(message);
      return false;
    }
  }
  return true;
}

async function fillFormData(data) {
  console.log(data);
  // Helper untuk menunggu sampai <option> tersedia
  async function waitForOption(selectId, expectedValue, timeout = 3000) {
    return new Promise((resolve) => {
      const interval = 100;
      let waited = 0;

      const check = () => {
        const select = document.getElementById(selectId);
        const exists = Array.from(select.options).some(
          (opt) => opt.value === expectedValue?.toString()
        );
        if (exists || waited >= timeout) {
          resolve();
        } else {
          waited += interval;
          setTimeout(check, interval);
        }
      };

      check();
    });
  }

  // Pastikan value bertipe string
  const roleValue = data.role || "";
  //   const levelValue = data.level || '';

  // Tunggu sampai option-nya ada
  await waitForOption("formRole", roleValue);
  //   await waitForOption('formLevel', levelValue);

  // Set nilai ke form
  const formRole = document.getElementById("formRole");
  //   const formLevel = document.getElementById('formLevel');
  formRole.value = roleValue;
  //   formLevel.value = levelValue;

  document.getElementById("formName").value = data.name || "";
  document.getElementById("formPhone").value = String(data.wa_login || "");
  document.getElementById("formEmail").value = data.email || "";
}

async function loadDropdown(selectId, apiUrl, valueField, labelField) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">Loading...</option>`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    console.log(`Data untuk ${selectId}:`, result);
    const listData = result.listData;

    select.innerHTML = `<option value="">Pilih...</option>`;

    if (Array.isArray(listData)) {
      listData.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[labelField];
        select.appendChild(option);
      });
    } else {
      console.error("Format listData tidak sesuai:", listData);
    }
  } catch (error) {
    console.error(`Gagal memuat data untuk ${selectId}:`, error);
    select.innerHTML = `<option value="">Gagal memuat data</option>`;
  }
}

function loadDropdownCall() {
  // loadDropdown('formProject', `${baseUrl}/list/project_won/${owner_id}`, 'pesanan_id', 'project_name');
  // loadDropdown('formPM', `${baseUrl}/list/project_manager/${owner_id}`, 'project_manager_id', 'name');
}


document.getElementById("addButton").addEventListener("click", () => {
  showFormModal(); // Pastikan modal muncul dulu agar elemen HTML ada di DOM
  
  loadAccountOptions();

  // 3. PASANG LISTENER KE INPUT SEARCH
  const searchInput = document.getElementById("formProjectSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      handleProjectSearch(e.target.value);
    });
  }
});

// Update formHtml agar sesuai dengan modul AR
formHtml = `
<div class="px-2">
  
  <form id="dataform" class="space-y-5">
    <input type="hidden" id="formId" name="receipt_id">
    <input type="hidden" id="formProjectId" name="project_id">

    
      <div class="relative">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Cari Project Name <span class="text-red-500">*</span></label>
        <div class="relative">
          <input id="formProjectSearch" type="text" 
                 class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm" 
                 placeholder="Ketik nama project...">
        </div>
        <div id="projectSearchResults" class="absolute z-50 w-full bg-white border border-gray-200 rounded-md mt-1 hidden max-h-60 overflow-y-auto shadow-xl"></div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Tanggal Transaksi <span class="text-red-500">*</span></label>
        <input id="formTanggal" name="date" type="date" 
               class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm">
      </div>
   


      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Nomor Invoice <span class="text-red-500">*</span></label>
        <input id="formInvNumber" name="inv_number" type="text" 
               class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm" 
               placeholder="Masukkan No. Ref / Kwitansi">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Pelanggan</label>
        <input id="formPelanggan" name="pelanggan_nama" type="text" 
               class="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed shadow-sm" readonly>
      </div>


      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Akun Pembayaran <span class="text-red-500">*</span></label>
       <select id="formAkun" name="akun_id" 
                class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none bg-no-repeat bg-right pr-10"
                style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E'); background-size: 1.25rem;">
          <option value="">-- Pilih Akun --</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Total Amount <span class="text-red-500">*</span></label>
        <input id="formTotalAmount" name="total_amount" type="number" 
               class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm font-bold text-indigo-700" 
               placeholder="0">
      </div>


    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">Deskripsi <span class="text-red-500">*</span></label>
      <textarea id="formKeterangan" name="keterangan" rows="3" 
                class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                placeholder="Keterangan..."></textarea>
    </div>
  </form>
</div>
`;

requiredFields = [
  { field: "formProject", message: "Project Name is required!" },
  { field: "formPM", message: "Project Manager is required!" },
  { field: "formStartDate", message: "Starting Date is required!" },
  { field: "formDeadline", message: "Deadline is required!" },
];

async function loadAccountOptions(selectedId = null) {
  const elSelect = document.getElementById("formAkun");

  // Default option
  let akunOptions = "<option value=''>Pilih Akun</option>";

  try {
    // URL sesuai contoh yang berhasil kamu berikan
    const res = await fetch(`${baseUrl}/list/finance_accounts`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }, // Pastikan API_TOKEN tersedia
    });

    const result = await res.json();

    if (res.ok && result.listData) {
      // Loop data dan susun string HTML
      akunOptions += result.listData
        .map((acc) => {
          // LOGIC TAMBAHAN: Cek apakah ini akun yang harus dipilih (untuk mode Edit)
          const isSelected =
            selectedId && String(acc.akun_id) === String(selectedId)
              ? "selected"
              : "";

          // Return string option
          return `<option value="${acc.akun_id}" ${isSelected}>
              ${acc.nama_akun} - ${acc.number_account} (${acc.owner_account})
          </option>`;
        })
        .join("");
    }

    // Inject string HTML yang sudah jadi ke dalam element select
    elSelect.innerHTML = akunOptions;
  } catch (err) {
    console.error("❌ Gagal load akun:", err);
    elSelect.innerHTML = "<option value=''>Gagal memuat data</option>";
  }
}

async function handleProjectSearch(query) {
    const resultsContainer = document.getElementById('projectSearchResults');
    
    clearTimeout(debounceTimer);

    if (!query || query.length < 2) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('hidden');
        return;
    }

    debounceTimer = setTimeout(async () => {
        try {
            resultsContainer.innerHTML = '<div class="p-3 text-xs text-gray-500 animate-pulse">Mencari...</div>';
            resultsContainer.classList.remove('hidden');

            const res = await fetch(`${baseUrl}/table/project/${owner_id}/1?search=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${API_TOKEN}` }
            });
            const result = await res.json();

            if (res.ok && result.tableData?.length > 0) {
                resultsContainer.innerHTML = result.tableData.map(proj => `
                    <div class="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition" 
                         onclick="selectProject('${proj.project_id}', '${proj.project_name.replace(/'/g, "\\'")}', '${proj.customer}', '${proj.project_value}')">
                        <div class="font-bold text-xs text-blue-600">${proj.project_number}</div>
                        <div class="text-sm font-medium text-gray-800">${proj.project_name}</div>
                        <div class="text-xs text-gray-500 italic">${proj.customer}</div>
                    </div>
                `).join('');
            } else {
                resultsContainer.innerHTML = '<div class="p-3 text-sm text-gray-500">Project tidak ditemukan</div>';
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            resultsContainer.classList.add('hidden');
        }
    }, 500);
}

// Fungsi untuk mengisi field otomatis setelah pilih project
function selectProject(id, name, customer, value) {
    document.getElementById('formProjectId').value = id;
    document.getElementById('formProjectSearch').value = name;
    document.getElementById('formPelanggan').value = customer;
    document.getElementById('formTotalAmount').value = value;
    
    // Tutup dropdown
    document.getElementById('projectSearchResults').classList.add('hidden');
}

// Global listener untuk menutup dropdown jika klik di luar
window.onclick = function(event) {
    if (!event.target.matches('#formProjectSearch')) {
        const dropdown = document.getElementById('projectSearchResults');
        if (dropdown) dropdown.classList.add('hidden');
    }
}

/**
 * Fungsi untuk melihat riwayat cicilan piutang
 */
async function viewReceiptHistory(receiptId, projectName) {
    Swal.fire({ title: 'Memuat Riwayat...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    // SIMULASI DELAY (Biar terasa seperti panggil API)
    setTimeout(() => {
        const payments = dummyDetailData; // Menggunakan data dummy
        const finance = (n) => new Intl.NumberFormat("id-ID").format(parseFloat(n) || 0);
        const escapedProjectName = projectName.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        let tableRows = payments.map((item, index) => `
            <tr class="border-b text-[11px] hover:bg-gray-50 transition-colors">
                <td class="p-4 text-center text-gray-400">${index + 1}</td>
                <td class="p-4">
                    <div class="font-mono font-bold text-indigo-600">${item.receipt_number}</div>
                    <div class="text-[10px] text-gray-400">${item.tanggal_transaksi}</div>
                </td>
                <td class="p-4 text-gray-700 font-medium">${item.keterangan}</td>
                <td class="p-4 font-bold text-right text-gray-800">${finance(item.nominal)}</td>
                <td class="p-4 text-gray-600">${item.nama_akun}</td>
                <td class="p-4 text-center">
                    <button type="button" onclick="handleReceiptInput('${receiptId}', '${escapedProjectName}', '${item.nominal}', '${item.receipt_detail_id}')" 
                            class="text-indigo-600 hover:text-indigo-900 font-bold uppercase text-[10px] tracking-widest">
                             Edit
                    </button>
                </td>
            </tr>`).join('');

        Swal.fire({
            title: `<div class="text-left text-2xl font-black text-gray-800">Riwayat Pembayaran</div>`,
            html: `
                <div class="text-left mb-6 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 flex justify-between items-center shadow-sm">
                    <div>
                        <p class="text-[10px] uppercase font-black text-indigo-400 tracking-[0.2em] mb-1">Project Active</p>
                        <p class="text-lg font-bold text-gray-800">${projectName}</p>
                    </div>
                    <button type="button" onclick="handleReceiptInput('${receiptId}', '${escapedProjectName}')" 
                            class="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                        + Catat Cicilan
                    </button>
                </div>
                <div class="overflow-hidden border border-gray-100 rounded-2xl shadow-sm bg-white">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                            <tr>
                                <th class="p-4 text-center w-16">No</th>
                                <th class="p-4">Reference</th>
                                <th class="p-4">Description</th>
                                <th class="p-4 text-right">Amount</th>
                                <th class="p-4">Account</th>
                                <th class="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>`,
            width: '1100px',
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { popup: 'rounded-3xl p-6' }
        });
    }, 500);
}

/**
 * Fungsi untuk Input/Edit Pembayaran Piutang
 */
async function handleReceiptInput(receiptId, projectName, nominal = 0, detailId = null) {
    const isEdit = detailId !== null;
    
    // Data dummy untuk dropdown Bank
    const bankOptions = `
        <option value="1">Bank Mandiri - 123456789</option>
        <option value="2">BCA Digital - 987654321</option>
        <option value="3">Kas Kecil (Cash)</option>
    `;

    Swal.fire({
        title: `<span class="text-xl font-bold">${isEdit ? 'Edit' : 'Input'} Penerimaan</span>`,
        html: `
            <div class="text-center mb-6 text-sm text-gray-500 border-b pb-4">Project: <span class="text-indigo-600 font-bold">${projectName}</span></div>
            <form id="receipt-form" class="grid grid-cols-1 gap-5 text-left p-2">
                <div>
                    <label class="block font-bold mb-2 text-[10px] text-gray-400 uppercase tracking-widest">Pilih Rekening</label>
                    <select id="swal_akun_id" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all">${bankOptions}</select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-bold mb-2 text-[10px] text-gray-400 uppercase tracking-widest">Tanggal</label>
                        <input type="date" id="swal_date" class="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block font-bold mb-2 text-[10px] text-indigo-400 uppercase tracking-widest">Nominal</label>
                        <input type="number" id="swal_nominal" class="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl font-bold text-lg text-indigo-700" value="${nominal}">
                    </div>
                </div>
                <div>
                    <label class="block font-bold mb-2 text-[10px] text-gray-400 uppercase tracking-widest">Keterangan</label>
                    <textarea id="swal_keterangan" class="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm" rows="3" placeholder="Contoh: Pembayaran Termin 1"></textarea>
                </div>
            </form>
        `,
        width: '550px',
        confirmButtonText: 'Simpan Pembayaran',
        confirmButtonColor: '#4f46e5',
        showCancelButton: true,
        customClass: { popup: 'rounded-3xl' }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Berhasil!', 'Data dummy berhasil disimpan (Simulasi)', 'success');
        }
    });
}