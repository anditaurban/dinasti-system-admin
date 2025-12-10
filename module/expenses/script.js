pagemodule = "Internal Expenses";
subpagemodule = "";
renderHeader();
colSpanCount = 9;
setDataType("expenses");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">Date</span>  
    ${item.tanggal_transaksi}
    </td>
    
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Type</span>
      ${item.no_kwitansi}
      
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Category</span>
      ${item.project_name}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">DESCRIPTION</span>
${item.keterangan}
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Via</span>
      ${item.nama_akun}
    </td>


    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Role</span>
      ${finance(item.nominal)}
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
       <button onclick="event.stopPropagation(); handleEdit('${
         item.keuangan_id
       }', '${item.project_name}')" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100" data-id="${
              item.keuangan_id
            }">✏️ Edit Expenses</button>
            <button 
        <button onclick="event.stopPropagation(); handleDelete(${
          item.keuangan_id
        })" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
          🗑 Delete Expenses
        </button>
      </div>
    </td>
  </tr>`;
};

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadAccountOptions();
});

formHtml = `
<form id="dataform" class="space-y-3" enctype="multipart/form-data">

  <input type="hidden" id="formOwnerId" name="owner_id">
  <input type="hidden" id="formUserId" name="user_id">


  <div class="form-group">
      <label for="formTanggal" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal Transaksi</label>
      <input id="formTanggal" name="tanggal_transaksi" type="date" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" required>
  </div>

    <div class="form-group">
      <label for="formNoKwitansi" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">No. Kwitansi</label>
      <input id="formNoKwitansi" name="no_kwitansi" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="-">
  </div>

 <div class="form-group">
      <label for="formCategory" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Kategori</label>
      <input id="formCategory" name="nama_expenses" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Marketing Operational" required>
  </div>

  <div class="form-group">
      <label for="formKeterangan" class="block text-left  text-sm font-medium text-gray-700 dark:text-gray-200">Keterangan</label>
      <textarea id="formKeterangan" name="keterangan" rows="2" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" required></textarea>
  </div>

  <div class="form-group">
    <label for="formAkun" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Akun Pembayaran</label>
    <select id="formAkun" name="akun" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" required>
        <option value="">Pilih Akun</option>
    </select>
</div>

  <div class="form-group">
      <label for="formNominal" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Nominal (Rp)</label>
      <input id="formNominal" name="nominal" type="number" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="0" required>
  </div>


  <div class="form-group">
      <label for="formFile" class="block text-left text-sm font-medium text-gray-700 dark:text-gray-200">Bukti Transfer / File</label>
      <input id="formFile" name="file" type="file" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500">
  </div>

</form>
`;
async function fillFormData(data) {
  // 1. Ambil object item dari API
  let source = data.detail ? data.detail : data;
  const item = Array.isArray(source) ? source[0] : source;

  console.log("🔄 Isi form dengan data:", item);

  // --- PERBAIKAN LOGIKA USER ID ---
  let userId = item.user_id;

  // Cek apakah user_id dari API itu 0, null, atau undefined
  if (!userId || userId == 0 || userId == "0") {
    // LANGKAH BARU: Ambil object 'user' dari Local Storage
    const userSessionStr = localStorage.getItem("user");

    if (userSessionStr) {
      try {
        // Parse string JSON menjadi Object asli
        const userSession = JSON.parse(userSessionStr);
        // Ambil user_id dari dalam object tersebut
        userId = userSession.user_id;
        console.log("✅ User ID diambil dari LocalStorage:", userId);
      } catch (e) {
        console.error("Gagal parse localStorage user:", e);
        userId = "";
      }
    } else {
      userId = "";
    }
  }
  // --------------------------------

  document.getElementById("formOwnerId").value = item.owner_id ?? "";
  document.getElementById("formUserId").value = userId; // Sekarang harusnya terisi '5'

  // Load akun dan isi field lainnya...
  await loadAccountOptions(item.akun_id);

  document.getElementById("formTanggal").value = item.tanggal_transaksi || "";
  document.getElementById("formCategory").value = item.project_name || "";
  document.getElementById("formKeterangan").value = item.keterangan || "";
  document.getElementById("formNominal").value = item.nominal || "";
  document.getElementById("formNoKwitansi").value = item.no_kwitansi || "-";
}

requiredFields = [
  { field: "akun", message: "Silakan pilih Akun Pembayaran!" },
  { field: "tanggal_transaksi", message: "Tanggal Transaksi wajib diisi!" },
  // PERUBAHAN DISINI: Key validasi mengikuti name di HTML
  { field: "nama_expenses", message: "Nama Expenses wajib diisi!" },
  { field: "keterangan", message: "Keterangan wajib diisi!" },
  { field: "nominal", message: "Nominal wajib diisi!" },
];

function validateFormData(formData) {
  console.log("✅ Validasi Form dimulai...", formData);

  // Loop cek field required
  for (const { field, message } of requiredFields) {
    // Cek key di object formData (kalau pakai FormData.entries())
    // Atau cek langsung value element jika formData adalah object key-value
    const value = formData.get ? formData.get(field) : formData[field]; // Support FormData object atau plain object

    if (!value || (typeof value === "string" && value.trim() === "")) {
      console.warn(`⚠️ Field kosong: ${field}`);
      alert(message);
      return false;
    }
  }

  // Validasi tambahan: Nominal harus angka valid
  const nominal = formData.get ? formData.get("nominal") : formData["nominal"];
  if (nominal <= 0) {
    alert("Nominal harus lebih dari 0!");
    return false;
  }

  console.log("✅ Semua field terisi");
  return true;
}

// Fungsi load opsi akun
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

// Tambahkan fungsi ini agar error "is not defined" hilang
window.loadDropdownCall = async function () {
  console.log("Memanggil loadDropdownCall (alias ke loadAccountOptions)...");
  // Kita arahkan supaya dia menjalankan logika load akun yang sudah kita buat
  await loadAccountOptions();
};
