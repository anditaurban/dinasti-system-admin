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
} else {
  setTodayDate();
  loadSalesType();
  loadPretextFromLocal();
  loadCustomerList(owner_id);
  loadStatusOptions();

  document.getElementById("status").value = "Draft";
  document
    .getElementById("tanggal")
    .addEventListener("change", tryGenerateNoQtn);
  document
    .getElementById("type_id")
    .addEventListener("change", tryGenerateNoQtn);
}

// document.getElementById("tanggal").addEventListener("change", tryGenerateNoQtn);
// document.getElementById("type_id").addEventListener("change", tryGenerateNoQtn);

document.getElementById("btnVersionHistory").addEventListener("click", (e) => {
  e.stopPropagation();
  loadModuleContent("quotation_log", window.detail_id, no_qtn);
});

document.getElementById("client").addEventListener("change", function () {
  document.getElementById("client_id").value = this.value;
  const selected = customerList.find((c) => c.client_id == this.value);
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

  // GANTI BAGIAN tr.innerHTML DI FUNGSI tambahItem() DENGAN INI:
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
          <input type="number" class="w-full border rounded px-2 itemQty text-right" value="1" oninput="recalculateTotal()">
        </div>
        <div>
          <label class="block text-xs text-gray-500">Unit</label>
          <input type="text" class="w-full border rounded px-2 itemUnit" placeholder="set">
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
          typeId == 3
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

  // GANTI BAGIAN subTr.innerHTML DI FUNGSI tambahSubItem() DENGAN INI:
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
          <input type="text" class="w-full border rounded px-2 subItemSpec" placeholder="Spesifikasi">
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
            <input type="number" class="w-full border rounded px-2 text-right subItemQty" value="1" oninput="recalculateTotal()">
          </div>
          <div>
            <label class="block text-xs text-gray-500">Unit</label>
            <input type="text" class="w-full border rounded px-2 subItemUnit" placeholder="pcs">
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

function hapusItem(button) {
  const row = button.closest("tr");
  row.remove();
  calculateTotals();
}

// GANTI SELURUH FUNGSI ANDA DENGAN INI
async function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  // 🔹 Tampilkan loading
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

    // ⚡ Tunggu semua load async selesai
    await Promise.all([
      loadCustomerList(),
      loadSalesType(),
      loadStatusOptions(),
    ]);

    const typeField = document.getElementById("type_id");
    typeField.value = data.type_id || "";
    typeField.disabled = true;

    const updateBtn = document.getElementById("updateBtn");
    if (data.status_id === 2 || data.status_id === 3) {
      updateBtn?.classList.add("hidden");
    } else {
      updateBtn?.classList.remove("hidden");
      toggleTambahItemBtn();
    }

    // 📝 Isi form utama
    document.getElementById("tanggal").value = data.tanggal_ymd || "";
    document.getElementById("type_id").value = data.type_id || "";
    document.getElementById("no_qtn").value = data.no_qtn || "";
    document.getElementById("project_name").value = data.project_name || "";
    document.getElementById("revision_number").value =
      `R${data.revision_number}` || `R0`;
    document.getElementById("status").value = data.status || "Draft";
    document.getElementById("catatan").value = data.catatan || "";
    document.getElementById("syarat_ketentuan").value =
      data.syarat_ketentuan || "";
    document.getElementById("term_pembayaran").value =
      data.term_pembayaran || "";
    document.getElementById("client_id").value = data.pelanggan_id || 0;
    document.getElementById("pic_name").value = data.pic_name || 0;
    document.getElementById("discount").value = finance(data.disc) || 0;

    // 🔹 Ambil nama client
    const clientSelect = document.getElementById("client");
    const clientOptions = Array.from(clientSelect.options);
    const selectedClientOption = clientOptions.find(
      (opt) => opt.value == data.pelanggan_id
    );
    if (selectedClientOption) clientSelect.value = selectedClientOption.value;

    const logBtn = document.getElementById("logBtn");
    if (logBtn) {
      logBtn.setAttribute(
        "onclick",
        `event.stopPropagation(); loadModuleContent('sales_log', '${Id}')`
      );
      logBtn.classList.remove("hidden");
    }

    const versionDiv = document.getElementById("versionInfo");
    if (versionDiv) {
      versionDiv.classList.remove("hidden");
      const btnHistory = document.getElementById("btnVersionHistory");
      if (btnHistory) {
        btnHistory.onclick = (event) => {
          event.preventDefault();
          loadModuleContent("quotation_log", Id);
        };
      }
    }

    // 🔹 Load subcategories
    const subcategoryRes = await fetch(
      `${baseUrl}/list/sub_category/${owner_id}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    if (!subcategoryRes.ok) {
      throw new Error(
        `Failed to load subcategories, status: ${subcategoryRes.status}`
      );
    }
    const subcatResponse = await subcategoryRes.json();
    const subcats = Array.isArray(subcatResponse.listData)
      ? subcatResponse.listData
      : [];

    // 🔹 Render item rows
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    if (data.items?.length) {
      const renderPromises = [];
      for (const item of data.items) {
        renderPromises.push(
          (async () => {
            tambahItem();
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

            // <-- BARU: Isi data HPP untuk Item Utama -->
            // Asumsi key dari API adalah: hpp, markup_nominal, markup_percent
            row.querySelector(".itemHpp").value = finance(item.hpp || 0);
            row.querySelector(".itemMarkupNominal").value = finance(
              item.markup_nominal || 0
            );
            row.querySelector(".itemMarkupPersen").value =
              item.markup_percent || 0;
            // <-- AKHIR BARU -->

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

                  // <-- BARU: Isi data HPP untuk Sub-Item -->
                  // Asumsi key dari API adalah: hpp, markup_nominal, markup_percent
                  subTr.querySelector(".subItemHpp").value = finance(
                    material.hpp || 0
                  );
                  subTr.querySelector(".subItemMarkupNominal").value = finance(
                    material.markup_nominal || 0
                  );
                  subTr.querySelector(".subItemMarkupPersen").value =
                    material.markup_percent || 0;
                  // <-- AKHIR BARU -->

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
    if (cekPpn && ppnValue > 0) {
      cekPpn.checked = true;
    }

    calculateTotals();
    window.dataLoaded = true;

    // ✅ Tutup loading
    Swal.close();
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail penjualan", "error");
  }
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

    let revisionUpdate = "no"; // default

    // --- Konfirmasi update ---
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

      // --- Tanya apakah ini revision update ---
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

      // --- AMBIL DATA ITEM (TERMASUK HPP) ---
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
      // --- TAMBAHAN DATA HPP ---
      const hpp = parseRupiah(row.querySelector(".itemHpp")?.value || 0);
      const markup_nominal = parseRupiah(
        row.querySelector(".itemMarkupNominal")?.value || 0
      );
      const markup_percent = parseFloat(
        row.querySelector(".itemMarkupPersen")?.value || 0
      );

      const key = `${sub_category_id}-${product}`;
      if (!groupedItems[key]) {
        // --- MASUKKAN DATA ITEM (TERMASUK HPP) ---
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
          // --- AMBIL DATA SUB-ITEM (TERMASUK HPP) ---
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
          // --- TAMBAHAN DATA HPP SUB-ITEM ---
          const subItemHpp = parseRupiah(
            sub.querySelector(".subItemHpp")?.value || 0
          );
          const subItemMarkupNominal = parseRupiah(
            sub.querySelector(".subItemMarkupNominal")?.value || 0
          );

          // --- INI BARIS YANG DIPERBAIKI ---
          // Sebelumnya ".subItemMarkupPercent" (salah, pakai 't')
          const subItemMarkupPercent = parseFloat(
            sub.querySelector(".subItemMarkupPersen")?.value || 0
          ); // <-- BENAR (pakai 's')

          // --- MASUKKAN DATA SUB-ITEM (TERMASUK HPP) ---
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

    // --- FormData ---
    const owner_id = user.owner_id;
    const user_id = user.user_id;
    const nominalKontrak = parseRupiah(
      document.getElementById("contract_amount").value
    );
    const disc = parseRupiah(document.getElementById("discount")?.value || 0);
    const ppn = parseRupiah(document.getElementById("ppn").value);
    const total = parseRupiah(document.getElementById("total").value);

    console.log("Total baris item ditemukan:", rows.length);
    console.log("Total item valid:", Object.keys(groupedItems).length);
    console.log("Contoh groupedItems (sudah ada HPP):", groupedItems);

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
