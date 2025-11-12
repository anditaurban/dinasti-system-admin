pagemodule = "Setting";
subpagemodule = "";
renderHeader();

// =====================================================================
// == DEFINISI GLOBAL DIPINDAHKAN KE ATAS SINI ==
// =====================================================================

// State untuk menyimpan halaman saat ini untuk setiap tabel
tableStates = {
  notes: { currentPage: 1, perPage: 10 },
  top: { currentPage: 1, perPage: 10 },
  tnc: { currentPage: 1, perPage: 10 },
  unit: { currentPage: 1, perPage: 10 },
};

/**
 * Template untuk baris tabel Catatan, ToP, dan T&C
 * (DIPINDAHKAN KE ATAS)
 */
window.notesTopRowTemplate = function (item, dataType) {
  const editFuncMap = {
    notes: "handleEditNote",
    top: "handleEditTop",
    tnc: "handleEditTnc",
  };
  const deleteFuncMap = {
    notes: "handleDeleteNote",
    top: "handleDeleteTop",
    tnc: "handleDeleteTnc",
  };

  const editFunc = editFuncMap[dataType];
  const deleteFunc = deleteFuncMap[dataType];

  // Ubah newline (\n) menjadi <br> agar tampil rapi di HTML
  const pretextHtml = item.pretext.replace(/\n/g, "<br>");

  // Gunakan JSON.stringify agar aman passing string ke fungsi onclick
  const pretextJson = JSON.stringify(item.pretext);

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
    
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Deskripsi</span>
      <div class="prose prose-sm max-w-none">${pretextHtml}</div>
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 sm:border-0 flex justify-between sm:table-cell" style="width: 150px;">
      <span class="font-medium sm:hidden">Actions</span>
      <div class="flex gap-2 justify-end w-full sm:w-auto">
        <button onclick="${editFunc}(${item.setting_id}, ${pretextJson})" class="text-blue-500 hover:text-blue-700 p-1">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button onclick="${deleteFunc}(${item.setting_id})" class="text-red-500 hover:text-red-700 p-1">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </td>
  </tr>`;
};

/**
 * Template untuk baris tabel Unit (Satuan)
 * (DIPINDAHKAN KE ATAS)
 */
window.unitRowTemplate = function (item, dataType) {
  const unitNameJson = JSON.stringify(item.unit);
  return `
    <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
        <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell">
            <span class="font-medium sm:hidden">Nama Satuan</span>
            ${item.unit}
        </td>
        <td class="px-6 py-4 text-sm text-gray-700 sm:border-0 flex justify-between sm:table-cell" style="width: 150px;">
            <span class="font-medium sm:hidden">Actions</span>
            <div class="flex gap-2 justify-end w-full sm:w-auto">
                <button onclick="handleEditUnit(${item.unit_id}, ${unitNameJson})" class="text-blue-500 hover:text-blue-700 p-1">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="handleDeleteUnit(${item.unit_id})" class="text-red-500 hover:text-red-700 p-1">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </td>
    </tr>`;
};

// =====================================================================
// == SCRIPT AWAL (SEKARANG AMAN) ==
// =====================================================================

loadAccounts();
loadProfile(user_id);
getCompanyDetail();
loadTermOfPayment();
loadTermCondition();
loadNotes();
loadUnits();
loadUpdateLog();

function switchSection(btn, section) {
  // reset button style
  document.querySelectorAll(".setting-btn").forEach((b) => {
    b.classList.remove("bg-gray-100", "dark:bg-gray-700", "font-semibold");
  });
  btn.classList.add("bg-gray-100", "dark:bg-gray-700", "font-semibold");

  // hide all sections
  document
    .querySelectorAll(".setting-section")
    .forEach((sec) => sec.classList.add("hidden"));
  // show target
  document.getElementById("section-" + section).classList.remove("hidden");
}

// set default (Billing aktif)
window.onload = () => {
  document.querySelector(".setting-btn").click();
};

async function loadAccounts() {
  const container = document.getElementById("payment-methods-container");
  container.innerHTML = `
    <div class="flex items-center justify-center p-6">
      <svg class="animate-spin h-6 w-6 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span class="text-gray-500">Memuat data akun pembayaran...</span>
    </div>
  `;

  // kasih delay 10 detik sebelum fetch data
  setTimeout(async () => {
    try {
      const res = await fetch(
        `${baseUrl}/table/finance_account_payment/${owner_id}/1`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        }
      );
      const data = await res.json();

      if (data.tableData && data.tableData.length > 0) {
        container.innerHTML = "";
        data.tableData.forEach((acc) => {
          container.innerHTML += `
            <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                  <i class="fas fa-university text-gray-500"></i>
                </div>
                <div>
                  <p class="font-medium">${acc.nama_akun}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    ${acc.owner_account} (${acc.number_account})
                  </p>
                  <p class="text-xs text-gray-400">${acc.tag || ""}</p>
                </div>
              </div>
              <div class="flex gap-x-3">
                <button onclick="handleEditAccounts(${acc.akun_id}, '${
            acc.account_id
          }', '${acc.owner_account}', '${acc.number_account}', '${acc.tag}', '${
            acc.status
          }')" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  Edit
                </button>
                <button onclick="handleDeleteAccounts(${
                  acc.akun_id
                })" class="text-red-500 hover:text-red-600 text-sm font-medium">
                  Hapus
                </button>
              </div>
            </div>
          `;
        });
      } else {
        container.innerHTML = `<p class="p-4 text-gray-500">Belum ada akun pembayaran.</p>`;
      }

      // tombol tambah
      container.innerHTML += `
        <div onclick="handleAddAccounts()" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 cursor-pointer">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3 flex items-center justify-center">
              <i class="fas fa-plus text-gray-500"></i>
            </div>
            <p class="font-medium">Tambah Metode Pembayaran</p>
          </div>
        </div>
      `;
    } catch (err) {
      console.error("Error:", err);
      container.innerHTML = `<p class="p-4 text-red-500">Gagal load data.</p>`;
    }
  }, 10000); // ⏳ delay 10 detik
}

async function handleAddAccounts() {
  try {
    // Ambil list akun dari API
    const resList = await fetch(`${baseUrl}/list/finance_account/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const listData = await resList.json();

    if (!resList.ok || !listData.listData) {
      Swal.fire("Error", "Gagal memuat daftar akun", "error");
      return;
    }

    // Buat dropdown option
    const options = listData.listData
      .map(
        (acc) =>
          `<option value="${acc.akun_id}">${acc.nama_akun} (${acc.tipe})</option>`
      )
      .join("");

    Swal.fire({
      title: "Tambah Akun Pembayaran",
      html: `
  <div class="space-y-3 text-left">
    <div>
      <label for="account_id" class="block text-sm font-medium text-gray-700 mb-1">Pilih Bank</label>
      <select id="account_id" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">-- Pilih Bank --</option>
        ${options}
      </select>
    </div>
    <div>
      <label for="owner_account" class="block text-sm font-medium text-gray-700 mb-1">Pemilik Akun</label>
      <input id="owner_account" type="text" placeholder="Nama Pemilik Akun" 
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="number_account" class="block text-sm font-medium text-gray-700 mb-1">Nomor Akun</label>
      <input id="number_account" type="text" placeholder="Nomor Rekening" 
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="tag" class="block text-sm font-medium text-gray-700 mb-1">Tag (Opsional)</label>
      <input id="tag" type="text" placeholder="Keterangan tambahan" 
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
  </div>
`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const payload = {
          owner_id: owner_id,
          account_id: parseInt(document.getElementById("account_id").value),
          owner_account: document.getElementById("owner_account").value,
          number_account: document.getElementById("number_account").value,
          status: "on",
          tag: document.getElementById("tag").value,
        };

        try {
          const res = await fetch(`${baseUrl}/add/finance_account_payment`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          if (res.ok) {
            Swal.fire(
              "Sukses",
              "Akun pembayaran berhasil ditambahkan",
              "success"
            );
            loadAccounts();
          } else {
            Swal.fire("Gagal", data.message || "Terjadi kesalahan", "error");
          }
        } catch (err) {
          Swal.fire("Error", "Tidak dapat terhubung ke server", "error");
        }
      }
    });
  } catch (err) {
    Swal.fire("Error", "Tidak dapat memuat data akun", "error");
  }
}

