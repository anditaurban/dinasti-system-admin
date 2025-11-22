pagemodule = "Vendor";
colSpanCount = 9;
setDataType("vendor");
fetchAndUpdateData();

function validateFormData(formData, requiredFields = []) {
  console.log("✅ Validasi Form dimulai...");

  for (const { field, message } of requiredFields) {
    if (!formData[field] || formData[field].trim() === "") {
      console.warn(`⚠️ Field kosong: ${field}`);
      alert(message); // bisa diganti SweetAlert kalau mau lebih cantik
      return false;
    }
  }

  console.log("✅ Semua field terisi");
  return true;
}

async function fillFormData(data) {
  console.log("🔄 Isi form dengan data:", data);

  // Hidden owner_id
  document.querySelector("input[name='owner_id']").value = data.owner_id || "1";

  // Isi field form sesuai API
  document.getElementById("formCity").value = data.city_name || "";
  document.getElementById("formNama").value = data.nama || "";
  document.getElementById("formAlias").value = data.alias || "";
  document.getElementById("formPhone").value = data.phone || "";
  document.getElementById("formWhatsapp").value = data.whatsapp || "";
  document.getElementById("formEmail").value = data.email || "";
  document.getElementById("formNpwp").value = data.no_npwp || "";
  document.getElementById("formWebsite").value = data.website || "";
  document.getElementById("formAlamat").value = data.alamat || "";
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

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Name</span>  
        ${item.nama} ${item.alias ? `(${item.alias})` : ""}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Email</span>
        ${item.email || "-"}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Phone</span>
        ${item.phone || "-"}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">No NPWP</span>
        ${item.no_npwp || "-"}
     </td>
  
     <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Alamat</span>
        ${item.alamat || "-"}
        <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
          <button onclick="event.stopPropagation(); handleEdit('${
            item.vendor_id
          }', '${item.nama}')" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100" data-id="${
              item.vendor_id
            }">✏️ Edit Client</button>
            <button 
  onclick="event.stopPropagation(); loadModuleContent('vendor_detail', '${
    item.vendor_id
  }', '${item.nama}');"
  class="block w-full text-left px-4 py-2 hover:bg-gray-100">
  👁️ View Detail
</button>
          <button onclick="event.stopPropagation(); handleDelete(${
            item.vendor_id
          })" 
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
            🗑 Delete Client
          </button>
        </div>
     </td>
  </tr>`;
};

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadDropdownCall();
});

formHtml = `
<form id="dataform" class="space-y-2">

  <!-- Hidden owner_id -->
  <input type="hidden" name="owner_id" value="1">

  <label for="formNama" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Nama Perusahaan</label>
  <input id="formNama" name="nama" type="text" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formAlias" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Alias</label>
  <input id="formAlias" name="alias" type="text" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Phone</label>
  <input id="formPhone" name="phone" type="text" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formWhatsapp" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">WhatsApp</label>
  <input id="formWhatsapp" name="whatsapp" type="text" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Email</label>
  <input id="formEmail" name="email" type="email" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formNpwp" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">No. NPWP</label>
  <input id="formNpwp" name="no_npwp" type="text" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formWebsite" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Website</label>
  <input id="formWebsite" name="website" type="url" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    
  <label for="formCity" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Kota</label>
  <input id="formCity" name="city_name" type="text" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required>

  <label for="formAlamat" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Alamat</label>
  <textarea id="formAlamat" name="alamat" rows="3" class="form-control form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600
    rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>

</form>
`;

requiredFields = [
  { field: "city_name", message: "Kota wajib diisi!" },
  { field: "nama", message: "Nama Perusahaan wajib diisi!" },
  { field: "alias", message: "Alias wajib diisi!" },
  { field: "phone", message: "Nomor Telepon wajib diisi!" },
  { field: "whatsapp", message: "Nomor WhatsApp wajib diisi!" },
  { field: "email", message: "Email wajib diisi!" },
  { field: "no_npwp", message: "No. NPWP wajib diisi!" },
  { field: "website", message: "Website wajib diisi!" },
  { field: "alamat", message: "Alamat wajib diisi!" },
];

function showImportModal() {
  Swal.fire({
    title: "Import Data Client",
    html: `
      <div class="flex flex-col items-start text-left w-full">
        <label for="excelFile" class="mb-2 font-medium text-gray-700">File Excel</label>
        <input 
          type="file" 
          id="excelFile" 
          accept=".xlsx, .xls" 
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
        <p class="mt-3 text-xs text-gray-500">
          Belum punya format? 
          <a href="#" onclick="downloadClientTemplate(); return false;" class="text-blue-600 hover:underline font-medium">Download template Excel</a>
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Import",
    cancelButtonText: "Batal",
    customClass: {
      popup: "swal2-sm",
      confirmButton:
        "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium",
      cancelButton:
        "bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium",
    },
    preConfirm: () => {
      const file = document.getElementById("excelFile").files[0];
      if (!file) {
        Swal.showValidationMessage("Pilih file Excel terlebih dahulu!");
        return false;
      }
      return file;
    },
  }).then((result) => {
    if (result.isConfirmed) {
      handleImportExcel(result.value);
    }
  });
}

function downloadClientTemplate() {
  // Ganti URL di bawah ini dengan lokasi file template kamu di server
  const fileUrl = "../assets/templates_file/Template_Import_Client.xlsx";

  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "Template_Import_Client.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function handleImportExcel(file) {
  try {
    Swal.fire({
      title: "Processing...",
      text: "Sedang membaca dan mengunggah data, harap tunggu...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      let successCount = 0;
      let failCount = 0;

      for (const row of jsonData) {
        const payload = {
          owner_id: user.owner_id,
          nama: row["nama"],
          alias: row["alias"],
          phone: row["phone"],
          whatsapp: row["whatsapp"],
          email: row["email"],
          no_npwp: row["no_npwp"],
          website: row["website"],
          city_name: row["city_name"],
          alamat: row["alamat"],
        };

        try {
          const res = await fetch(`${baseUrl}/add/client`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_TOKEN}`,
            },
            body: JSON.stringify(payload),
          });

          const result = await res.json();
          console.log("Response:", result);

          if (result.response === "201" && result.data?.success === true) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error("Error kirim data:", err);
          failCount++;
        }
      }

      // 🔽 Popup hasil import
      Swal.fire({
        icon: "success",
        title: "Import Selesai",
        html: `
          <p>✅ Berhasil: ${successCount}</p>
          <p>❌ Gagal: ${failCount}</p>
        `,
        confirmButtonColor: "#6C63FF",
      }).then(() => {
        // 🔁 Setelah popup ditutup, refresh tabel client
        fetchAndUpdateData();
      });
    };

    reader.readAsArrayBuffer(file);
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Gagal memproses file Excel", "error");
  }
}
