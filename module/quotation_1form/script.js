pagemodule = "Quotation";
subpagemodule = "Form Quotation";
renderHeader();
submitInvoice = () => saveInvoice("create");
updateInvoice = () => saveInvoice("update", window.detail_id);

if (window.detail_id && window.detail_desc) {
  const simpanBtn = document.getElementById("simpanBtn");
  simpanBtn?.classList.add("hidden");
  // const downloadBtn = document.getElementById('downloadBtn');
  // downloadBtn?.classList.add("hidden");
  loadDetailSales(window.detail_id, window.detail_desc);
  // ✅ GANTI DENGAN BLOK INI
} else {
  // Bagian ini tetap sama
  setTodayDate();
  populateDropdown("/list/notes/", "catatan", "Pilih Catatan...");
  populateDropdown(
    "/list/terms/",
    "syarat_ketentuan",
    "Pilih Syarat & Ketentuan..."
  );
  populateDropdown(
    "/list/term_of_payment/",
    "term_pembayaran",
    "Pilih Term of Payment..."
  );
  loadSalesType();
  // loadPretextFromLocal();
  // loadCustomerList(owner_id);
  loadStatusOptions();

  document.getElementById("status").value = "Draft";

  // --- 💡 VALIDASI BARU DITAMBAHKAN DI SINI ---

  // 1. Ambil elemen-elemen terkait
  const tanggalInput = document.getElementById("tanggal");
  const typeSelect = document.getElementById("type_id");
  const picInput = document.getElementById("pic_name"); // Ambil input PIC

  // 2. Tambahkan listener untuk generate No QTN (ini sudah ada)
  tanggalInput.addEventListener("change", tryGenerateNoQtn);
  typeSelect.addEventListener("change", tryGenerateNoQtn);

  // 3. Tambahkan listener untuk update visibilitas tombol
  // Panggil saat Tipe berubah
  typeSelect.addEventListener("change", updateButtonVisibility);
  // Panggil saat PIC berubah (event 'input' menangkap ketikan atau perubahan value)
  picInput.addEventListener("input", updateButtonVisibility);

  // 4. Panggil sekali saat halaman load (mode create)
  // Ini akan langsung menyembunyikan tombol "Tambah Item" dan "Simpan"
  updateButtonVisibility();

  // --- Akhir Validasi Baru ---
}

// document.getElementById("tanggal").addEventListener("change", tryGenerateNoQtn);
// document.getElementById("type_id").addEventListener("change", tryGenerateNoQtn);

document.getElementById("btnVersionHistory").addEventListener("click", (e) => {
  e.stopPropagation();
  loadModuleContent("quotation_log", window.detail_id, no_qtn);
});

// ❗️ GANTI FUNGSI LAMA ANDA DENGAN INI
document.getElementById("client").addEventListener("change", function () {
  const selectedClientId = this.value;
  document.getElementById("client_id").value = selectedClientId;

  const picInput = document.getElementById("pic_name");

  if (selectedClientId) {
    // ❗️ Jika Client dipilih, enable input PIC
    picInput.disabled = false;
    picInput.value = ""; // Kosongkan input PIC
    picInput.placeholder = "Ketik nama PIC...";
    picInput.classList.remove("bg-gray-100");
  } else {
    // ❗️ Jika tidak ada Client, disable lagi
    picInput.disabled = true;
    picInput.value = "";
    picInput.placeholder = "-- Pilih Client Dulu --";
    picInput.classList.add("bg-gray-100");
  }
});

document.addEventListener("click", (e) => {
  const input = document.getElementById("client");
  const suggestionBox = document.getElementById("clientSuggestions");

  // Cek dulu apakah kedua elemen ada
  if (input && suggestionBox) {
    // Jika yang diklik bukan input dan bukan list, sembunyikan
    if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
      suggestionBox.classList.add("hidden");
    }
  }
});

