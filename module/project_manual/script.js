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

  // Load Dropdowns (Hapus loadCustomerList dari sini)
  try {
    await Promise.all([
      loadSalesType("add_type_id"),
      // loadCustomerList("add_client"), // <-- HAPUS ATAU KOMENTAR BARIS INI
      loadProjectManagers("add_project_manager"),
    ]);
  } catch (e) {
    console.error("Gagal load dropdown", e);
  }

  // Logic per Mode
  if (currentModeManual === "create") {
    setTodayDate("add_tanggal");
    setTodayDate("add_finish_date");
    document.getElementById(
      "tabelItemAdd"
    ).innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">Belum ada item.</td></tr>`;
    document.getElementById("saveNewProjectBtn").onclick = () =>
      saveProject("create");
  } else {
    const projectId = window.detail_id;
    const projectDesc = window.detail_desc || "Update";
    document.getElementById(
      "formTitleManual"
    ).textContent = `Update: ${projectDesc}`;
    document.getElementById("saveNewProjectBtn").onclick = () =>
      saveProject("update", projectId);
    await loadProjectDataForUpdate(projectId);
  }
})();

function filterClientSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();
  const suggestionBox = document.getElementById("clientSuggestionList"); // Sesuai ID di HTML baru
  const hiddenIdInput = document.getElementById("add_client");

  if (!suggestionBox) return;

  clearTimeout(clientDebounceTimer);

  // Jika input kosong
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    hiddenIdInput.value = ""; // Reset ID jika nama dihapus
    return;
  }

  clientDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      // API Search Client
      const res = await fetch(
        `${baseUrl}/table/client/${owner_id}/1?search=${encodeURIComponent(
          inputVal
        )}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } }
      );
      const result = await res.json();
      suggestionBox.innerHTML = "";

      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          const clientName = item.nama || "N/A";
          const clientAlias = item.alias ? `(${item.alias})` : "";

          const li = document.createElement("li");
          li.innerHTML = `
            <div class="font-medium">${clientName}</div>
            <div class="text-xs text-gray-500">${clientAlias}</div>
          `;
          li.className =
            "px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0";

          // SAAT KLIK ITEM:
          li.addEventListener("click", () => {
            inputElement.value = clientName; // Isi Text Input
            hiddenIdInput.value = item.pelanggan_id || ""; // Isi Hidden ID
            suggestionBox.classList.add("hidden"); // Tutup Suggestion

            // Opsional: Jika ada logika PIC, tambahkan di sini.
            // Untuk modul Project Manual default, biasanya PIC belum mandatory di tahap ini.
          });
          suggestionBox.appendChild(li);
        });
      } else {
        suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Tidak ditemukan</li>`;
      }
    } catch (err) {
      console.error("Gagal fetch client:", err);
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Gagal memuat data</li>`;
    }
  }, 300); // Debounce 300ms
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

    // --- LOGIC LOCKING ---
    const isLocked = data.pesanan_id ? true : false;

    // 1. Tombol Convert (muncul jika belum jadi sales)
    if (!isLocked) {
      document.getElementById("convertToSalesBtn").classList.remove("hidden");
    } else {
      document.getElementById("saveNewProjectBtn").classList.add("hidden");
      document.getElementById("addItemBtn").classList.add("hidden");
      document.getElementById(
        "formTitleManual"
      ).innerHTML += ` <span class="text-red-500 text-sm">(Locked / Sales Order Created)</span>`;
    }

    // Isi Form Standard
    document.getElementById("add_project_name").value = data.project_name || "";

    document.getElementById("add_client_name").value =
      data.customer || data.client_name || "";
    // Isi Hidden Input dengan ID Pelanggan
    document.getElementById("add_client").value = data.pelanggan_id || "";
    document.getElementById("add_tanggal").value = data.start_date || "";
    document.getElementById("add_finish_date").value = data.finish_date || "";
    document.getElementById("add_project_manager").value =
      data.project_manager_id || "";

    // --- 💡 PERBAIKAN DROPDOWN TIPE DI SINI ---
    const typeSelect = document.getElementById("add_type_id");
    typeSelect.value = data.type_id || "";

    // ✅ REQUEST: Jangan dilock (disabled), biarkan user bisa klik ganti tipe
    typeSelect.disabled = false;
    typeSelect.classList.remove("bg-gray-100");

    // ✅ Jalankan filter untuk menghilangkan opsi yang tidak kompatibel
    filterCompatibleTypes(data.type_id);

    // Panggil toggle agar tombol Tambah Item muncul/hilang
    toggleTambahItemBtn();

    // Logic locking input LAINNYA (selain type_id)
    if (isLocked) {
      // Disable input lain kecuali type_id (karena request type_id jangan dilock)
      const inputs = document.querySelectorAll(
        "#addProjectForm input, #addProjectForm select:not(#add_type_id)"
      );
      inputs.forEach((el) => (el.disabled = true));
    }

    // Render Table Items
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
        itemRow.querySelector(".itemHpp").value = finance(item.hpp || 0);
        itemRow.querySelector(".itemMarkupNominal").value = finance(
          item.markup_nominal || 0
        );
        itemRow.querySelector(".itemMarkupPersen").value =
          item.markup_percent || 0;
        recalculateHarga(itemRow.querySelector(".itemHpp"), "hpp");

        if (isLocked) {
          // Kunci input dalam tabel jika locked
          itemRow
            .querySelectorAll("input, textarea, select, button")
            .forEach((el) => (el.disabled = true));
          const delBtn = itemRow.querySelector("button[onclick^='hapusItem']");
          if (delBtn) delBtn.classList.add("hidden");
          const addSubBtn = itemRow.querySelector(".btnTambahSubItem");
          if (addSubBtn) addSubBtn.classList.add("hidden");
        }

        if (item.materials?.length) {
          for (const mat of item.materials) {
            const subRow = tambahSubItem({ closest: () => itemRow });
            if (!subRow) continue;

            subRow.querySelector(".subItemMaterial").value = mat.name || "";
            subRow.querySelector(".subItemSpec").value =
              mat.specification || "";
            subRow.querySelector(".subItemQty").value = mat.qty || 1;
            subRow.querySelector(".subItemUnit").value = mat.unit || "pcs";
            subRow.querySelector(".subItemHpp").value = finance(mat.hpp || 0);
            subRow.querySelector(".subItemMarkupNominal").value = finance(
              mat.markup_nominal || 0
            );
            subRow.querySelector(".subItemMarkupPersen").value =
              mat.markup_percent || 0;
            recalculateHarga(subRow.querySelector(".subItemHpp"), "hpp");

            if (isLocked) {
              subRow
                .querySelectorAll("input, select, button, textarea")
                .forEach((el) => (el.disabled = true));
              const delSub = subRow.querySelector(
                "button[onclick^='hapusItem']"
              );
              if (delSub) delSub.classList.add("hidden");
            }
          }
        }
      }
    }
    Swal.close();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data", "error");
    loadModuleContent("project");
  }
}

/**
 * 💡 FUNGSI FILTER BARU
 * Memfilter opsi Tipe Sales agar user hanya bisa berpindah antar tipe yang sejenis.
 */
/**
 * 💡 FUNGSI FILTER UPDATE
 * Menghilangkan (HIDE) opsi yang tidak sejenis, bukan sekadar disable.
 */
function filterCompatibleTypes(currentTypeId) {
  const typeSelect = document.getElementById("add_type_id");
  if (!typeSelect) return;

  const currentIdStr = String(currentTypeId);

  // Group A: Service (2) & Turnkey (3)
  const complexTypes = ["2", "3"];
  const isComplex = complexTypes.includes(currentIdStr);

  Array.from(typeSelect.options).forEach((option) => {
    if (option.value === "") return; // Skip placeholder

    // Reset style dulu
    option.style.display = "";
    option.hidden = false;

    let shouldHide = false;

    if (isComplex) {
      // Jika Group A (Service/Turnkey), HILANGKAN Group B (Material dll)
      if (!complexTypes.includes(option.value)) {
        shouldHide = true;
      }
    } else {
      // Jika Group B (Material), HILANGKAN Group A (Service/Turnkey)
      if (complexTypes.includes(option.value)) {
        shouldHide = true;
      }
    }

    if (shouldHide) {
      // ✅ LOGIKA BARU: Sembunyikan total
      option.style.display = "none";
      option.hidden = true; // Support browser modern
      option.disabled = true; // Backup agar tidak bisa dipilih via keyboard
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
      title: "Simpan?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
    });
    if (!confirm.isConfirmed) return;

    Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

    const rows = document.querySelectorAll("#tabelItemAdd tr");
    const groupedItems = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.querySelector(".itemProduct")) continue;

      const sub_category_id = parseInt(
        row.querySelector(".itemSubcategory")?.value || 0
      );
      const product = row.querySelector(".itemProduct")?.value.trim() || "";
      const description = row.querySelector(".itemDesc")?.value.trim() || "";
      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const unit = row.querySelector(".itemUnit")?.value.trim() || "pcs";
      const unit_price = parseRupiah(
        row.querySelector(".itemHarga")?.value || 0
      );
      const hpp = parseRupiah(row.querySelector(".itemHpp")?.value || 0);
      const markup_nominal = parseRupiah(
        row.querySelector(".itemMarkupNominal")?.value || 0
      );
      const markup_percent = parseFloat(
        row.querySelector(".itemMarkupPersen")?.value || 0
      );

      const key = `${sub_category_id}-${product}`;
      if (!groupedItems[key]) {
        groupedItems[key] = {
          product,
          sub_category_id,
          description,
          qty,
          unit,
          unit_price,
          hpp,
          markup_nominal,
          markup_percent,
          materials: [],
        };
      }

      const subWrapper = row.nextElementSibling;
      if (subWrapper && subWrapper.classList.contains("subItemWrapper")) {
        const subItems = subWrapper.querySelectorAll(".subItemRow");
        subItems.forEach((sub) => {
          groupedItems[key].materials.push({
            subItemMaterial:
              sub.querySelector(".subItemMaterial")?.value.trim() || "",
            subItemSpec: sub.querySelector(".subItemSpec")?.value.trim() || "",
            subItemQty: parseInt(sub.querySelector(".subItemQty")?.value || 0),
            subItemUnit:
              sub.querySelector(".subItemUnit")?.value.trim() || "pcs",
            subItemHarga: parseRupiah(
              sub.querySelector(".subItemHarga")?.value || 0
            ),
            subItemHpp: parseRupiah(
              sub.querySelector(".subItemHpp")?.value || 0
            ),
            subItemMarkupNominal: parseRupiah(
              sub.querySelector(".subItemMarkupNominal")?.value || 0
            ),
            subItemMarkupPercent: parseFloat(
              sub.querySelector(".subItemMarkupPersen")?.value || 0
            ),
          });
        });
      }
    }
    const items = Object.values(groupedItems);

    const payload = {
      project_name:
        document.getElementById("add_project_name")?.value || "Project Baru",
      pelanggan_id: parseInt(document.getElementById("add_client")?.value || 0),
      type_id: parseInt(document.getElementById("add_type_id")?.value || 0),
      project_manager_id: parseInt(
        document.getElementById("add_project_manager")?.value || 0
      ),
      start_date: document.getElementById("add_tanggal")?.value || "",
      finish_date: document.getElementById("add_finish_date")?.value || "",
      owner_id: user.owner_id,
      user_id: user.user_id,
      items: items,
    };

    if (mode === "update") {
      delete payload.user_id;

      // --- PERUBAHAN DISINI: Tambah Key Position ---
      // Karena ini file Project Manual, kita set 'Direct Sales'
      payload.position = "Direct Sales";
    }

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
      Swal.fire("Sukses", "Data tersimpan", "success");
      loadModuleContent("project");
    } else {
      Swal.fire("Gagal", json.message, "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  }
}

// --- CONVERT TO SALES (Fungsi Pindahan) ---

async function openConvertToSalesModal() {
  if (!projectDetailData) return Swal.fire("Error", "Data belum siap", "error");

  const customerName =
    projectDetailData.customer || projectDetailData.client_name;
  let clientId = projectDetailData.pelanggan_id || projectDetailData.client_id;

  // Fallback search if ID missing
  if (!clientId && customerName) {
    try {
      const res = await fetch(
        `${baseUrl}/table/client/${owner_id}/1?search=${encodeURIComponent(
          customerName
        )}`,
        { headers: { Authorization: `Bearer ${API_TOKEN}` } }
      );
      const json = await res.json();
      if (json.tableData?.length > 0) clientId = json.tableData[0].pelanggan_id;
    } catch (e) {
      console.error("Gagal cari client ID");
    }
  }

  let picOptions = '<option value="">-- Pilih PIC --</option>';
  if (clientId) {
    try {
      const res = await fetch(`${baseUrl}/list/contact/${clientId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      const json = await res.json();
      if (json.listData)
        json.listData.forEach(
          (c) => (picOptions += `<option value="${c.name}">${c.name}</option>`)
        );
    } catch (e) {}
  }

  const { value: formValues } = await Swal.fire({
    title: "Buat Sales Order",
    html: `
      <input type="hidden" id="swal_client" value="${clientId || ""}">
      <div class="text-left space-y-3">
        <div><label class="text-xs font-bold block mb-1">TANGGAL ORDER</label><input type="date" id="swal_date" class="w-full border p-2 rounded" value="${
          new Date().toISOString().split("T")[0]
        }"></div>
        <div><label class="text-xs font-bold block mb-1">PIC</label><select id="swal_pic" class="w-full border p-2 rounded bg-white">${picOptions}</select></div>
      </div>`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    preConfirm: () => {
      const date = document.getElementById("swal_date").value;
      const pic = document.getElementById("swal_pic").value;
      const cid = document.getElementById("swal_client").value;
      if (!date || !pic) Swal.showValidationMessage("Lengkapi data");
      if (!cid)
        Swal.showValidationMessage(
          "ID Client tidak ditemukan. Pastikan client terpilih dengan benar."
        );
      return { date, pic, cid };
    },
  });

  if (formValues) handleSaveConvertToSales(formValues);
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

  if (!finalClientId) {
    Swal.fire(
      "Gagal",
      "ID Client tidak valid. Mohon pilih client ulang.",
      "error"
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
        projectDetailData.project_name
      );
    } else {
      throw new Error(json.message);
    }
  } catch (e) {
    Swal.fire("Gagal", e.message, "error");
  }
}