async function handleEditAccounts(
  id,
  idAccount,
  ownerAccount,
  numberAccount,
  tag,
  statusAccount
) {
  try {
    // ambil list bank (account_id)
    const listRes = await fetch(`${baseUrl}/list/finance_account/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const listData = await listRes.json();

    const options = listData.listData
      .map((acc) => {
        const selected = acc.akun_id == idAccount ? "selected" : "";
        return `<option value="${acc.akun_id}" ${selected}>${acc.nama_akun}</option>`;
      })
      .join("");

    // tampilkan SweetAlert edit form
    const { value: formValues } = await Swal.fire({
      title: "Edit Akun Pembayaran",
      html: `
  <div class="space-y-3 text-left">
    <div>
      <label for="account_id" class="block text-sm font-medium text-gray-700 mb-1">Pilih Bank</label>
      <select id="account_id" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">-- Pilih Bank --</option>
        ${options}
      </select>
    </div>
    <div>
      <label for="owner_account" class="block text-sm font-medium text-gray-700 mb-1">Pemilik Akun</label>
      <input id="owner_account" type="text" placeholder="Nama Pemilik Akun"  value="${
        ownerAccount || ""
      }"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="number_account" class="block text-sm font-medium text-gray-700 mb-1">Nomor Akun</label>
      <input id="number_account" type="text" placeholder="Nomor Rekening" value="${
        numberAccount || ""
      }"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="tag" class="block text-sm font-medium text-gray-700 mb-1">Tag (Opsional)</label>
      <input id="tag" type="text" placeholder="Keterangan tambahan" value="${
        tag || ""
      }"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" class="w-full border px-3 py-2 rounded">
          <option value="on" ${
            statusAccount === "on" ? "selected" : ""
          }>Aktif</option>
          <option value="off" ${
            statusAccount === "off" ? "selected" : ""
          }>Nonaktif</option>
        </select>
    </div>
  </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Batal",
      preConfirm: () => {
        return {
          owner_id: owner_id,
          account_id: document.getElementById("account_id").value,
          owner_account: document.getElementById("owner_account").value,
          number_account: document.getElementById("number_account").value,
          tag: document.getElementById("tag").value,
          status: document.getElementById("status").value,
        };
      },
    });

    if (formValues) {
      const res = await fetch(
        `${baseUrl}/update/finance_account_payment/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`,
          },
          body: JSON.stringify(formValues),
        }
      );

      const data = await res.json();
      if (res.ok && data.response === "200") {
        Swal.fire("Sukses", "Akun berhasil diperbarui", "success");
        loadAccounts(); // refresh list akun
      } else {
        Swal.fire("Error", data.message || "Gagal update akun", "error");
      }
    }
  } catch (err) {
    console.error("Error handleEditAccounts:", err);
    Swal.fire("Error", "Terjadi kesalahan saat update akun", "error");
  }
}