async function loadSubcategories(selectElement, selectedId = "") {
  try {
    const res = await fetch(`${baseUrl}/list/sub_category/${owner_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();

    if (!data.listData || !Array.isArray(data.listData)) {
      selectElement.innerHTML = `<option value="">Tidak ada data</option>`;
      return;
    }

    selectElement.innerHTML = `<option value="">-- Pilih Subcategory --</option>`;
    data.listData.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.sub_category_id;
      option.textContent = item.nama;

      // 🔹 auto-select kalau sama dengan yang di detail sales
      if (selectedId && selectedId == item.sub_category_id) {
        option.selected = true;
      }

      selectElement.appendChild(option);
    });
    // console.log('DataGet List SubCategory:', data);
  } catch (err) {
    console.error("Gagal load subcategory:", err);
    selectElement.innerHTML = `<option value="">Gagal load</option>`;
  }
}

function setupRupiahFormattingForElement(element) {
  element.addEventListener("input", function (e) {
    const value = e.target.value.replace(/[^\d]/g, "");
    e.target.value = finance(value);

    // Calculate subtotal for this row
    const row = e.target.closest("tr");
    const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
    const harga = parseRupiah(e.target.value);
    const subtotal = qty * harga;
    row.querySelector(".itemTotal").textContent = finance(subtotal);

    // Recalculate totals
    calculateTotals();
  });
}

function toggleTambahItemBtn() {
  const select = document.getElementById("type_id");
  const btn = document.getElementById("tambahItembtn");

  if (select.value !== "" && select.value !== "0") {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
  }
}

function filterProdukDropdownCustom(inputEl) {
  const value = inputEl.value.toLowerCase();
  const dropdown = inputEl.nextElementSibling;
  const select = inputEl.parentElement.querySelector(".itemNama");
  dropdown.innerHTML = "";

  const filtered = produkList.filter((p) =>
    p.product.toLowerCase().includes(value)
  );
  if (filtered.length === 0) return dropdown.classList.add("hidden");

  filtered.forEach((p) => {
    const div = document.createElement("div");
    div.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer text-sm";
    div.textContent = p.product;
    div.onclick = () => {
      inputEl.value = p.product;
      inputEl.closest("tr").querySelector(".itemHarga").value =
        p.sale_price.toLocaleString("id-ID");
      const opt = Array.from(select.options).find(
        (o) => o.value == p.product_id
      );
      if (opt) select.value = opt.value;
      dropdown.classList.add("hidden");
      calculateTotals();
    };
    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

// document.addEventListener("input", function (e) {
//   if (e.target.classList.contains("finance")) {
//     const angka = e.target.value.replace(/[^\d]/g, "");
//     e.target.value = finance(angka);
//   }
// });

function parseRupiah(rupiah) {
  if (!rupiah || typeof rupiah !== "string") return 0;
  const isNegative = rupiah.trim().startsWith("-");
  const angkaString = rupiah.replace(/[^\d]/g, "");
  let angka = parseInt(angkaString) || 0;
  return isNegative ? -angka : angka;
}

// GANTI EVENT LISTENER LAMA DENGAN INI
// ...DENGAN BLOK YANG SUDAH DIPERBARUI INI:
document.addEventListener("input", function (e) {
  const id = e.target.id;
  const isRelevant = ["discount"].includes(id); // Tetap simpan ini

  // Logika baru untuk format .finance
  if (e.target.classList.contains("finance")) {
    const value = e.target.value;

    // Simpan status negatif
    const isNegative = value.trim().startsWith("-");

    // Hapus semua karakter non-digit
    const angka = value.replace(/[^\d]/g, "");

    // Asumsi Anda punya fungsi finance() untuk format "20000" -> "20.000"
    let formatted = finance(angka);

    // Tambahkan kembali tanda minus jika ada
    e.target.value = isNegative ? "-" + formatted : formatted;
  }

  // Tetap panggil calculateTotals jika relevan
  if (isRelevant) {
    calculateTotals();
  }
});

async function loadSalesType() {
  try {
    const response = await fetch(`${baseUrl}/list/type_sales`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data sales type");

    const result = await response.json();
    const salesTypes = result.listData;
    // console.log('Sales Type Data = ', salesTypes);

    const typeSelect = document.getElementById("type_id");
    typeSelect.innerHTML = '<option value="">Pilih Tipe</option>';

    salesTypes.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.type_id;
      option.textContent = `${item.nama_type} (${item.kode_type})`;
      typeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Gagal load sales type:", error);
  }
}

async function loadStatusOptions() {
  try {
    const response = await fetch(`${baseUrl}/status/sales`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const data = await response.json();
    // console.log('GET Status = ', data);

    if (data.response === "200") {
      const select = document.getElementById("status");
      select.innerHTML = "";

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Pilih Status --";
      select.appendChild(placeholder);

      data.data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.status_id;
        option.textContent = item.status_sales;
        select.appendChild(option);
      });
    } else {
      console.error("Gagal memuat status:", data.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadCustomerList() {
  try {
    const response = await fetch(`${baseUrl}/client/sales/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data client");

    const result = await response.json();
    customerList = result.data || [];

    // isi select option
    const select = document.getElementById("client");
    select.innerHTML = `<option value="">-- Pilih Client --</option>`; // reset isi dulu

    customerList.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.client_id; // simpan id client
      opt.textContent = `${item.nama_client} (${item.alias})`; // tampilkan nama_client (alias)
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error load client:", error);
    customerList = [];
  }
}

// 2. Fungsi untuk Client Suggestion
/**
 * Mencari Client & mengisi dropdown PIC saat dipilih.
 */
function filterClientSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();
  const suggestionBox = inputElement.nextElementSibling;

  if (!suggestionBox || suggestionBox.tagName !== "UL") return;

  clearTimeout(clientDebounceTimer);

  // Jika input kosong, reset PIC
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    populatePICDropdown([]); // Kosongkan PIC
    return;
  }

  clientDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      // Panggil API Client (yang ada 'contacts'-nya)
      const res = await fetch(
        `${baseUrl}/table/client/${owner_id}/1?search=${inputVal}`,
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
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";

          // SAAT CLIENT DIKLIK:
          li.addEventListener("click", () => {
            inputElement.value = clientName; // 1. Isi input Client
            suggestionBox.classList.add("hidden"); // 2. Sembunyikan box
            document.getElementById("client_id").value =
              item.pelanggan_id || ""; // 3. Set Client ID

            // 4. Panggil helper untuk mengisi PIC
            populatePICDropdown(item.contacts || []);
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
  }, 300);
}

// 3. Fungsi untuk PIC Suggestion
/**
 * ❗️ FUNGSI BARU (Versi Final)
 * Mencari PIC berdasarkan Client ID yang sedang aktif
 */
function filterPICSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();

  // 1. Ambil Client ID yang sedang dipilih
  const clientId = document.getElementById("client_id").value;

  const suggestionBox = inputElement.nextElementSibling;
  if (!suggestionBox || suggestionBox.tagName !== "UL") {
    console.error("Struktur HTML untuk suggestion box PIC salah.");
    return;
  }

  // Hentikan timer (debounce) sebelumnya
  clearTimeout(picDebounceTimer);

  // 2. Cek apakah ada Client ID
  if (!clientId) {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Harap pilih Client terlebih dahulu.</li>`;
    suggestionBox.classList.remove("hidden");
    return;
  }

  // 3. Jika input kosong, sembunyikan box
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    return;
  }

  // 4. Set timer baru untuk memanggil API
  picDebounceTimer = setTimeout(async () => {
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      // ❗️ Panggil API Contact yang support search DAN filter by client_id
      // (Endpoint ini dari solusi sebelumnya, ini yang paling tepat)
      const res = await fetch(
        `${baseUrl}/table/contact/${clientId}/1?search=${inputVal}`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        }
      );
      const result = await res.json();
      suggestionBox.innerHTML = ""; // Hapus "Mencari..."

      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          const picName = item.name || "N/A";

          const li = document.createElement("li");
          li.innerHTML = `<div class="font-medium">${picName}</div>`;
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";

          // Saat item diklik:
          li.addEventListener("click", () => {
            inputElement.value = picName; // 1. Isi input PIC
            suggestionBox.classList.add("hidden"); // 2. Sembunyikan box
          });
          suggestionBox.appendChild(li);
        });
      } else {
        suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Tidak ditemukan</li>`;
      }
    } catch (err) {
      console.error("Gagal fetch PIC:", err);
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Gagal memuat data</li>`;
    }
  }, 300); // Jeda 300 milidetik
}

function populatePICDropdown(contactsArray) {
  const picSelect = document.getElementById("pic_name");
  if (!picSelect) return;

  picSelect.innerHTML = ""; // Kosongkan

  if (contactsArray && contactsArray.length > 0) {
    picSelect.innerHTML = `<option value="">-- Pilih PIC --</option>`;

    contactsArray.forEach((contact) => {
      const option = document.createElement("option");
      option.value = contact.name; // Key dari JSON Anda
      option.textContent = contact.name; // Key dari JSON Anda
      picSelect.appendChild(option);
    });

    picSelect.disabled = false;
    picSelect.classList.remove("bg-gray-100");
  } else {
    picSelect.innerHTML = `<option value="">-- Tidak ada PIC --</option>`;
    picSelect.disabled = true;
    picSelect.classList.add("bg-gray-100");
  }
}
async function loadPICList(clientId) {
  const picSelect = document.getElementById("pic_name");
  if (!picSelect) return;

  // Jika tidak ada clientId (misal data lama), jangan error
  if (!clientId || clientId === "") {
    picSelect.innerHTML = `<option value="">-- Client tidak valid --</option>`;
    picSelect.disabled = true;
    picSelect.classList.add("bg-gray-100");
    return;
  }

  picSelect.innerHTML = `<option value="">Memuat PIC...</option>`;
  picSelect.disabled = true; // Nonaktifkan sementara loading

  try {
    // Panggil API /list/contact/ (yang hanya berisi list PIC)
    const response = await fetch(`${baseUrl}/list/contact/${clientId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Gagal mengambil data PIC");

    const result = await response.json();

    if (result.listData && result.listData.length > 0) {
      picSelect.innerHTML = `<option value="">-- Pilih PIC --</option>`;
      result.listData.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        picSelect.appendChild(option);
      });
      picSelect.disabled = false;
      picSelect.classList.remove("bg-gray-100");
    } else {
      picSelect.innerHTML = `<option value="">-- Tidak ada PIC --</option>`;
      picSelect.disabled = true; // Tetap nonaktif jika tidak ada PIC
      picSelect.classList.add("bg-gray-100");
    }
  } catch (error) {
    console.error("Gagal load PIC list:", error);
    picSelect.innerHTML = `<option value="">Gagal memuat PIC</option>`;
    picSelect.disabled = true;
  }
}

async function printInvoice(pesanan_id) {
  try {
    const response = await fetch(`${baseUrl}/detail/sales/${pesanan_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();
    const detail = result?.detail;
    if (!detail) throw new Error("Data faktur tidak ditemukan");

    const swalResult = await Swal.fire({
      title: "Cetak Quotation",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Print Preview",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (swalResult.isConfirmed) {
      // Jika klik Print Preview
      window.open(`quotation_print.html?id=${pesanan_id}`, "_blank");
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

async function tryGenerateNoQtn() {
  const order_date = document.getElementById("tanggal").value;
  const type_id = document.getElementById("type_id").value;

  if (!order_date || !type_id) return;

  try {
    const response = await fetch(`${baseUrl}/generate/noqtn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        order_date,
        type_id,
        owner_id: user.owner_id,
        user_id: user.user_id,
      }),
    });

    const result = await response.json();
    // console.log("Hasil generate:", result);

    // ambil dari result.data.no_qtn_content
    document.getElementById("no_qtn").value =
      result.data?.no_qtn_content || "[no_qtn kosong]";
  } catch (error) {
    console.error("Gagal generate no_qtn:", error);
  }
}

