pagemodule = "Project";
currentModeManual = sessionStorage.getItem("projectMode") || "create";
subpagemodule =
  currentModeManual === "create" ? "Buat Project Baru" : "Update Project";
renderHeader();

// Variabel Global Modul Ini
customerListManual = [];
var projectDetailData = null; // Penting untuk fitur Convert to Sales

(async function initManual() {
  const titleEl = document.getElementById("formTitleManual");
  if (titleEl) titleEl.textContent = subpagemodule;

  const breadcrumbEl = document.getElementById("breadcrumbCurrent");
  if (breadcrumbEl) breadcrumbEl.textContent = subpagemodule;

  // 1. Load Dropdown yang bersifat Global (Tidak bergantung pada pilihan lain)
  try {
    await Promise.all([
      loadSalesType("add_type_id"),
      loadProjectManagers("add_project_manager"),
    ]);
  } catch (e) {
    console.error("Gagal load dropdown", e);
  }

  // Logic per Mode
  if (currentModeManual === "create") {
    setTodayDate("add_tanggal");
    setTodayDate("add_finish_date");

    // Reset Dropdown PIC saat membuat project baru
    const picSelect = document.getElementById("add_pic_client");
    if (picSelect)
      picSelect.innerHTML = '<option value="">-- Pilih PIC --</option>';

    document.getElementById("tabelItemAdd").innerHTML =
      `<tr><td colspan="3" class="text-center py-4 text-gray-500">Belum ada item.</td></tr>`;

    document.getElementById("saveNewProjectBtn").onclick = () =>
      saveProject("create");
  } else {
    // Mode Update
    const projectId = window.detail_id;
    const projectDesc = window.detail_desc || "Update";

    document.getElementById("formTitleManual").textContent =
      `Update: ${projectDesc}`;

    document.getElementById("saveNewProjectBtn").onclick = () =>
      saveProject("update", projectId);

    // loadProjectDataForUpdate akan menangani pemanggilan loadPicByClient secara internal
    // karena dia membutuhkan pelanggan_id dari hasil detail API.
    await loadProjectDataForUpdate(projectId);
  }
})();

function filterClientSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();
  const suggestionBox = document.getElementById("clientSuggestionList");
  const hiddenIdInput = document.getElementById("add_client");
  const picSelect = document.getElementById("add_pic_client");

  if (!suggestionBox) return;

  clearTimeout(clientDebounceTimer);

  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    hiddenIdInput.value = "";
    if (picSelect)
      picSelect.innerHTML = '<option value="">-- Pilih PIC --</option>';
    return;
  }

  clientDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      const res = await fetch(
        `${baseUrl}/table/client/${owner_id}/1?search=${encodeURIComponent(inputVal)}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } },
      );
      const result = await res.json();
      suggestionBox.innerHTML = "";

      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          const clientName = item.nama || "N/A";
          const li = document.createElement("li");
          li.innerHTML = `
            <div class="font-medium">${clientName}</div>
            <div class="text-xs text-gray-500">${item.alias || ""}</div>
          `;
          li.className =
            "px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0";

          li.addEventListener("click", () => {
            inputElement.value = clientName;
            hiddenIdInput.value = item.pelanggan_id || "";
            suggestionBox.classList.add("hidden");

            // Trigger load PIC setelah client dipilih
            loadPicByClient(item.pelanggan_id);
          });
          suggestionBox.appendChild(li);
        });
      } else {
        suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Tidak ditemukan</li>`;
      }
    } catch (err) {
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Gagal memuat data</li>`;
    }
  }, 300);
}

async function loadPicByClient(clientId, selectedPic = "") {
  const picSelect = document.getElementById("add_pic_client");
  if (!picSelect || !clientId) return;

  picSelect.innerHTML = '<option value="">Memuat...</option>';

  try {
    const res = await fetch(`${baseUrl}/list/contact/${clientId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();

    let options = '<option value="">-- Pilih PIC --</option>';
    if (json.listData && json.listData.length > 0) {
      json.listData.forEach((c) => {
        const isSelected = selectedPic === c.name ? "selected" : "";
        options += `<option value="${c.name}" ${isSelected}>${c.name}</option>`;
      });
    } else {
      options = '<option value="">Tidak ada PIC</option>';
    }
    picSelect.innerHTML = options;
  } catch (e) {
    console.error("Gagal load PIC:", e);
    picSelect.innerHTML = '<option value="">Gagal memuat</option>';
  }
}