async function handleDeleteAccounts(akunId) {
  const confirm = await Swal.fire({
    title: "Hapus Metode Pembayaran?",
    text: "Data yang dihapus tidak bisa dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(
        `${baseUrl}/delete/finance_account_payment/${akunId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (data.response === "200" && data.data.success) {
        Swal.fire("Terhapus!", data.data.message, "success");
        loadAccounts();
      } else {
        Swal.fire(
          "Gagal!",
          data.data?.message || "Gagal menghapus data",
          "error"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "Terjadi kesalahan saat menghapus data.", "error");
    }
  }
}

async function loadUpdateLog() {
  const container = document.getElementById("update-log-container");
  container.innerHTML = `<p class="text-gray-500">Loading...</p>`;

  try {
    const res = await fetch("update_log.json"); // path JSON dummy
    const logs = await res.json();

    container.innerHTML = "";
    logs.forEach((log) => {
      container.innerHTML += `
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-semibold text-primary-600">Versi ${
              log.version
            }</h2>
            <span class="text-sm text-gray-500">${log.date}</span>
          </div>
          <ul class="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
            ${log.changes.map((change) => `<li>${change}</li>`).join("")}
          </ul>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p class="text-red-500">Gagal memuat data log.</p>`;
  }
}

// panggil ketika section update log dibuka

async function loadProfile(user_id) {
  try {
    // kasih indikator loading dulu di field input
    document.getElementById("profile_name").value = "Loading...";
    document.getElementById("profile_email").value = "Loading...";
    document.getElementById("profile_phone").value = "Loading...";
    document.getElementById("profile_level").value = "Loading...";
    document.getElementById("profile_role").value = "Loading...";

    // delay 5 detik sebelum fetch
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const res = await fetch(`${baseUrl}/detail/user/${user_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();

    if (data.detail) {
      document.getElementById("profile_name").value = data.detail.name || "";
      document.getElementById("profile_email").value = data.detail.email || "";
      document.getElementById("profile_phone").value = data.detail.phone || "";
      document.getElementById("profile_level").value = data.detail.level || "";
      document.getElementById("profile_role").value = data.detail.role || "";
    }
  } catch (err) {
    console.error("Gagal load profil:", err);
  }
}

async function updateProfile() {
  const name = document.getElementById("profile_name").value;
  const email = document.getElementById("profile_email").value;
  const phone = document.getElementById("profile_phone").value;
  const level = document.getElementById("profile_level").value;
  const role = document.getElementById("profile_role").value;

  try {
    const res = await fetch(`${baseUrl}/update/user/${user_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        owner_id: owner_id,
        nama: name,
        email: email,
        level: level,
        role: role,
        phone: phone,
      }),
    });

    const data = await res.json();

    if (res.ok && data.data && data.data.success) {
      Swal.fire("Sukses", "Profil berhasil diperbarui", "success");
      loadProfile(user_id);
    } else {
      Swal.fire(
        "Gagal",
        (data.data && data.data.message) || "Gagal update profil",
        "error"
      );
    }
  } catch (err) {
    Swal.fire("Error", "Terjadi kesalahan koneksi", "error");
    console.error("Gagal update profil:", err);
  }
}

async function getCompanyDetail() {
  try {
    // kasih indikator loading dulu di field input

    // isi form
    document.getElementById("company_name").value = "Loading...";
    document.getElementById("company_industry").value = "Loading...";
    document.getElementById("company_address").value = "Loading...";
    document.getElementById("company_phone").value = "Loading...";
    document.getElementById("company_email").value = "Loading...";
    document.getElementById("company_website").value = "Loading...";
    document.getElementById("company_instagram").value = "Loading...";
    document.getElementById("company_linkedin").value = "Loading...";
    document.getElementById("company_facebook").value = "Loading...";

    // delay 5 detik sebelum fetch
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const res = await fetch(`${baseUrl}/detail/company/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();
    const data = json.detail;

    // isi form
    document.getElementById("company_name").value = data.company || "";
    document.getElementById("company_industry").value = data.place || "";
    document.getElementById("company_address").value = data.address || "";
    document.getElementById("company_phone").value = data.phone || "";
    document.getElementById("company_email").value = data.email || "";
    document.getElementById("company_website").value = data.website || "";
    document.getElementById("company_instagram").value = data.instagram || "";
    document.getElementById("company_linkedin").value = data.linkedin || "";
    document.getElementById("company_facebook").value = data.facebook || "";

    loadLogoWithAuth(data.logo_url);

    // preview logo kalau ada
    if (data.logo_url) {
      const logoPreview = document.getElementById("logo_preview");
      logoPreview.src = data.logo_url;
      logoPreview.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Gagal load company detail", err);
  }
}

async function saveCompanySetting() {
  const formData = new FormData();
  formData.append("owner_id", owner_id);
  formData.append("company", document.getElementById("company_name").value);
  formData.append("place", document.getElementById("company_industry").value);
  formData.append("address", document.getElementById("company_address").value);
  formData.append("phone", document.getElementById("company_phone").value);
  formData.append("email", document.getElementById("company_email").value);
  formData.append("website", document.getElementById("company_website").value);
  formData.append(
    "instagram",
    document.getElementById("company_instagram").value
  );
  formData.append(
    "linkedin",
    document.getElementById("company_linkedin").value
  );
  formData.append(
    "facebook",
    document.getElementById("company_facebook").value
  );

  // file logo (optional)
  const fileInput = document.getElementById("company_logo");
  if (fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  }

  // Konfirmasi dulu sebelum update
  Swal.fire({
    title: "Apakah Anda yakin?",
    text: "Perubahan data perusahaan akan disimpan.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, simpan",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${baseUrl}/update/company/1`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${API_TOKEN}`, // ⚠️ jangan pakai Content-Type, biar FormData jalan
          },
          body: formData,
        });

        const json = await res.json();
        console.log("Update success:", json);

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Data perusahaan berhasil diperbarui!",
        });

        getCompanyDetail();
      } catch (err) {
        console.error("Gagal update company", err);
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Terjadi kesalahan saat update data.",
        });
      }
    }
  });
}