async function tambahItem() {
  const typeId = document.getElementById("type_id").value;
  const tbody = document.getElementById("tabelItem");

  const tr = document.createElement("tr");
  tr.classList.add("itemRow");
  const index = document.querySelectorAll("#tabelItem tr.itemRow").length + 1;

  tr.innerHTML = `
    <td class="border px-3 py-2 w-[5%] align-top">${index}</td>

    <td class="border px-5 py-2 w-[55%] align-top">
      <div class="mb-1">
        <label class="block text-xs text-gray-500">Type</label>
        <select class="w-full border rounded px-2 itemSubcategory"></select>
      </div>
      <div class="mb-1">
        <label class="block text-xs text-gray-500">Product</label>
        <input type="text" class="w-full border rounded px-2 itemProduct" placeholder="Product">
      </div>
      <div class="mb-1">
        <label class="block text-xs text-gray-500">Deskripsi</label>
        <textarea class="w-full border rounded px-2 itemDesc" rows="3" placeholder="Deskripsi"></textarea>
      </div>

      <div class="grid grid-cols-3 gap-2 p-2 border rounded bg-gray-50 my-2">
        <div>
          <label class="block text-xs text-gray-500">HPP (Modal)</label>
          <input type="text" class="w-full border rounded px-2 itemHpp text-right finance" value="0" oninput="recalculateHarga(this, 'hpp')">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Markup (Nominal)</label>
          <input type="text" class="w-full border rounded px-2 itemMarkupNominal text-right finance" value="0" oninput="recalculateHarga(this, 'nominal')">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Markup (%)</label>
          <input type="number" class="w-full border rounded px-2 itemMarkupPersen text-right" value="0" oninput="recalculateHarga(this, 'persen')">
        </div>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <div>
          <label class="block text-xs text-gray-500">Qty</label>
          <input type="number" class="w-full border rounded px-2 itemQty text-right" value="0" oninput="recalculateTotal()">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Unit</label>
          <div class="relative">
            <input 
              type="text" 
              class="w-full border rounded px-2 itemUnit" 
              placeholder="set"
              oninput="filterUnitSuggestions(this)" 
              autocomplete="off"
            >
            <ul class="absolute z-10 w-full bg-white border rounded mt-1 text-sm shadow hidden max-h-48 overflow-y-auto">
              </ul>
          </div>
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-500">Harga (Jual)</label>
          <input type="text" class="w-full border rounded px-2 itemHarga text-right bg-gray-100" value="0" readonly>
        </div>
      </div>
      
      <div class="mt-2">
        <label class="block text-xs text-gray-500">Sub Total</label>
        <div class="border rounded px-2 py-1 text-right bg-gray-50 itemTotal">0</div>
      </div>
    </td>

    <td class="border px-3 py-2 text-center w-[10%] align-top">
      <div class="flex flex-col items-center justify-center space-y-2">
        <button onclick="hapusItem(this)" 
          class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition" 
          title="Hapus Item">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        ${
          // ✅ UPDATE LOGIKA DI SINI: Muncul jika ID 2 (Service) atau ID 3 (Turnkey)
          typeId == 2 || typeId == 3
            ? `
          <button onclick="tambahSubItem(this)" 
            class="btnTambahSubItem inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition" 
            title="Tambah Sub Item">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>`
            : ""
        }
      </div>
    </td>
  `;

  // Wrapper untuk sub-item
  const subWrapper = document.createElement("tr");
  subWrapper.classList.add("subItemWrapper");
  subWrapper.innerHTML = `<td colspan="3" class="p-0"><table class="w-full"></table></td>`;

  tbody.appendChild(tr);
  tbody.appendChild(subWrapper);

  setupRupiahFormattingForElement(tr.querySelector(".itemHarga"));
  await loadSubcategories(tr.querySelector(".itemSubcategory"));
}

function tambahSubItem(btn) {
  const parentRow = btn.closest("tr");
  const subWrapper = parentRow.nextElementSibling?.querySelector("table");

  if (!subWrapper) return;

  const subTr = document.createElement("tr");
  subTr.classList.add("subItemRow", "bg-gray-50", "italic");

  subTr.innerHTML = `
    <td class="border px-3 py-2 w-[5%] text-center align-middle itemNumber"></td>

    <td class="border px-3 py-2 align-top">
      <div class="space-y-2">
        <div>
          <label class="block text-xs text-gray-500">Material</label>
          <input type="text" class="w-full border rounded px-2 subItemMaterial" placeholder="Material">
        </div>

        <div>
          <label class="block text-xs text-gray-500">Specification</label>
          <textarea class="w-full border rounded px-2 subItemSpec" rows="3" placeholder="Spesifikasi"></textarea>
        </div>

        <div class="grid grid-cols-3 gap-2 p-2 border rounded bg-white my-2">
          <div>
            <label class="block text-xs text-gray-500">HPP (Modal)</label>
            <input type="text" class="w-full border rounded px-2 subItemHpp text-right finance" value="0" oninput="recalculateHarga(this, 'hpp')">
          </div>
          <div>
            <label class="block text-xs text-gray-500">Markup (Nominal)</label>
            <input type="text" class="w-full border rounded px-2 subItemMarkupNominal text-right finance" value="0" oninput="recalculateHarga(this, 'nominal')">
          </div>
          <div>
            <label class="block text-xs text-gray-500">Markup (%)</label>
            <input type="number" class="w-full border rounded px-2 subItemMarkupPersen text-right" value="0" oninput="recalculateHarga(this, 'persen')">
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2">
          <div>
            <label class="block text-xs text-gray-500">Qty</label>
            <input type="number" class="w-full border rounded px-2 text-right subItemQty" value="0" oninput="recalculateTotal()">
          </div>
         <div>
          <label class="block text-xs text-gray-500">Unit</label>
          <div class="relative">
            <input 
              type="text" 
              class="w-full border rounded px-2 subItemUnit" 
              placeholder="pcs"
              oninput="filterUnitSuggestions(this)" 
              autocomplete="off"
            >
            <ul class="absolute z-10 w-full bg-white border rounded mt-1 text-sm shadow hidden max-h-48 overflow-y-auto">
              </ul>
          </div>
        </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-500">Harga (Jual)</label>
            <input type="text" class="w-full border rounded px-2 text-right subItemHarga bg-gray-100" value="0" readonly>
          </div>
        </div>
        
        <div class="mt-2">
          <label class="block text-xs text-gray-500">Sub Total</label>
          <div class="border rounded px-2 py-1 text-right bg-gray-100 subItemTotal">0</div>
        </div>
      </div>
    </td>

    <td class="border px-3 py-2 text-center w-[10%] align-middle">
      <button onclick="hapusItem(this)"
        class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
        title="Hapus Sub Item">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </td>
  `;

  subWrapper.appendChild(subTr);
  setupRupiahFormattingForElement(subTr.querySelector(".subItemHarga"));
}

