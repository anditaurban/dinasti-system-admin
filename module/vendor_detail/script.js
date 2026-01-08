currentVendorId = window.detail_id;
currentVendorName = window.detail_desc;

detail_id = currentVendorId; // Sinkronisasi untuk table.js

// 2. KONFIGURASI MODUL (Variabel Global untuk table.js)
// -----------------------------------------------------------------
pagemodule = "Vendor";
subpagemodule = "Vendor Detail";
renderHeader(); // Untuk judul modal
colSpanCount = 3; // Sesuaikan dengan jumlah kolom <thead>

// ❗️ PENTING: Ini menghubungkan dengan logika fetchData baru yang kita buat sebelumnya
setDataType("vendor_contact");

// 3. UPDATE UI SPESIFIK MODUL
// -----------------------------------------------------------------
// Pastikan ID elemen di HTML Anda sudah disesuaikan (misal: vendorNameTitle)
// Jika belum, tetap gunakan ID yang ada di HTML (misal clientNameTitle)
titleElement =
  document.getElementById("vendorNameTitle") ||
  document.getElementById("clientNameTitle");
if (titleElement) {
  titleElement.textContent = currentVendorName || "Vendor Detail";
}

// 4. DEFINISI FORM MODAL (Global `formHtml`)
// -----------------------------------------------------------------
formHtml = `
<form id="dataform" class="space-y-2">
  <input type="hidden" name="owner_id" value="${owner_id}">
  
  <input type="hidden" name="vendor_id" value="${currentVendorId}">

  <label for="formNama" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Nama Kontak <span class="text-red-500">*</span></label>
  <input id="formNama" name="name" type="text" class="form-control w-full px-3 py-2 border rounded-md" required>

  <label for="formEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Email</label>
  <input id="formEmail" name="email" type="email" class="form-control w-full px-3 py-2 border rounded-md" >

  <label for="formPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Phone <span class="text-red-500">*</span></label>
  <input id="formPhone" name="phone" type="text" class="form-control w-full px-3 py-2 border rounded-md" required>
</form>
`;

// 5. ATURAN VALIDASI FORM (Global `requiredFields`)
// -----------------------------------------------------------------
requiredFields = [
  { field: "name", message: "Nama Kontak Vendor wajib diisi!" },
  { field: "email", message: "Email wajib diisi!" },
  { field: "phone", message: "Nomor Telepon wajib diisi!" },
];

// 6. FUNGSI PENGISI FORM (Saat Edit)
// -----------------------------------------------------------------
async function fillFormData(data) {
  console.log("🔄 Isi form kontak vendor dengan data:", data);
  document.querySelector("input[name='owner_id']").value =
    data.owner_id || owner_id;

  // ❗️ UBAH DI SINI: Map ke vendor_id
  document.querySelector("input[name='vendor_id']").value =
    data.vendor_id || currentVendorId;

  document.getElementById("formNama").value = data.name || "";
  document.getElementById("formEmail").value = data.email || "";
  document.getElementById("formPhone").value = data.phone || "";
}

/**
 * Memuat dropdown saat modal dibuka.
 */
function loadDropdownCall() {
  // Tidak ada dropdown khusus
  console.log("Tidak ada dropdown untuk dimuat pada Vendor Contact.");
}

/**
 * Mendefinisikan template baris tabel.
 */
window.rowTemplate = function (item, index, perPage = 10) {
  // Pastikan API mengembalikan key 'contact_id'.
  // Jika API vendor mengembalikan 'vendor_contact_id', sesuaikan di sini.
  const id = item.contact_id || item.vendor_contact_id;

  return `
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0">${
      item.name || "-"
    }</td>
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0">${
      item.email || "-"
    }</td>
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0">
      ${item.phone || "-"}
      
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
        <button onclick="event.stopPropagation(); handleEdit('${id}', '${
    item.name
  }')" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100" data-id="${id}">
          ✏️ Edit Kontak
        </button>
        <button onclick="event.stopPropagation(); handleDelete(${id})" 
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
          🗑 Delete Kontak
        </button>
      </div>
    </td>
  `;
};

// 7. EVENT LISTENERS
// -----------------------------------------------------------------
document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadDropdownCall();
});

searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("keyup", debounceSearch);
}

// 8. PANGGILAN DATA PERTAMA
// -----------------------------------------------------------------
// Fetch data berdasarkan Vendor ID
fetchAndUpdateData(detail_id);