// =====================================================================
// == BAGIAN TABEL GENERIC (Notes, ToP, T&C, Unit) ==
// =====================================================================

// Template functions `window.notesTopRowTemplate` dan `window.unitRowTemplate`
// SUDAH DIPINDAHKAN KE ATAS SCRIPT

/**
 * Fungsi generik untuk load data tabel
 */
async function loadTableData(dataType, page = 1) {
  const config = {
    notes: {
      endpoint: (p) => `${baseUrl}/table/notes/${owner_id}/${p}`,
      tbodyId: "catatanTableBody",
      paginationId: "catatanPagination",
      infoId: "catatanInfoText",
      pageSelectId: "catatanPageSelect",
      headerId: "catatanTableHeader",
      rowTemplate: window.notesTopRowTemplate,
    },
    top: {
      endpoint: (p) => `${baseUrl}/table/term_of_payment/${owner_id}/${p}`,
      tbodyId: "topTableBody",
      paginationId: "topPagination",
      infoId: "topInfoText",
      pageSelectId: "topPageSelect",
      headerId: "topTableHeader",
      rowTemplate: window.notesTopRowTemplate,
    },
    tnc: {
      endpoint: (p) => `${baseUrl}/table/terms/${owner_id}/${p}`,
      tbodyId: "tncTableBody",
      paginationId: "tncPagination",
      infoId: "tncInfoText",
      pageSelectId: "tncPageSelect",
      headerId: "tncTableHeader",
      rowTemplate: window.notesTopRowTemplate,
    },
    unit: {
      endpoint: (p) => `${baseUrl}/table/unit/${owner_id}/${p}`,
      tbodyId: "unitTableBody",
      paginationId: "unitPagination",
      infoId: "unitInfoText",
      pageSelectId: "unitPageSelect",
      headerId: "unitTableHeader",
      rowTemplate: window.unitRowTemplate,
    },
  };

  const currentConfig = config[dataType];
  if (!currentConfig) {
    console.error("Invalid dataType:", dataType);
    return;
  }

  tableStates[dataType].currentPage = page;
  const {
    tbodyId,
    paginationId,
    infoId,
    pageSelectId,
    endpoint,
    rowTemplate,
    headerId,
  } = currentConfig;

  const tableBody = document.getElementById(tbodyId);
  const tableHeader = document.getElementById(headerId);

  // Tampilkan loading
  tableBody.innerHTML = `<tr><td colspan="2" class="text-center p-6 text-gray-500">
        <i class="fas fa-spinner fa-spin mr-2"></i> Memuat data...
    </td></tr>`;
  tableHeader.classList.add("hidden");

  try {
    // PERUBAHAN: Menambahkan delay 3 detik untuk simulasi loading
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const res = await fetch(endpoint(page), {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();

    if (data.success !== false && data.tableData) {
      renderTableContent(dataType, currentConfig, data, rowTemplate);
    } else {
      tableBody.innerHTML = `<tr><td colspan="2" class="text-center p-4 text-red-500">${
        data.message || "Gagal memuat data."
      }</td></tr>`;
    }
  } catch (err) {
    console.error(`Error loading ${dataType}:`, err);
    tableBody.innerHTML = `<tr><td colspan="2" class="text-center p-4 text-red-500">Error: ${err.message}</td></tr>`;
  }
}

/**
 * Render konten tabel dan kontrol pagination
 */
function renderTableContent(dataType, config, data, rowTemplate) {
  const { tbodyId, paginationId, infoId, pageSelectId, headerId } = config;

  const tableBody = document.getElementById(tbodyId);
  const pagination = document.getElementById(paginationId);
  const infoText = document.getElementById(infoId);
  const pageSelect = document.getElementById(pageSelectId);
  const tableHeader = document.getElementById(headerId);

  const { tableData, totalRecords, totalPages } = data;
  const { currentPage } = tableStates[dataType];
  const perPage = tableStates[dataType].perPage || 10;

  // Render Body Tabel
  if (tableData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="2" class="text-center p-6 text-gray-500">Belum ada data.</td></tr>`;
    tableHeader.classList.add("hidden");
  } else {
    tableBody.innerHTML = tableData
      .map((item, index) => rowTemplate(item, dataType))
      .join("");
    tableHeader.classList.remove("hidden");
  }

  // Render Info Pagination
  const start = totalRecords > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const end = start + tableData.length - 1;
  infoText.textContent = `Showing ${start}-${end} of ${totalRecords} entries.`;
  infoText.classList.remove("hidden");

  // Render Kontrol Pagination (Desktop)
  pagination.innerHTML = generatePagination(dataType, currentPage, totalPages);
  pagination.classList.remove("hidden");

  // Render Page Select (Mobile)
  pageSelect.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    pageSelect.innerHTML += `<option value="${i}" ${
      i === currentPage ? "selected" : ""
    }>${i}</option>`;
  }
  pageSelect.onchange = () =>
    loadTableData(dataType, parseInt(pageSelect.value));
}

/**
 * Buat HTML untuk tombol pagination
 */
function generatePagination(dataType, currentPage, totalPages) {
  let html = "";
  const maxButtons = 5;

  const createBtn = (page, text, disabled = false, active = false) => {
    return `<button 
            onclick="loadTableData('${dataType}', ${page})"
            class="px-3 py-1 border rounded ${
              active ? "bg-blue-500 text-white" : "bg-white"
            } ${
      disabled
        ? "text-gray-300 cursor-not-allowed"
        : "text-gray-700 hover:bg-gray-100"
    }"
            ${disabled ? "disabled" : ""}>
            ${text}
        </button>`;
  };

  // Tombol Previous
  html += createBtn(currentPage - 1, "« Prev", currentPage === 1);

  // Nomor Halaman
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += createBtn(1, "1");
    if (startPage > 2) html += `<span class="px-3 py-1">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += createBtn(i, i, false, i === currentPage);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="px-3 py-1">...</span>`;
    html += createBtn(totalPages, totalPages);
  }

  // Tombol Next
  html += createBtn(currentPage + 1, "Next »", currentPage === totalPages);
  return html;
}

// =====================================================================
// == CRUD Handlers (Notes, ToP, T&C) ==
// =====================================================================

// --- Notes ---
function handleAddNote() {
  showNotesTopModal("add", "notes");
}
function handleEditNote(id, pretext) {
  showNotesTopModal("edit", "notes", id, pretext);
}
async function handleDeleteNote(id) {
  await handleDeleteGeneric("notes", id, `${baseUrl}/delete/notes/${id}`);
}

// --- T&C ---
function handleAddTnc() {
  showNotesTopModal("add", "tnc");
}
function handleEditTnc(id, pretext) {
  showNotesTopModal("edit", "tnc", id, pretext);
}
async function handleDeleteTnc(id) {
  await handleDeleteGeneric("tnc", id, `${baseUrl}/delete/terms/${id}`, "T&C");
}

// --- ToP ---
function handleAddTop() {
  showNotesTopModal("add", "top");
}
function handleEditTop(id, pretext) {
  showNotesTopModal("edit", "top", id, pretext);
}
async function handleDeleteTop(id) {
  await handleDeleteGeneric(
    "top",
    id,
    `${baseUrl}/delete/term_of_payment/${id}`,
    "Term of Payment"
  );
}

/**
 * Modal generik untuk Tambah / Edit Catatan, ToP, dan T&C
 */
async function showNotesTopModal(mode, dataType, id = null, pretext = "") {
  const titles = {
    notes: { add: "Tambah Catatan Baru", edit: "Edit Catatan" },
    top: { add: "Tambah ToP Baru", edit: "Edit ToP" },
    tnc: { add: "Tambah T&C Baru", edit: "Edit T&C" },
  };
  const title = titles[dataType][mode];

  const { value: formValues } = await Swal.fire({
    title: title,
    html: `
            <div class="space-y-3 text-left">
                <div>
                    <label for="swal_pretext" class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea id="swal_pretext" rows="5" placeholder="Tulis deskripsi di sini..." 
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">${pretext}</textarea>
                </div>
            </div>
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    preConfirm: () => {
      const pretextValue = document.getElementById("swal_pretext").value;
      if (!pretextValue) {
        Swal.showValidationMessage("Deskripsi tidak boleh kosong");
        return false;
      }
      return { pretext: pretextValue };
    },
  });

  if (formValues) {
    saveNotesTopData(mode, dataType, id, formValues);
  }
}