function filterUnitSuggestions(inputElement) {
  const inputVal = inputElement.value.toLowerCase();

  // Ambil <ul> suggestion box yang ada TEPAT SETELAH input
  const suggestionBox = inputElement.nextElementSibling;
  if (!suggestionBox || suggestionBox.tagName !== "UL") {
    console.error("Struktur HTML untuk suggestion box unit salah.");
    return;
  }

  // Hentikan timer (debounce) sebelumnya
  clearTimeout(unitDebounceTimer);

  // Jika input kosong, sembunyikan box
  if (inputVal.length < 1) {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.add("hidden");
    return;
  }

  // Set timer baru untuk memanggil API setelah 300ms
  unitDebounceTimer = setTimeout(async () => {
    // Tampilkan status "Mencari..."
    suggestionBox.innerHTML = `<li class="px-3 py-2 text-gray-500 italic">Mencari...</li>`;
    suggestionBox.classList.remove("hidden");

    try {
      const res = await fetch(
        `${baseUrl}/table/unit/${owner_id}/1?search=${inputVal}`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        }
      );
      const result = await res.json();

      suggestionBox.innerHTML = ""; // Hapus "Mencari..."

      if (result.tableData && result.tableData.length > 0) {
        result.tableData.forEach((item) => {
          // ❗️ PENTING: Sesuaikan 'item.unit_name' jika key dari API Anda berbeda
          const unitName = item.unit || "N/A";

          const li = document.createElement("li");
          li.textContent = unitName;
          li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";

          // Saat item diklik, isi input dan sembunyikan list
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
      console.error("Gagal fetch unit:", err);
      suggestionBox.innerHTML = `<li class="px-3 py-2 text-red-500 italic">Gagal memuat data</li>`;
    }
  }, 300); // Jeda 300 milidetik
}

function hapusItem(button) {
  const row = button.closest("tr");
  row.remove();
  calculateTotals();
}

async function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  Swal.fire({
    title: "Loading...",
    text: "Sedang memuat detail data, mohon tunggu.",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const res = await fetch(`${baseUrl}/detail/sales/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const response = await res.json();

    if (!response || !response.detail) {
      throw new Error("Invalid API response structure - missing detail");
    }

    const data = response.detail;

    // 1. Load Dropdowns
    await Promise.all([
      loadSalesType(),
      loadPICList(data.pelanggan_id),
      loadStatusOptions(),
      populateDropdown("/list/notes/", "catatan", "Pilih Catatan..."),
      populateDropdown(
        "/list/terms/",
        "syarat_ketentuan",
        "Pilih Syarat & Ketentuan..."
      ),
      populateDropdown(
        "/list/term_of_payment/",
        "term_pembayaran",
        "Pilih Term of Payment..."
      ),
    ]);

    // 2. Isi Form Utama
    const typeField = document.getElementById("type_id");
    typeField.value = data.type_id || "";

    // ✅ BUKA KUNCI DROPDOWN (Agar bisa diklik)
    typeField.disabled = false;
    typeField.classList.remove("bg-gray-100");

    // ✅ JALANKAN FILTER (Service & Turnkey akan hilang jika ini Material)
    filterCompatibleTypes(data.type_id);

    // 3. Cek Status Approval
    const updateBtn = document.getElementById("updateBtn");
    const statusId = parseInt(data.status_id);

    // Hanya kunci jika status Approved (2) atau Completed (3)
    if (statusId === 2 || statusId === 3) {
      updateBtn?.classList.add("hidden");
      typeField.disabled = true;
      typeField.classList.add("bg-gray-100");
    } else {
      updateBtn?.classList.remove("hidden");
      toggleTambahItemBtn();

      // Pastikan tetap terbuka (untuk Draft/Revisi)
      typeField.disabled = false;
      typeField.classList.remove("bg-gray-100");
    }

    // --- Pengisian Field Lainnya ---
    document.getElementById("tanggal").value = data.tanggal_ymd || "";
    document.getElementById("no_qtn").value = data.no_qtn || "";
    document.getElementById("project_name").value = data.project_name || "";
    document.getElementById("revision_number").value =
      `R${data.revision_number}` || `R0`;
    document.getElementById("status").value = data.status || "Draft";

    const cleanCatatan = (data.catatan || "").trim().replace(/\r\n|\r/g, "\n");
    const cleanSnK = (data.syarat_ketentuan || "")
      .trim()
      .replace(/\r\n|\r/g, "\n");
    const cleanToP = (data.term_pembayaran || "")
      .trim()
      .replace(/\r\n|\r/g, "\n");
    document.getElementById("catatan").value = cleanCatatan;
    document.getElementById("syarat_ketentuan").value = cleanSnK;
    document.getElementById("term_pembayaran").value = cleanToP;
    document.getElementById("client_id").value = data.pelanggan_id || 0;
    document.getElementById("discount").value = finance(data.disc) || 0;
    document.getElementById("client").value = data.pelanggan_nama || "";
    document.getElementById("pic_name").value = data.pic_name || "";

    // --- LOAD ITEMS & SUBS ---
    const subcategoryRes = await fetch(
      `${baseUrl}/list/sub_category/${owner_id}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const subcatResponse = await subcategoryRes.json();
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    if (data.items?.length) {
      const renderPromises = [];
      for (const item of data.items) {
        renderPromises.push(
          (async () => {
            await tambahItem();
            let row = tbody.lastElementChild;
            if (!row.querySelector(".itemSubcategory")) {
              row = row.previousElementSibling;
            }

            const subcatSelect = row.querySelector(".itemSubcategory");
            await loadSubcategories(subcatSelect, item.sub_category_id);

            row.querySelector(".itemProduct").value = item.product || "";
            row.querySelector(".itemDesc").value = item.description || "";
            row.querySelector(".itemQty").value = item.qty || 1;
            row.querySelector(".itemUnit").value = item.unit || "";
            row.querySelector(".itemTotal").innerText = finance(
              item.total || item.qty * item.unit_price
            );
            row.querySelector(".itemHarga").value = finance(
              item.unit_price || 0
            );
            row.querySelector(".itemHpp").value = finance(item.hpp || 0);
            row.querySelector(".itemMarkupNominal").value = finance(
              item.markup_nominal || 0
            );
            row.querySelector(".itemMarkupPersen").value =
              item.markup_percent || 0;

            if (item.materials?.length) {
              for (const material of item.materials) {
                tambahSubItem(row.querySelector(".btnTambahSubItem"));
                const wrapper = row.nextElementSibling?.querySelector("table");
                const subTr = wrapper.querySelector(
                  "tr.subItemRow:last-of-type"
                );
                if (subTr) {
                  subTr.querySelector(".subItemMaterial").value =
                    material.name || "";
                  subTr.querySelector(".subItemSpec").value =
                    material.specification || "";
                  subTr.querySelector(".subItemQty").value = material.qty || 0;
                  subTr.querySelector(".subItemUnit").value =
                    material.unit || "";
                  subTr.querySelector(".subItemHarga").value = finance(
                    material.unit_price || 0
                  );
                  subTr.querySelector(".subItemHpp").value = finance(
                    material.hpp || 0
                  );
                  subTr.querySelector(".subItemMarkupNominal").value = finance(
                    material.markup_nominal || 0
                  );
                  subTr.querySelector(".subItemMarkupPersen").value =
                    material.markup_percent || 0;
                  subTr.querySelector(".subItemTotal").innerText = finance(
                    material.total || material.qty * material.unit_price
                  );
                }
              }
            }
          })()
        );
      }
      await Promise.all(renderPromises);
    }

    const ppnValue = parseInt(data.ppn) || 0;
    const cekPpn = document.getElementById("cekPpn");
    if (cekPpn && ppnValue > 0) cekPpn.checked = true;

    calculateTotals();
    window.dataLoaded = true;
    Swal.close();
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail penjualan", "error");
  }
}

/**
 * 💡 FUNGSI FILTER FINAL (SEGREGASI TOTAL)
 * - Grup A (Service/Turnkey): Hanya tampilkan opsi Service & Turnkey. Sembunyikan Material.
 * - Grup B (Material): Sembunyikan opsi Service & Turnkey. Tampilkan sisanya.
 */
function filterCompatibleTypes(currentTypeId) {
  const typeSelect = document.getElementById("type_id");
  if (!typeSelect) return;

  const currentIdStr = String(currentTypeId);

  // Definisi Grup A: Service (2) & Turnkey (3)
  const complexTypes = ["2", "3"];
  const isComplex = complexTypes.includes(currentIdStr);

  Array.from(typeSelect.options).forEach((option) => {
    // Jangan ubah placeholder
    if (option.value === "") return;

    // 1. Reset: Buka dulu semua opsi
    option.style.display = "block";
    option.hidden = false;
    option.disabled = false;

    // 2. Terapkan Logika Pemisahan
    if (isComplex) {
      // --- SKENARIO 1: Tipe Saat Ini = Service atau Turnkey ---
      // HANYA boleh melihat sesama Service/Turnkey.
      // Sembunyikan Material, dll.
      if (!complexTypes.includes(option.value)) {
        option.style.display = "none";
        option.hidden = true;
        option.disabled = true;
      }
    } else {
      // --- SKENARIO 2: Tipe Saat Ini = Material (Grup B) ---
      // TIDAK BOLEH melihat Service/Turnkey.
      // Sembunyikan Service (2) dan Turnkey (3).
      if (complexTypes.includes(option.value)) {
        option.style.display = "none";
        option.hidden = true;
        option.disabled = true;
      }
    }
  });
}

function recalculateTotal() {
  // Hitung itemRow
  document.querySelectorAll("#tabelItem tr.itemRow").forEach((row) => {
    const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
    const harga = parseRupiah(row.querySelector(".itemHarga")?.value || "0");
    const totalCell = row.querySelector(".itemTotal");
    if (totalCell) totalCell.textContent = finance(qty * harga);
  });

  // Hitung subItemRow
  document.querySelectorAll("#tabelItem tr.subItemRow").forEach((sub) => {
    const q = parseInt(sub.querySelector(".subItemQty")?.value || 0);
    const h = parseRupiah(sub.querySelector(".subItemHarga")?.value || "0");
    const t = q * h;
    sub.querySelector(".subItemTotal").textContent = finance(t);
  });

  calculateTotals();
}

function calculateTotals() {
  let subtotal = 0;

  // Ambil semua total item & subItem
  document
    .querySelectorAll("#tabelItem .itemTotal, #tabelItem .subItemTotal")
    .forEach((cell) => {
      subtotal += parseRupiah(cell.textContent || "0");
    });

  const diskon = parseRupiah(document.getElementById("discount")?.value || 0);
  const dpp = subtotal - diskon;

  // --- REVISI CEKLIS PPN ---
  const cekPpn = document.getElementById("cekPpn");
  let ppn = 0; // Default PPN adalah 0

  if (cekPpn && cekPpn.checked) {
    // Jika diceklis, baru hitung 11%
    ppn = Math.round(dpp * 0.11);
  }
  // --- AKHIR REVISI ---

  const total = dpp + ppn;

  document.getElementById("contract_amount").value = finance(subtotal);
  document.getElementById("ppn").value = finance(ppn);
  document.getElementById("total").value = finance(total);
}
function recalculateHarga(element, inputType) {
  const row = element.closest(".itemRow, .subItemRow");
  if (!row) return;

  const isSubItem = row.classList.contains("subItemRow");
  const prefix = isSubItem ? ".subItem" : ".item";

  const hppEl = row.querySelector(`${prefix}Hpp`);
  const nominalEl = row.querySelector(`${prefix}MarkupNominal`);
  const persenEl = row.querySelector(`${prefix}MarkupPersen`);
  const hargaEl = row.querySelector(`${prefix}Harga`); // Ini target output kita

  let hpp = parseRupiah(hppEl.value) || 0;
  let nominal = parseRupiah(nominalEl.value) || 0;
  let persen = parseFloat(persenEl.value) || 0;

  if (inputType === "hpp" || inputType === "nominal") {
    // Jika HPP atau Nominal diubah, hitung Persen
    nominal = parseRupiah(nominalEl.value) || 0; // parseRupiah baru kita sudah benar
    if (hpp !== 0) {
      persen = (nominal / hpp) * 100;
      // UBAH MENJADI INI:
      persenEl.value = Math.round(persen); // Dibulatkan tanpa koma // Tampilkan 2 angka desimal
    } else {
      persenEl.value = 0;
    }
  } else if (inputType === "persen") {
    // Jika Persen diubah, hitung Nominal
    persen = parseFloat(persenEl.value) || 0;
    nominal = hpp * (persen / 100);

    // --- REVISI DI SINI ---
    // Format output nominal agar bisa menampilkan minus
    let nominalStr = String(Math.abs(Math.round(nominal))); // Bulatkan & ambil angkanya saja
    nominalEl.value =
      nominal < 0 ? "-" + finance(nominalStr) : finance(nominalStr);
  }

  // Hitung Harga Jual akhir
  const hargaJual = hpp + nominal;

  // --- REVISI DI SINI ---
  // Format hargaJual juga, jaga tanda minus
  let hargaJualStr = String(Math.abs(Math.round(hargaJual))); // Bulatkan & ambil angkanya saja
  hargaEl.value =
    hargaJual < 0 ? "-" + finance(hargaJualStr) : finance(hargaJualStr);

  // Panggil recalculateTotal() untuk update Sub Total baris dan Total keseluruhan
  recalculateTotal();
}

// Fungsi ini sudah ada di kode Anda, pastikan key-nya benar
function loadPretextFromLocal() {
  try {
    // ⬇️ GANTI "KEY_YANG_BENAR" DENGAN KEY YANG ANDA TEMUKAN DI DEVTOOLS
    const userData = JSON.parse(localStorage.getItem("user"));

    if (!userData) {
      console.warn(
        "Data user tidak ditemukan di localStorage dengan key tersebut."
      );
      return;
    }

    // Set isi textarea
    document.getElementById("catatan").value = userData.sales_note || "";
    document.getElementById("syarat_ketentuan").value =
      userData.sales_snk || "";
    document.getElementById("term_pembayaran").value = userData.sales_top || "";
  } catch (err) {
    console.error("Gagal memuat pretext dari localStorage:", err);
  }
}

// GANTI DENGAN FUNGSI INI (TYPO SUDAH DIPERBAIKI)
async function saveInvoice(mode = "create", id = null) {
  try {
    calculateTotals();

    let revisionUpdate = "no";

    if (mode === "update") {
      const konfirmasi = await Swal.fire({
        title: "Update Data?",
        text: "Apakah kamu yakin ingin menyimpan perubahan?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "✅ Ya, simpan",
        cancelButtonText: "❌ Batal",
      });
      if (!konfirmasi.isConfirmed) return;

      const revisionConfirm = await Swal.fire({
        title: "Revision Update?",
        text: "Apakah perubahan ini disimpan sebagai revision update?",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Ya",
        cancelButtonText: "Tidak",
      });

      revisionUpdate = revisionConfirm.isConfirmed ? "yes" : "no";
    }

    const rows = document.querySelectorAll("#tabelItem tr");
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
      const unit = row.querySelector(".itemUnit")?.value.trim() || "";
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
          const subItemMaterial =
            sub.querySelector(".subItemMaterial")?.value.trim() || "";
          const subItemSpec =
            sub.querySelector(".subItemSpec")?.value.trim() || "";
          const subItemQty = parseInt(
            sub.querySelector(".subItemQty")?.value || 0
          );
          const subItemUnit =
            sub.querySelector(".subItemUnit")?.value.trim() || "pcs";
          const subItemHarga = parseRupiah(
            sub.querySelector(".subItemHarga")?.value || 0
          );
          const subItemHpp = parseRupiah(
            sub.querySelector(".subItemHpp")?.value || 0
          );
          const subItemMarkupNominal = parseRupiah(
            sub.querySelector(".subItemMarkupNominal")?.value || 0
          );
          const subItemMarkupPercent = parseFloat(
            sub.querySelector(".subItemMarkupPersen")?.value || 0
          );

          groupedItems[key].materials.push({
            subItemMaterial,
            subItemSpec,
            subItemQty,
            subItemUnit,
            subItemHarga,
            subItemHpp,
            subItemMarkupNominal,
            subItemMarkupPercent,
          });
        });
      }

      if (i % 50 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const items = Object.values(groupedItems);

    const owner_id = user.owner_id;
    const user_id = user.user_id;
    const nominalKontrak = parseRupiah(
      document.getElementById("contract_amount").value
    );
    const disc = parseRupiah(document.getElementById("discount")?.value || 0);
    const ppn = parseRupiah(document.getElementById("ppn").value);
    const total = parseRupiah(document.getElementById("total").value);

    const formData = new FormData();
    formData.append("owner_id", owner_id);
    formData.append("user_id", user_id);
    formData.append(
      "project_name",
      document.getElementById("project_name")?.value || "-"
    );
    formData.append("no_qtn", document.getElementById("no_qtn")?.value || "");
    formData.append("client", document.getElementById("client")?.value || "-");
    formData.append(
      "pic_name",
      document.getElementById("pic_name")?.value || "-"
    );
    formData.append(
      "pelanggan_id",
      parseInt(document.getElementById("client_id")?.value || 0)
    );
    formData.append(
      "type_id",
      parseInt(document.getElementById("type_id")?.value || 0)
    );
    formData.append(
      "order_date",
      document.getElementById("tanggal")?.value || ""
    );
    formData.append("contract_amount", nominalKontrak);
    formData.append("disc", disc);
    formData.append("ppn", ppn);
    formData.append("total", total);
    formData.append("status_id", 1);
    formData.append("revision_number", 0);
    formData.append(
      "revision_status",
      document.getElementById("revision_number").value
    );
    formData.append("revision_update", revisionUpdate);
    formData.append("items", JSON.stringify(items));
    formData.append(
      "catatan",
      document.getElementById("catatan")?.value || "-"
    );
    formData.append(
      "syarat_ketentuan",
      document.getElementById("syarat_ketentuan")?.value || "-"
    );
    formData.append(
      "term_pembayaran",
      document.getElementById("term_pembayaran")?.value || "-"
    );

    const fileInput = document.getElementById("file");
    if (fileInput && fileInput.files.length > 0) {
      for (let i = 0; i < fileInput.files.length; i++) {
        formData.append("files", fileInput.files[i]);
        if (i % 10 === 0)
          await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // --- 🔍 Tambahan Console Log Lengkap ---
    console.group("🔍 Data yang dikirim ke server");
    console.log(
      "URL:",
      mode === "create"
        ? `${baseUrl}/add/sales`
        : `${baseUrl}/update/sales/${id}`
    );
    console.log("Method:", mode === "create" ? "POST" : "PUT");

    console.log("\n🧾 Items (list lengkap):", items);
    console.log("\n📦 FormData (isi field):");
    for (const [key, val] of formData.entries()) {
      if (key === "items") {
        console.log(key, JSON.parse(val)); // biar kelihatan strukturnya
      } else {
        console.log(key, val);
      }
    }
    console.groupEnd();

    const url =
      mode === "create"
        ? `${baseUrl}/add/sales`
        : `${baseUrl}/update/sales/${id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });

    const json = await res.json();
    console.log("Response status:", res.status);
    console.log("Response JSON:", json);

    if (res.ok) {
      Swal.fire(
        "Sukses",
        `Quotation berhasil ${mode === "create" ? "dibuat" : "diupdate"}`,
        "success"
      );
      loadModuleContent("quotation");
    } else {
      Swal.fire("Gagal", json.message || "Gagal menyimpan data", "error");
    }
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Error", err.message || "Terjadi kesalahan", "error");
  }
}
/**
 * 💡 FUNGSI DIPERBARUI
 * Mengisi <select> dari endpoint pretext.
 * Menggunakan 'pretext' sebagai VALUE dan TEXT.
 */
async function populateDropdown(endpoint, selectElementId, placeholder) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return; // Pastikan elemen ada

  try {
    // 1. Ambil data dari API
    const response = await fetch(`${baseUrl}${endpoint}${owner_id}`, {
      // <-- ✅ DIPERBAIKI
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.listData && data.listData.length > 0) {
      selectElement.innerHTML = ""; // Kosongkan opsi "Memuat..."

      // Tambahkan placeholder
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = placeholder;
      selectElement.appendChild(defaultOption);

      // Loop dan buat <option>
      data.listData.forEach((item) => {
        const option = document.createElement("option");

        // ⬇️ PERUBAHAN PENTING ADA DI SINI ⬇️
        // Kita set VALUE dan TEXT ke 'pretext'
        // Ini agar 'saveInvoice' dan 'loadDetailSales' tidak perlu diubah
        option.value = item.pretext;
        option.textContent = item.pretext;

        selectElement.appendChild(option);
      });
    } else {
      selectElement.innerHTML = `<option value="">Data tidak ditemukan</option>`;
    }
  } catch (error) {
    console.error("Gagal memuat data untuk", selectElementId, error);
    selectElement.innerHTML = `<option value="">Gagal memuat data</option>`;
  }
}

// Panggil fungsi untuk setiap dropdown saat halaman dimuat
// document.addEventListener("DOMContentLoaded", () => {
//   populateDropdown("/list/notes/", "catatan", "Pilih Catatan...");
//   populateDropdown(
//     "/list/terms/",
//     "syarat_ketentuan",
//     "Pilih Syarat & Ketentuan..."
//   );
//   populateDropdown(
//     "/list/term_of_payment/",
//     "term_pembayaran",
//     "Pilih Term of Payment..."
//   );
// });
// 💡 GANTI FUNGSI toggleTambahItemBtn LAMA ANDA DENGAN FUNGSI INI
/**
 * Memeriksa apakah Tipe dan PIC sudah diisi,
 * lalu menampilkan/menyembunyikan tombol "Tambah Item" dan "Simpan".
 */
function updateButtonVisibility() {
  // 1. Ambil elemen yang relevan
  const typeSelect = document.getElementById("type_id");
  const picInput = document.getElementById("pic_name");

  const tambahBtn = document.getElementById("tambahItembtn");
  const simpanBtn = document.getElementById("simpanBtn"); // Tombol "Simpan" (mode create)

  // 2. Cek kondisi
  const typeIsValid = typeSelect.value !== "" && typeSelect.value !== "0";
  // Cek apakah PIC input tidak kosong (setelah diisi dari suggestion/select)
  const picIsValid = picInput.value.trim() !== "";

  // 3. Atur visibilitas Tombol "Tambah Item"
  if (tambahBtn) {
    if (typeIsValid && picIsValid) {
      tambahBtn.classList.remove("hidden");
    } else {
      tambahBtn.classList.add("hidden");
    }
  }

  // 4. Atur visibilitas Tombol "Simpan" (hanya jika ada, di mode create)
  if (simpanBtn) {
    // Tombol simpan juga memerlukan Tipe dan PIC
    if (typeIsValid && picIsValid) {
      simpanBtn.classList.remove("hidden");
    } else {
      simpanBtn.classList.add("hidden");
    }
  }
}