async function loadProjectDataForUpdate(Id) {
  Swal.fire({ title: "Memuat Data...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();
    const data = json.detail;
    projectDetailData = data;

    // 1. Set Client Info
    const clientName = data.customer || data.client_name || "";
    document.getElementById("add_client_name").value = clientName;
    let finalClientId = data.pelanggan_id || data.client_id || 0;

    // Fallback search ID jika 0
    if (finalClientId === 0 && clientName) {
      const searchRes = await fetch(
        `${baseUrl}/table/client/${owner_id}/1?search=${encodeURIComponent(clientName)}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } },
      );
      const searchJson = await searchRes.json();
      if (searchJson.tableData?.length > 0)
        finalClientId = searchJson.tableData[0].pelanggan_id;
    }
    document.getElementById("add_client").value = finalClientId;

    // 2. Load PIC List dan otomatis pilih PIC yang tersimpan
    if (finalClientId) {
      // Pastikan await agar dropdown terisi dulu sebelum baris berikutnya mengeksekusi .value
      await loadPicByClient(finalClientId, data.pic_name);
    }

    // 3. Isi Field Dasar
    document.getElementById("add_project_name").value = data.project_name || "";
    document.getElementById("add_tanggal").value = data.start_date || "";
    document.getElementById("add_finish_date").value = data.finish_date || "";
    document.getElementById("add_project_manager").value =
      data.project_manager_id || "";

    // 4. Setup Tipe & Render Items (Logika filter tetap sama)
    const typeSelect = document.getElementById("add_type_id");
    typeSelect.value = data.type_id || "";
    filterCompatibleTypes(data.type_id);
    toggleTambahItemBtn();

    // Logic Locked
    const isLocked = data.pesanan_id && data.pesanan_id !== 0;
    if (!isLocked) {
      const convertBtn = document.getElementById("convertToSalesBtn");
      if (convertBtn) convertBtn.classList.remove("hidden");
    } else {
      document.getElementById("saveNewProjectBtn").classList.add("hidden");
      document.getElementById("addItemBtn").classList.add("hidden");
      document.getElementById("formTitleManual").innerHTML +=
        ` <span class="text-red-500 text-sm">(Locked / Sales Order Created)</span>`;
      const inputs = document.querySelectorAll(
        "#addProjectForm input, #addProjectForm select:not(#add_type_id)",
      );
      inputs.forEach((el) => (el.disabled = true));
    }

    // Render Items
    const tbody = document.getElementById("tabelItemAdd");
    tbody.innerHTML = "";

    if (data.items?.length) {
      for (const item of data.items) {
        const itemRow = await tambahItem(item.sub_category_id);
        if (!itemRow) continue;

        itemRow.querySelector(".itemProduct").value = item.product || "";
        itemRow.querySelector(".itemDesc").value = item.description || "";
        itemRow.querySelector(".itemQty").value = item.qty || 1;
        itemRow.querySelector(".itemUnit").value = item.unit || "pcs";

        // Keuangan Parent
        itemRow.querySelector(".itemHpp").value = finance(item.hpp || 0);
        itemRow.querySelector(".itemMarkupNominal").value = finance(
          item.markup_nominal || 0,
        );
        itemRow.querySelector(".itemMarkupPersen").value =
          item.markup_percent || 0;
        itemRow.querySelector(".itemHarga").value = finance(
          item.unit_price || 0,
        );

        // Sub Items (Materials)
        if (item.materials?.length) {
          const btnAddSub = itemRow.querySelector(".btnTambahSubItem");
          if (btnAddSub) {
            for (const mat of item.materials) {
              const subRow = tambahSubItem(btnAddSub);
              if (subRow) {
                subRow.querySelector(".subItemMaterial").value = mat.name || "";
                subRow.querySelector(".subItemSpec").value =
                  mat.specification || "";
                subRow.querySelector(".subItemQty").value = mat.qty || 0;
                subRow.querySelector(".subItemUnit").value = mat.unit || "";
                subRow.querySelector(".subItemHpp").value = finance(
                  mat.hpp || 0,
                );
                subRow.querySelector(".subItemMarkupNominal").value = finance(
                  mat.markup_nominal || 0,
                );
                subRow.querySelector(".subItemMarkupPersen").value =
                  mat.markup_percent || 0;
                subRow.querySelector(".subItemHarga").value = finance(
                  mat.unit_price || 0,
                );
                subRow.querySelector(".subItemTotal").innerText = finance(
                  mat.material_total || 0,
                );
              }
            }
          }
        }
      }
    }

    recalculateTotal();
    Swal.close();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data project", "error");
    loadModuleContent("project");
  }
}
/**
 * 💡 FUNGSI FILTER UPDATE
 * Menghilangkan (HIDE) opsi yang tidak sejenis.
 * Group A: Turnkey ONLY (3)
 * Group B: Material (1) & Service (2) -> Simple
 */
function filterCompatibleTypes(currentTypeId) {
  const typeSelect = document.getElementById("add_type_id");
  if (!typeSelect) return;

  const currentIdStr = String(currentTypeId);

  // 🔴 UBAH DI SINI:
  // Definisi Grup A: HANYA Turnkey (3)
  // Service (2) dihapus dari sini agar masuk ke Group B (Simple)
  const complexTypes = ["3"];

  const isComplex = complexTypes.includes(currentIdStr);

  Array.from(typeSelect.options).forEach((option) => {
    if (option.value === "") return; // Skip placeholder

    // Reset style dulu
    option.style.display = "";
    option.hidden = false;

    let shouldHide = false;

    if (isComplex) {
      // Jika Group A (Turnkey), HILANGKAN Group B (Material, Service)
      if (!complexTypes.includes(option.value)) {
        shouldHide = true;
      }
    } else {
      // Jika Group B (Material/Service), HILANGKAN Group A (Turnkey)
      if (complexTypes.includes(option.value)) {
        shouldHide = true;
      }
    }

    if (shouldHide) {
      // Sembunyikan total
      option.style.display = "none";
      option.hidden = true;
      option.disabled = true;
    } else {
      // Tampilkan
      option.style.display = "block";
      option.hidden = false;
      option.disabled = false;
    }
  });
}

// 💡 TAMBAHKAN LISTENER AGAR TOMBOL BERUBAH SAAT TIPE DIGANTI MANUAL
document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "add_type_id") {
    toggleTambahItemBtn();
  }
});
async function saveProject(mode = "create", id = null) {
  try {
    const confirm = await Swal.fire({
      title: "Simpan Project?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({ title: "Menyproses...", didOpen: () => Swal.showLoading() });

    // --- 1. SCRAPING ITEMS (SESUAI KEY JSON BARU) ---
    const rows = document.querySelectorAll("#tabelItemAdd tr");
    const items = [];
    let currentItem = null; // Penampung sementara untuk item induk

    rows.forEach((row) => {
      // A. Jika baris Induk (Parent)
      if (row.classList.contains("itemRow")) {
        // Simpan item sebelumnya ke array jika ada
        if (currentItem) {
          items.push(currentItem);
        }

        // Buat object item baru
        currentItem = {
          product: row.querySelector(".itemProduct")?.value.trim() || "",
          sub_category_id: parseInt(
            row.querySelector(".itemSubcategory")?.value || 0,
          ),
          description: row.querySelector(".itemDesc")?.value.trim() || "",
          qty: parseInt(row.querySelector(".itemQty")?.value || 0),

          // Keuangan Parent (Jika Service/Simple, ini terisi. Jika Turnkey, ini biasanya 0)
          hpp: parseRupiah(row.querySelector(".itemHpp")?.value || 0),
          markup_nominal: parseRupiah(
            row.querySelector(".itemMarkupNominal")?.value || 0,
          ),
          markup_percent: parseFloat(
            row.querySelector(".itemMarkupPersen")?.value || 0,
          ),

          unit: row.querySelector(".itemUnit")?.value.trim() || "pcs",

          // Di JSON Anda parent pakai 'unit_price'
          unit_price: parseRupiah(row.querySelector(".itemHarga")?.value || 0),

          materials: [], // Siapkan array material kosong
        };
      }
      // B. Jika baris Anak (Material/SubItem)
      else if (row.classList.contains("subItemWrapper") && currentItem) {
        const subRows = row.querySelectorAll(".subItemRow");
        subRows.forEach((sub) => {
          // Push ke array materials milik currentItem
          // KEY DISESUAIKAN PERSIS DENGAN JSON ANDA
          currentItem.materials.push({
            subItemMaterial:
              sub.querySelector(".subItemMaterial")?.value.trim() || "",
            subItemSpec: sub.querySelector(".subItemSpec")?.value.trim() || "",
            subItemQty: parseInt(sub.querySelector(".subItemQty")?.value || 0),
            subItemHpp: parseRupiah(
              sub.querySelector(".subItemHpp")?.value || 0,
            ),
            subItemMarkupNominal: parseRupiah(
              sub.querySelector(".subItemMarkupNominal")?.value || 0,
            ),
            subItemMarkupPercent: parseFloat(
              sub.querySelector(".subItemMarkupPersen")?.value || 0,
            ),
            subItemUnit:
              sub.querySelector(".subItemUnit")?.value.trim() || "pcs",
            // Di JSON Anda material pakai 'subItemHarga'
            subItemHarga: parseRupiah(
              sub.querySelector(".subItemHarga")?.value || 0,
            ),
          });
        });
      }
    });

    // Jangan lupa push item terakhir setelah loop selesai
    if (currentItem) {
      items.push(currentItem);
    }

    // --- 2. KONSTRUKSI PAYLOAD UTAMA ---
    const payload = {
      owner_id: user.owner_id, // Tetap perlu owner
      project_manager_id: parseInt(
        document.getElementById("add_project_manager")?.value || 0,
      ),
      type_id: parseInt(document.getElementById("add_type_id")?.value || 0),
      pelanggan_id: parseInt(document.getElementById("add_client")?.value || 0),
      pic_name: document.getElementById("add_pic_client").value,
      project_name: document.getElementById("add_project_name")?.value || "",
      start_date: document.getElementById("add_tanggal")?.value || "",
      finish_date: document.getElementById("add_finish_date")?.value || "",
      items: items, // Array items yang sudah disusun
    };

    // Debugging di Console untuk cek hasil sebelum kirim
    console.log("Payload Final:", JSON.stringify(payload, null, 2));

    // --- 3. KIRIM KE SERVER ---
    const url =
      mode === "create"
        ? `${baseUrl}/add/project_manual`
        : `${baseUrl}/update/project_manual/${id}`;

    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok) {
      Swal.fire("Sukses", "Data berhasil disimpan", "success");
      loadModuleContent("project");
    } else {
      console.error("Server Error Response:", json);
      Swal.fire("Gagal", json.message || "Terjadi kesalahan server", "error");
    }
  } catch (err) {
    console.error("Catch Error:", err);
    Swal.fire("Error", err.message || "Terjadi kesalahan sistem", "error");
  }
}

async function openConvertToSalesModal() {
  if (!projectDetailData) return Swal.fire("Error", "Data belum siap", "error");

  // Validasi: PIC harus sudah dipilih di form utama
  const mainPic = document.getElementById("add_pic_client").value;
  if (!mainPic) {
    return Swal.fire(
      "Perhatian",
      "Pilih PIC Client di form utama terlebih dahulu",
      "warning",
    );
  }

  const { value: formValues } = await Swal.fire({
    title: "Buat Sales Order",
    html: `
      <div class="text-left">
        <label class="text-xs font-bold block mb-1">TANGGAL ORDER</label>
        <input type="date" id="swal_date" class="w-full border p-2 rounded" 
          value="${new Date().toISOString().split("T")[0]}">
      </div>`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    preConfirm: () => {
      const date = document.getElementById("swal_date").value;
      if (!date) Swal.showValidationMessage("Lengkapi data");
      return { date };
    },
  });

  if (formValues) {
    handleSaveConvertToSales({
      date: formValues.date,
      pic: mainPic, // Mengambil PIC dari form utama
      cid: document.getElementById("add_client").value,
    });
  }
}

async function handleSaveConvertToSales(data) {
  Swal.fire({ title: "Memproses...", didOpen: () => Swal.showLoading() });

  const items = projectDetailData.items.map((i) => ({
    product: i.product,
    sub_category_id: i.sub_category_id,
    description: i.description,
    qty: i.qty,
    hpp: i.hpp,
    markup_nominal: i.markup_nominal,
    markup_percent: i.markup_percent,
    unit: i.unit,
    unit_price: i.unit_price,
    materials: (i.materials || []).map((m) => ({
      subItemMaterial: m.name,
      subItemSpec: m.specification,
      subItemQty: m.qty,
      subItemHpp: m.hpp,
      subItemMarkupNominal: m.markup_nominal,
      subItemMarkupPercent: m.markup_percent,
      subItemUnit: m.unit,
      subItemHarga: m.unit_price,
    })),
  }));

  // PERBAIKAN PENTING: Mengambil ID Client yang valid dari form (jika data.cid kosong)
  // Jika data.cid (dari modal) kosong, ambil dari dropdown #add_client
  const finalClientId =
    parseInt(data.cid) || parseInt(document.getElementById("add_client").value);
  if (finalClientId) {
    await loadPicByClient(finalClientId, data.pic_name || data.pic);
  }
  if (!finalClientId) {
    Swal.fire(
      "Gagal",
      "ID Client tidak valid. Mohon pilih client ulang.",
      "error",
    );
    return;
  }

  const payload = {
    owner_id: user.owner_id,
    user_id: user.user_id,
    project_id: parseInt(projectDetailData.project_id),
    type_id: parseInt(projectDetailData.type_id),
    pelanggan_id: finalClientId,
    pic_name: data.pic,
    order_date: data.date,
    items: items,
  };

  try {
    const res = await fetch(`${baseUrl}/add/project_sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok) {
      Swal.fire("Berhasil", "Project dikonversi ke Sales Order", "success");
      // Pindah ke halaman View Detail agar user bisa melihat hasilnya
      loadModuleContent(
        "project_detail",
        projectDetailData.project_id,
        projectDetailData.project_name,
      );
    } else {
      throw new Error(json.message);
    }
  } catch (e) {
    Swal.fire("Gagal", e.message, "error");
  }
}

async function tambahItem(selectedSubCategoryId = "") {
  const tbody = document.getElementById("tabelItemAdd");
  const typeId = document.getElementById("add_type_id")?.value || "0";

  // Cek apakah td tersebut benar-benar mengandung teks "Belum ada item"
  const placeholderTd = tbody.querySelector('td[colspan="3"]');
  if (placeholderTd && placeholderTd.textContent.includes("Belum ada item")) {
    tbody.innerHTML = "";
  }

  // 🔴 UBAH DI SINI:
  // Hapus "typeId == 2" agar Service dianggap simple.
  // Hanya Turnkey (3) yang dianggap Complex (Input keuangan di-hidden).
  const isComplex = typeId == 3;

  // Jika ya, kita siapkan class "hidden" untuk menyembunyikan elemen keuangan parent
  const hideClass = isComplex ? "hidden" : "";

  const tr = document.createElement("tr");
  tr.classList.add("itemRow");

  const index =
    document.querySelectorAll("#tabelItemAdd tr.itemRow").length + 1;

  tr.innerHTML = `
    <td class="border px-3 py-2 w-[5%] align-top text-center font-semibold">${index}</td>
    <td class="border px-5 py-2 w-[55%] align-top">
      <div class="mb-1">
        <label class="text-xs text-gray-500 font-bold">Type <span class="text-red-500">*</span></label>
        <select class="w-full border rounded px-2 py-1 itemSubcategory focus:ring-2 focus:ring-blue-500 outline-none transition"></select>
      </div>
      <div class="mb-1">
        <label class="text-xs text-gray-500 font-bold">Product <span class="text-red-500">*</span></label>
        <input type="text" class="w-full border rounded px-2 py-1 itemProduct focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Nama Produk">
      </div>
      <div class="mb-1">
        <label class="text-xs text-gray-500 font-bold">Deskripsi</label>
        <textarea class="w-full border rounded px-2 py-1 itemDesc focus:ring-2 focus:ring-blue-500 outline-none transition" rows="2" placeholder="Deskripsi"></textarea>
      </div>

      <div class="grid grid-cols-3 gap-2 my-2 ${hideClass}">
        <div><label class="text-xs text-gray-500">HPP (Modal) <span class="text-red-500">*</span></label><input type="text" class="w-full border rounded px-2 py-1 itemHpp finance" value="0" oninput="recalculateHarga(this, 'hpp')"></div>
        <div><label class="text-xs text-gray-500">Markup (Rp)</label><input type="text" class="w-full border rounded px-2 py-1 itemMarkupNominal finance" value="0" oninput="recalculateHarga(this, 'nominal')"></div>
        <div><label class="text-xs text-gray-500">Markup (%) </label><input type="number" class="w-full border rounded px-2 py-1 itemMarkupPersen" value="0" oninput="recalculateHarga(this, 'persen')"></div>
      </div>

      <div class="grid grid-cols-4 gap-2 ${hideClass}">
        <div><label class="text-xs text-gray-500">Qty <span class="text-red-500">*</span></label><input type="number" class="w-full border rounded px-2 py-1 itemQty" value="1" oninput="recalculateTotal()"></div>
        <div>
           <label class="text-xs text-gray-500">Unit <span class="text-red-500">*</span></label>
           <div class="relative">
             <input type="text" class="w-full border rounded px-2 py-1 itemUnit" placeholder="set" oninput="filterUnitSuggestions(this)" autocomplete="off">
             <ul class="absolute z-10 w-full bg-white border shadow hidden max-h-48 overflow-y-auto rounded-md"></ul>
           </div>
        </div>
        <div class="col-span-2"><label class="text-xs text-gray-500">Harga (Jual)</label><input type="text" class="w-full border rounded px-2 py-1 itemHarga bg-gray-100 font-bold text-gray-700" readonly></div>
      </div>
      
      <div class="mt-2 items-center ${hideClass}">
        <div class="border rounded px-3 py-1 text-right bg-gray-100 text-gray-500 font-bold itemTotal">0</div>
      </div>
    </td>
    <td class="border px-3 py-2 w-[10%] align-top">
      <div class="flex flex-col gap-2 items-center">
        <button type="button" onclick="hapusItem(this)" 
          class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition shadow-sm" 
          title="Hapus Item">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        ${
          // 🔴 UBAH DI SINI: Tombol Sub Item HANYA muncul jika ID 3 (Turnkey)
          // Service (2) tombol ini tidak muncul
          typeId == 3
            ? `
          <button type="button" onclick="tambahSubItem(this)" 
            class="btnTambahSubItem inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition shadow-sm" 
            title="Tambah Sub Item">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          `
            : ""
        }
      </div>
    </td>
  `;

  // Wrapper untuk Sub Item (Material)
  const subWrapper = document.createElement("tr");
  subWrapper.classList.add("subItemWrapper");
  subWrapper.innerHTML = `<td colspan="3" class="p-0 border-b-2 border-gray-100"><table class="w-full"></table></td>`;

  tbody.appendChild(tr);
  tbody.appendChild(subWrapper);

  setupRupiahFormattingForElement(tr.querySelector(".itemHpp"));
  setupRupiahFormattingForElement(tr.querySelector(".itemMarkupNominal"));

  await loadSubcategories(
    tr.querySelector(".itemSubcategory"),
    selectedSubCategoryId,
  );

  return tr;
}
function tambahSubItem(btn) {
  const parentRow = btn.closest("tr");
  const subWrapper = parentRow.nextElementSibling?.querySelector("table");
  if (!subWrapper) return;

  const subTr = document.createElement("tr");
  subTr.classList.add("subItemRow", "bg-gray-50", "italic");

  subTr.innerHTML = `
    <td class="w-[5%]"></td>
    <td class="border px-3 py-2">
       <div class="mb-1">
         <label class="text-xs text-gray-500">Material Name <span class="text-red-500">*</span></label>
         <input type="text" class="w-full border rounded subItemMaterial" placeholder="Material">
       </div>
       
       <div class="mb-1">
         <label class="text-xs text-gray-500">Specification</label>
         <textarea class="w-full border rounded subItemSpec" rows="3" placeholder="Spesifikasi"></textarea>
       </div>

       <div class="grid grid-cols-3 gap-2 my-2">
          <div>
            <label class="text-xs text-gray-500">HPP <span class="text-red-500">*</span></label>
            <input type="text" class="w-full border rounded subItemHpp finance" value="0" oninput="recalculateHarga(this, 'hpp')">
          </div>
          <div>
            <label class="text-xs text-gray-500">Markup (Rp) </label>
            <input type="text" class="w-full border rounded subItemMarkupNominal finance" value="0" oninput="recalculateHarga(this, 'nominal')">
          </div>
          <div>
            <label class="text-xs text-gray-500">Markup (%)</label>
            <input type="number" class="w-full border rounded subItemMarkupPersen" value="0" oninput="recalculateHarga(this, 'persen')">
          </div>
       </div>

       <div class="grid grid-cols-4 gap-2">
          <div>
            <label class="text-xs text-gray-500">Qty <span class="text-red-500">*</span></label>
            <input type="number" class="w-full border rounded subItemQty" value="1" oninput="recalculateTotal()">
          </div>
          <div>
            <label class="text-xs text-gray-500">Unit <span class="text-red-500">*</span></label>
            <div class="relative">
              <input type="text" class="w-full border rounded subItemUnit" placeholder="pcs" oninput="filterUnitSuggestions(this)" autocomplete="off">
              <ul class="absolute z-10 w-full bg-white border shadow hidden max-h-48 overflow-y-auto"></ul>
            </div>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Harga Jual </label>
            <input type="text" class="w-full border rounded subItemHarga bg-gray-100" readonly>
          </div>
       </div>

       <div class="border rounded px-2 py-1 text-right bg-gray-100 subItemTotal mt-2">0</div>
    </td>
    <td class="align-middle text-center">
       <button type="button" onclick="hapusItem(this)" 
         class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition shadow-sm" 
         title="Hapus Material">
         <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
         </svg>
       </button>
    </td>
  `;

  subWrapper.appendChild(subTr);
  setupRupiahFormattingForElement(subTr.querySelector(".subItemHpp"));
  setupRupiahFormattingForElement(subTr.querySelector(".subItemMarkupNominal"));

  return subTr;
}

function hapusItem(button) {
  const row = button.closest("tr");
  if (row.classList.contains("itemRow")) {
    const wrapper = row.nextElementSibling;
    if (wrapper && wrapper.classList.contains("subItemWrapper"))
      wrapper.remove();
  }
  row.remove();
  recalculateTotal();
}

// --- SHARED HELPERS ---

function recalculateHarga(element, inputType) {
  const row = element.closest(".itemRow, .subItemRow");
  if (!row) return;
  const isSub = row.classList.contains("subItemRow");
  const prefix = isSub ? ".subItem" : ".item";

  const hppEl = row.querySelector(prefix + "Hpp");
  const nomEl = row.querySelector(prefix + "MarkupNominal");
  const perEl = row.querySelector(prefix + "MarkupPersen");
  const hrgEl = row.querySelector(prefix + "Harga");

  let hpp = parseRupiah(hppEl.value) || 0;
  let nom = parseRupiah(nomEl.value) || 0;
  let per = parseFloat(perEl.value) || 0;

  if (inputType === "hpp" || inputType === "nominal") {
    nom = parseRupiah(nomEl.value) || 0;
    if (hpp !== 0) perEl.value = Math.round((nom / hpp) * 100);
    else perEl.value = 0;
  } else {
    nom = hpp * (per / 100);
    nomEl.value = finance(String(Math.abs(Math.round(nom))));
  }

  const jual = hpp + nom;
  hrgEl.value = finance(String(Math.abs(Math.round(jual))));
  recalculateTotal();
}

function recalculateTotal() {
  document.querySelectorAll(".itemRow").forEach((row) => {
    const q = parseInt(row.querySelector(".itemQty").value || 0);
    const p = parseRupiah(row.querySelector(".itemHarga").value || "0");
    row.querySelector(".itemTotal").textContent = finance(q * p);
  });
  document.querySelectorAll(".subItemRow").forEach((row) => {
    const q = parseInt(row.querySelector(".subItemQty").value || 0);
    const p = parseRupiah(row.querySelector(".subItemHarga").value || "0");
    row.querySelector(".subItemTotal").textContent = finance(q * p);
  });
}

function setupRupiahFormattingForElement(element) {
  if (!element) return;

  element.addEventListener("input", function (e) {
    let value = e.target.value;

    // 1. Simpan tanda minus (jika ada)
    const isNegative = value.trim().startsWith("-");

    // 2. Ambil angkanya saja
    let rawValue = value.replace(/[^\d]/g, "");

    // 3. FIX: Hapus nol di depan (Leading Zero)
    // Jika user ngetik "05" -> jadi "5", "022" -> jadi "22"
    if (rawValue.length > 1 && rawValue.startsWith("0")) {
      rawValue = rawValue.substring(1);
    }

    // 4. Logika Kosong vs Isi
    if (rawValue === "") {
      // Izinkan kosong total saat dihapus
      e.target.value = "";
    } else {
      // Format Rupiah
      let formatted = finance(rawValue);
      e.target.value = isNegative ? "-" + formatted : formatted;
    }

    // 5. Trigger Recalculate (Sesuai logic Project Manual)
    const row = e.target.closest("tr");
    if (!row) return;

    if (
      e.target.classList.contains("itemHpp") ||
      e.target.classList.contains("subItemHpp")
    ) {
      recalculateHarga(e.target, "hpp");
    } else if (
      e.target.classList.contains("itemMarkupNominal") ||
      e.target.classList.contains("subItemMarkupNominal")
    ) {
      recalculateHarga(e.target, "nominal");
    }
  });
}

// --- FITUR UX: AUTO CLEAR 0 & AUTO REFILL 0 ---

// 1. Saat kolom diklik (Focus) -> Kalau isinya "0", hapus biar bersih
document.addEventListener("focusin", function (e) {
  if (e.target.classList.contains("finance")) {
    // Cek apakah isinya "0" atau "Rp 0"
    if (e.target.value === "0" || e.target.value === "Rp 0") {
      e.target.value = "";
    }
  }
});

// 2. Saat kolom ditinggalkan (Blur) -> Kalau kosong, balikin jadi "0"
document.addEventListener("focusout", function (e) {
  if (e.target.classList.contains("finance")) {
    if (e.target.value.trim() === "") {
      e.target.value = "0";

      // PENTING: Panggil ulang fungsi hitung agar total update
      // Kita trigger event 'input' secara manual agar logic recalculate jalan
      e.target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
});

function filterUnitSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();
  const suggestionBox = inputElement.nextElementSibling;
  if (!suggestionBox) return;

  clearTimeout(unitDebounceTimer);
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    return;
  }

  unitDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");
    try {
      const res = await fetch(
        `${baseUrl}/table/unit/${owner_id}/1?search=${inputVal}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } },
      );
      const result = await res.json();
      suggestionBox.innerHTML = "";
      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          const unitName = item.unit || "N/A";
          const li = document.createElement("li");
          li.textContent = unitName;
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";
          li.addEventListener("click", () => {
            inputElement.value = unitName;
            suggestionBox.classList.add("hidden");
          });
          suggestionBox.appendChild(li);
        });
      } else {
        suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Tidak ditemukan</li>`;
      }
    } catch (err) {
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Error</li>`;
    }
  }, 300);
}

function setTodayDate(elementId) {
  const d = document.getElementById(elementId);
  if (d) d.value = new Date().toISOString().split("T")[0];
}

function toggleTambahItemBtn() {
  const select = document.getElementById("add_type_id");
  const btnAdd = document.getElementById("addItemBtn");
  const btnSave = document.getElementById("saveNewProjectBtn"); // Ambil tombol simpan

  if (select && btnAdd && btnSave) {
    if (select.value !== "" && select.value !== "0") {
      btnAdd.classList.remove("hidden");
      btnSave.classList.remove("hidden"); // Munculkan tombol simpan
    } else {
      btnAdd.classList.add("hidden");
      btnSave.classList.add("hidden"); // Sembunyikan tombol simpan
    }
  }
}

async function loadSalesType(elementId) {
  const sel = document.getElementById(elementId);
  if (!sel) return;
  try {
    const res = await fetch(`${baseUrl}/list/type_sales`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();
    sel.innerHTML = '<option value="">Pilih Tipe</option>';
    json.listData.forEach((i) => {
      const opt = document.createElement("option");
      opt.value = i.type_id;
      opt.textContent = `${i.nama_type}`;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadProjectManagers(elementId) {
  const sel = document.getElementById(elementId);
  if (!sel) return;
  try {
    const res = await fetch(`${baseUrl}/list/project_manager/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();
    sel.innerHTML = '<option value="">-- Pilih PM --</option>';
    if (json.listData) {
      json.listData.forEach((i) => {
        const opt = document.createElement("option");
        opt.value = i.employee_id;
        opt.textContent = `${i.name}`;
        sel.appendChild(opt);
      });
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadSubcategories(selectElement, selectedId = "") {
  if (!selectElement) return;
  try {
    const res = await fetch(`${baseUrl}/list/sub_category/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();
    selectElement.innerHTML = `<option value="">-- Pilih Subcategory --</option>`;
    if (data.listData) {
      data.listData.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.sub_category_id;
        option.textContent = item.nama;
        if (selectedId && selectedId == item.sub_category_id)
          option.selected = true;
        selectElement.appendChild(option);
      });
    }
  } catch (err) {
    console.error(err);
  }
}