/**
 * Fungsi generik untuk menyimpan data (Add/Update) untuk Notes, ToP, T&C
 */
async function saveNotesTopData(mode, dataType, id, data) {
  const isAdd = mode === "add";
  const endpointMap = {
    notes: "notes",
    top: "term_of_payment",
    tnc: "terms",
  };
  const endpointType = endpointMap[dataType];

  const endpoint = isAdd
    ? `${baseUrl}/add/${endpointType}`
    : `${baseUrl}/update/${endpointType}/${id}`;

  const method = isAdd ? "POST" : "PUT";

  const payload = {
    owner_id: owner_id,
    pretext: data.pretext,
  };

  if (isAdd) {
    if (dataType === "notes") {
      payload.note = "Catatan";
      payload.information_type = 1;
    } else if (dataType === "top") {
      payload.note = "Term of Payment";
      payload.information_type = 3;
    } else if (dataType === "tnc") {
      payload.note = "Syarat dan Ketentuan";
      payload.information_type = 2;
    }
  }

  try {
    const res = await fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    const responseData = result.data || result;

    if (res.ok && (responseData.success || result.response === "200")) {
      Swal.fire("Sukses!", "Data berhasil disimpan.", "success");
      loadTableData(dataType, tableStates[dataType].currentPage);
    } else {
      Swal.fire(
        "Gagal!",
        responseData.message || "Gagal menyimpan data.",
        "error"
      );
    }
  } catch (err) {
    Swal.fire("Error", `Koneksi gagal: ${err.message}`, "error");
  }
}

