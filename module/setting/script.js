pagemodule = "Setting";
subpagemodule = "";
renderHeader();
loadAccounts();
loadProfile(user_id);
getCompanyDetail();
loadTermOfPayment();
loadTermCondition();
loadNotes();
loadUpdateLog();


  function switchSection(btn, section) {
    // reset button style
    document.querySelectorAll('.setting-btn').forEach(b => {
      b.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'font-semibold');
    });
    btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'font-semibold');

    // hide all sections
    document.querySelectorAll('.setting-section').forEach(sec => sec.classList.add('hidden'));
    // show target
    document.getElementById('section-' + section).classList.remove('hidden');
  }

  // set default (Billing aktif)
  window.onload = () => {
    document.querySelector('.setting-btn').click();
    
  }


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
      const res = await fetch(`${baseUrl}/table/finance_account_payment/${owner_id}/1`, {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      });
      const data = await res.json();

      if (data.tableData && data.tableData.length > 0) {
        container.innerHTML = "";
        data.tableData.forEach(acc => {
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
                <button onclick="handleEditAccounts(${acc.akun_id}, '${acc.account_id}', '${acc.owner_account}', '${acc.number_account}', '${acc.tag}', '${acc.status}')" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  Edit
                </button>
                <button onclick="handleDeleteAccounts(${acc.akun_id})" class="text-red-500 hover:text-red-600 text-sm font-medium">
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
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    const listData = await resList.json();

    if (!resList.ok || !listData.listData) {
      Swal.fire("Error", "Gagal memuat daftar akun", "error");
      return;
    }

    // Buat dropdown option
    const options = listData.listData.map(acc => 
      `<option value="${acc.akun_id}">${acc.nama_akun} (${acc.tipe})</option>`
    ).join("");

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
      confirmButtonText: "Simpan"
    }).then(async result => {
      if (result.isConfirmed) {
        const payload = {
          owner_id: owner_id,
          account_id: parseInt(document.getElementById("account_id").value),
          owner_account: document.getElementById("owner_account").value,
          number_account: document.getElementById("number_account").value,
          status: "on",
          tag: document.getElementById("tag").value
        };

        try {
          const res = await fetch(`${baseUrl}/add/finance_account_payment`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${API_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (res.ok) {
            Swal.fire("Sukses", "Akun pembayaran berhasil ditambahkan", "success");
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

async function handleEditAccounts(id, idAccount, ownerAccount, numberAccount, tag, statusAccount) {
  try {
    // ambil list bank (account_id)
    const listRes = await fetch(`${baseUrl}/list/finance_account/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    const listData = await listRes.json();

    const options = listData.listData
      .map(acc => {
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
      <input id="owner_account" type="text" placeholder="Nama Pemilik Akun"  value="${ownerAccount || ""}"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="number_account" class="block text-sm font-medium text-gray-700 mb-1">Nomor Akun</label>
      <input id="number_account" type="text" placeholder="Nomor Rekening" value="${numberAccount || ""}"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="tag" class="block text-sm font-medium text-gray-700 mb-1">Tag (Opsional)</label>
      <input id="tag" type="text" placeholder="Keterangan tambahan" value="${tag || ""}"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div>
      <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" class="w-full border px-3 py-2 rounded">
          <option value="on" ${statusAccount === "on" ? "selected" : ""}>Aktif</option>
          <option value="off" ${statusAccount === "off" ? "selected" : ""}>Nonaktif</option>
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
          status: document.getElementById("status").value
        };
      }
    });

    if (formValues) {
      const res = await fetch(`${baseUrl}/update/finance_account_payment/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(formValues)
      });

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
    cancelButtonText: "Batal"
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`${baseUrl}/delete/finance_account_payment/${akunId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();

      if (data.response === "200" && data.data.success) {
        Swal.fire("Terhapus!", data.data.message, "success");
         loadAccounts();
      } else {
        Swal.fire("Gagal!", data.data?.message || "Gagal menghapus data", "error");
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
    logs.forEach(log => {
      container.innerHTML += `
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-semibold text-primary-600">Versi ${log.version}</h2>
            <span class="text-sm text-gray-500">${log.date}</span>
          </div>
          <ul class="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
            ${log.changes.map(change => `<li>${change}</li>`).join("")}
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

    // delay 10 detik sebelum fetch
    await new Promise(resolve => setTimeout(resolve, 5000));

    const res = await fetch(`${baseUrl}/detail/user/${user_id}`, {
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
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
        "Authorization": `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        owner_id: owner_id,
        nama: name,
        email: email,
        level: level,
        role: role,
        phone: phone
      })
    });

    const data = await res.json();

    if (res.ok && data.data && data.data.success) {
      Swal.fire("Sukses", "Profil berhasil diperbarui", "success");
      loadProfile(user_id);
    } else {
      Swal.fire("Gagal", (data.data && data.data.message) || "Gagal update profil", "error");
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

    // delay 10 detik sebelum fetch
    await new Promise(resolve => setTimeout(resolve, 5000));
    const res = await fetch(`${baseUrl}/detail/company/${owner_id}`, {
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
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
  formData.append("instagram", document.getElementById("company_instagram").value);
  formData.append("linkedin", document.getElementById("company_linkedin").value);
  formData.append("facebook", document.getElementById("company_facebook").value);

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
    cancelButtonText: "Batal"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${baseUrl}/update/company/1`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${API_TOKEN}` // ⚠️ jangan pakai Content-Type, biar FormData jalan
          },
          body: formData,
        });

        const json = await res.json();
        console.log("Update success:", json);

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Data perusahaan berhasil diperbarui!"
        });

        getCompanyDetail();
      } catch (err) {
        console.error("Gagal update company", err);
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Terjadi kesalahan saat update data."
        });
      }
    }
  });
}

async function loadTermOfPayment() {
  try {
    document.getElementById("note_top").value = "Loading...";

    await new Promise(resolve => setTimeout(resolve, 5000));

    const res = await fetch(`${baseUrl}/list/term_of_payment/${owner_id}`, {
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
    });
    const data = await res.json();

    if (data.success && data.listData.length > 0) {
      const top = data.listData[0]; // ambil 1 record (default)
      document.getElementById("note_top").value = top.pretext || "";
    } else {
      document.getElementById("note_top").value = "";
    }
  } catch (err) {
    console.error("Gagal load Term of Payment:", err);
  }
}

async function loadTermCondition() {
  try {
    document.getElementById("note_tnc").value = "Loading...";

    await new Promise(resolve => setTimeout(resolve, 5000));

    const res = await fetch(`${baseUrl}/list/terms/${owner_id}`, {
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
    });
    const data = await res.json();

    if (data.success && data.listData.length > 0) {
      const top = data.listData[0]; // ambil 1 record (default)
      document.getElementById("note_tnc").value = top.pretext || "";
    } else {
      document.getElementById("note_tnc").value = "";
    }
  } catch (err) {
    console.error("Gagal load Term of Payment:", err);
  }
}

async function loadNotes() {
  try {
    document.getElementById("note_catatan").value = "Loading...";

    await new Promise(resolve => setTimeout(resolve, 5000));

    const res = await fetch(`${baseUrl}/list/notes/${owner_id}`, {
      headers: { "Authorization": `Bearer ${API_TOKEN}` }
    });
    const data = await res.json();

    if (data.success && data.listData.length > 0) {
      const top = data.listData[0]; // ambil 1 record (default)
      document.getElementById("note_catatan").value = top.pretext || "";
    } else {
      document.getElementById("note_catatan").value = "";
    }
  } catch (err) {
    console.error("Gagal load Catatan:", err);
  }
}

async function updateTermOfPayment() {
  const textarea = document.getElementById("note_top");
  const instruction = textarea.value.trim();
  console.log('instruction = ', instruction);

  if (!instruction) {
    Swal.fire("Oops", "Isi Term of Payment tidak boleh kosong", "warning");
    return;
  }

  const payload = JSON.stringify({
        owner_id: owner_id,
        pretext: instruction
      })
  console.log ('Data = ', payload);

  try {
    const res = await fetch(`${baseUrl}/update/term_of_payment/3`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`
      },
      body: payload
    });

    const result = await res.json();
    const data = result.data; // ambil isi dari "data"
    if (data && data.success) {
      Swal.fire("Sukses", data.message || "Term of Payment berhasil diperbarui", "success");
    } else {
      Swal.fire("Gagal", data.message || "Gagal memperbarui Term of Payment", "error");
    }
  } catch (err) {
    console.error("Error update Term of Payment:", err);
    Swal.fire("Error", "Terjadi kesalahan server", "error");
  }
}

async function updateTermCondition() {
  const textarea = document.getElementById("note_tnc");
  const instruction = textarea.value.trim();

  if (!instruction) {
    Swal.fire("Oops", "Isi Term Condition tidak boleh kosong", "warning");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/update/terms/2`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        owner_id: owner_id,
        pretext: instruction
      })
    });

    const result = await res.json();
    const data = result.data; // ambil isi dari "data"
    if (data && data.success) {
      Swal.fire("Sukses", data.message || "Term Condition berhasil diperbarui", "success");
    } else {
      Swal.fire("Gagal", data.message || "Gagal memperbarui Term Condition", "error");
    }
  } catch (err) {
    console.error("Error update Term Condition:", err);
    Swal.fire("Error", "Terjadi kesalahan server", "error");
  }
}

async function updateNotes() {
  const textarea = document.getElementById("note_catatan");
  const instruction = textarea.value.trim();

  if (!instruction) {
    Swal.fire("Oops", "Isi Notes tidak boleh kosong", "warning");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/update/notes/1`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        owner_id: owner_id,
        pretext: instruction
      })
    });

    const result = await res.json();
    const data = result.data; // ambil isi dari "data"
    if (data && data.success) {
      Swal.fire("Sukses", data.message || "Notes berhasil diperbarui", "success");
    } else {
      Swal.fire("Gagal", data.message || "Gagal memperbarui Notes", "error");
    }
  } catch (err) {
    console.error("Error update Term of Payment:", err);
    Swal.fire("Error", "Terjadi kesalahan server", "error");
  }
}