// --- ITEM FUNCTIONS ---

async function tambahItem(selectedSubCategoryId = "") {
  const tbody = document.getElementById("tabelItemAdd");

  const typeId = document.getElementById("add_type_id")?.value || "0";

  // --- REVISI DI SINI ---
  // Kita cek apakah td tersebut benar-benar mengandung teks "Belum ada item"
  const placeholderTd = tbody.querySelector('td[colspan="3"]');
  if (placeholderTd && placeholderTd.textContent.includes("Belum ada item")) {
    tbody.innerHTML = "";
  }
  // ---------------------

  const tr = document.createElement("tr");
  tr.classList.add("itemRow");

  // Hitung index berdasarkan jumlah row item yang ada
  const index =
    document.querySelectorAll("#tabelItemAdd tr.itemRow").length + 1;

  tr.innerHTML = `
    <td class="border px-3 py-2 w-[5%] align-top text-center font-semibold">${index}</td>
    <td class="border px-5 py-2 w-[55%] align-top">
      <div class="mb-1">
        <label class="text-xs text-gray-500 font-bold">Type</label>
        <select class="w-full border rounded px-2 py-1 itemSubcategory focus:ring-2 focus:ring-blue-500 outline-none transition"></select>
      </div>
      <div class="mb-1">
        <label class="text-xs text-gray-500 font-bold">Product</label>
        <input type="text" class="w-full border rounded px-2 py-1 itemProduct focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Nama Produk">
      </div>
      <div class="mb-1">
        <label class="text-xs text-gray-500 font-bold">Deskripsi</label>
        <textarea class="w-full border rounded px-2 py-1 itemDesc focus:ring-2 focus:ring-blue-500 outline-none transition" rows="2" placeholder="Deskripsi"></textarea>
      </div>
      <div class="grid grid-cols-3 gap-2 my-2">
        <div><label class="text-xs text-gray-500">HPP (Modal)</label><input type="text" class="w-full border rounded px-2 py-1 itemHpp finance" value="0" oninput="recalculateHarga(this, 'hpp')"></div>
        <div><label class="text-xs text-gray-500">Markup (Rp)</label><input type="text" class="w-full border rounded px-2 py-1 itemMarkupNominal finance" value="0" oninput="recalculateHarga(this, 'nominal')"></div>
        <div><label class="text-xs text-gray-500">Markup (%)</label><input type="number" class="w-full border rounded px-2 py-1 itemMarkupPersen" value="0" oninput="recalculateHarga(this, 'persen')"></div>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <div><label class="text-xs text-gray-500">Qty</label><input type="number" class="w-full border rounded px-2 py-1 itemQty" value="1" oninput="recalculateTotal()"></div>
        <div>
           <label class="text-xs text-gray-500">Unit</label>
           <div class="relative">
             <input type="text" class="w-full border rounded px-2 py-1 itemUnit" placeholder="set" oninput="filterUnitSuggestions(this)" autocomplete="off">
             <ul class="absolute z-10 w-full bg-white border shadow hidden max-h-48 overflow-y-auto rounded-md"></ul>
           </div>
        </div>
        <div class="col-span-2"><label class="text-xs text-gray-500">Harga (Jual)</label><input type="text" class="w-full border rounded px-2 py-1 itemHarga bg-gray-100 font-bold text-gray-700" readonly></div>
      </div>
      <div class="mt-2 items-center">
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
          // ✅ UPDATE LOGIKA DI SINI: Muncul jika ID 2 (Service) atau ID 3 (Turnkey)
          typeId == 2 || typeId == 3
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
    selectedSubCategoryId
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
         <label class="text-xs text-gray-500">Material Name</label>
         <input type="text" class="w-full border rounded subItemMaterial" placeholder="Material">
       </div>
       
       <div class="mb-1">
         <label class="text-xs text-gray-500">Specification</label>
         <textarea class="w-full border rounded subItemSpec" rows="3" placeholder="Spesifikasi"></textarea>
       </div>

       <div class="grid grid-cols-3 gap-2 my-2">
          <div>
            <label class="text-xs text-gray-500">HPP</label>
            <input type="text" class="w-full border rounded subItemHpp finance" value="0" oninput="recalculateHarga(this, 'hpp')">
          </div>
          <div>
            <label class="text-xs text-gray-500">Markup (Rp)</label>
            <input type="text" class="w-full border rounded subItemMarkupNominal finance" value="0" oninput="recalculateHarga(this, 'nominal')">
          </div>
          <div>
            <label class="text-xs text-gray-500">Markup (%)</label>
            <input type="number" class="w-full border rounded subItemMarkupPersen" value="0" oninput="recalculateHarga(this, 'persen')">
          </div>
       </div>

       <div class="grid grid-cols-4 gap-2">
          <div>
            <label class="text-xs text-gray-500">Qty</label>
            <input type="number" class="w-full border rounded subItemQty" value="1" oninput="recalculateTotal()">
          </div>
          <div>
            <label class="text-xs text-gray-500">Unit</label>
            <div class="relative">
              <input type="text" class="w-full border rounded subItemUnit" placeholder="pcs" oninput="filterUnitSuggestions(this)" autocomplete="off">
              <ul class="absolute z-10 w-full bg-white border shadow hidden max-h-48 overflow-y-auto"></ul>
            </div>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Harga Jual</label>
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
    const value = e.target.value.replace(/[^\d]/g, "");
    e.target.value = finance(value);
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
        { headers: { Authorization: `Bearer ${API_TOKEN}` } }
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