/**
 * Fungsi Hapus Generik (untuk Notes, ToP, T&C)
 */
async function handleDeleteGeneric(dataType, id, endpoint, title = "Data") {
  const confirm = await Swal.fire({
    title: `Hapus ${title}?`,
    text: "Data yang dihapus tidak bisa dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, hapus",
  });

  if (confirm.isConfirmed) {
    try {
      // PERUBAHAN: Mengganti method dari PUT ke DELETE
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      const data = await res.json();
      const responseData = data.data || data;
      if (res.ok && (responseData.success || data.response === "200")) {
        Swal.fire("Terhapus!", `${title} telah dihapus.`, "success");
        loadTableData(dataType, tableStates[dataType].currentPage);
      } else {
        Swal.fire(
          "Gagal!",
          responseData.message || "Gagal menghapus data.",
          "error"
        );
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }
}

// =====================================================================
// == CRUD Handlers (Unit / Satuan) - BARU ==
// =====================================================================

function handleAddUnit() {
  showUnitModal("add");
}

function handleEditUnit(id, unitName) {
  showUnitModal("edit", id, unitName);
}

async function handleDeleteUnit(id) {
  await handleDeleteGeneric(
    "unit",
    id,
    `${baseUrl}/delete/unit/${id}`,
    "Satuan"
  );
}

async function showUnitModal(mode, id = null, unitName = "") {
  const title = mode === "add" ? "Tambah Satuan Baru" : "Edit Satuan";

  const { value: formValues } = await Swal.fire({
    title: title,
    html: `
            <div class="space-y-3 text-left">
                <div>
                    <label for="swal_unit" class="block text-sm font-medium text-gray-700 mb-1">Nama Satuan</label>
                    <input id="swal_unit" type="text" placeholder="e.g., pcs, unit, set" 
                           value="${unitName}"
                           class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    preConfirm: () => {
      const unitValue = document.getElementById("swal_unit").value;
      if (!unitValue) {
        Swal.showValidationMessage("Nama satuan tidak boleh kosong");
        return false;
      }
      return { unit: unitValue };
    },
  });

  if (formValues) {
    saveUnitData(mode, id, formValues);
  }
}

async function saveUnitData(mode, id, data) {
  const isAdd = mode === "add";
  const endpoint = isAdd
    ? `${baseUrl}/add/unit`
    : `${baseUrl}/update/unit/${id}`;

  const method = isAdd ? "POST" : "PUT";

  const payload = {
    owner_id: owner_id,
    unit: data.unit,
  };

  try {
    const res = await fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    const responseData = result.data || result;

    if (res.ok && (responseData.success || result.response === "200")) {
      Swal.fire("Sukses!", "Data satuan berhasil disimpan.", "success");
      loadTableData("unit", tableStates.unit.currentPage);
    } else {
      Swal.fire(
        "Gagal!",
        responseData.message || "Gagal menyimpan data.",
        "error"
      );
    }
  } catch (err) {
    Swal.fire("Error", `Koneksi gagal: ${err.message}`, "error");
  }
}

// =====================================================================
// == FUNGSI LAMA YANG DIMODIFIKASI / DI-RETAIN ==
// =====================================================================

async function loadTermOfPayment() {
  loadTableData("top", 1);
}

async function loadTermCondition() {
  loadTableData("tnc", 1);
}

async function loadNotes() {
  loadTableData("notes", 1);
}

async function loadUnits() {
  loadTableData("unit", 1);
}
