pagemoduleparent = "sales";

setTodayDate();
loadCustomerList();
// Harus di atas, sebelum loadSalesType dipanggil
typeLoaded = false;
statusLoaded = false;
oldStatusText = "R0"; // misalnya status sebelum diedit
lastRevision = 0;
revision_count = 0;

loadProdukList();
formatNumberInputs();
document.getElementById("tanggal").addEventListener("change", tryGenerateNoQtn);
document.getElementById("type_id").addEventListener("change", tryGenerateNoQtn);

// Auto-set status to "On Going" for new quotations
if (!window.detail_id) {
  document.getElementById("status").value = 1; // Assuming 1 is "On Going"
}

if (window.detail_id && window.detail_desc) {
  loadDetailSales(window.detail_id, window.detail_desc);
  loadPaymentDetail(window.detail_id, 0);
  formatNumberInputs();
}

async function loadCustomerList() {
  const response = await fetch(`${baseUrl}/all/client/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`, // sesuaikan dengan token kamu
    },
  });
  const result = await response.json();
  customerList = result.data || [];
}

async function loadProdukList() {
  const res = await fetch(`${baseUrl}/list/product/${owner_id}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const json = await res.json();
  produkList = json.listData || [];
}

function filterclientSuggestions() {
  const inputVal = document.getElementById("client").value.toLowerCase();
  const suggestionBox = document.getElementById("clientSuggestions");

  suggestionBox.innerHTML = "";

  if (inputVal.length < 2) {
    return suggestionBox.classList.add("hidden");
  }

  const filtered = customerList.filter(
    (c) => c.nama && c.nama.toLowerCase().includes(inputVal)
  );

  if (filtered.length === 0) {
    return suggestionBox.classList.add("hidden");
  }

  filtered.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.nama} (${item.whatsapp || "No WA"})`;
    li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";

    // Saat item diklik, isi input dan sembunyikan list
    li.addEventListener("click", () => {
      document.getElementById("client").value = item.nama;

      suggestionBox.classList.add("hidden");
    });

    suggestionBox.appendChild(li);
  });

  suggestionBox.classList.remove("hidden");
}

// Sembunyikan suggestion jika klik di luar input dan list
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

async function tambahItem() {
  const tbody = document.getElementById("tabelItem");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="border px-3 py-2">
        <input type="text" class="w-full border rounded px-2 itemProduct" placeholder="product">
    </td>
    <td class="border px-3 py-2">
        <select class="w-full border rounded px-2 itemSubcategory">
            <option value="">Loading...</option>
        </select>
    </td>
    <td class="border px-3 py-2">
        <input type="text" class="w-full border rounded px-2 itemDesc" placeholder="Deskripsi">
    </td>
    <td class="border px-3 py-2 w-[10%]">
        <input type="text" class="w-full border rounded px-2 itemUnit" placeholder="pcs/lusin">
    </td>
    <td class="border px-3 py-2 w-[12%]">
        <input type="number" class="w-full border rounded px-2 itemQty text-right" value="1" oninput="recalculateTotal()">
    </td>
    <td class="border px-3 py-2 w-[17%]">
        <input type="text" class="w-full border rounded px-2 itemHarga text-right" value="0" oninput="recalculateTotal()">
    </td>
    <td class="border px-3 py-2 text-right w-[12%] itemTotal">0</td>
    <td class="border px-3 py-2 text-center w-[10%]">
        <button onclick="hapusItem(this)" class="text-red-500 hover:underline">Hapus</button>
    </td>
  `;

  tbody.appendChild(tr);

  setupRupiahFormattingForElement(tr.querySelector(".itemHarga"));

  const subcategorySelect = tr.querySelector(".itemSubcategory");
  await loadSubcategories(subcategorySelect);
}

async function loadSubcategories(selectElement) {
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
      selectElement.appendChild(option);
    });
  } catch (err) {
    console.error("Gagal load subcategory:", err);
    selectElement.innerHTML = `<option value="">Gagal load</option>`;
  }
}

function formatNumber(angka) {
  if (isNaN(angka) || angka === "") return "0";
  return parseInt(angka).toLocaleString("id-ID");
}

function setupRupiahFormattingForElement(element) {
  element.addEventListener("input", function (e) {
    const value = e.target.value.replace(/[^\d]/g, "");
    e.target.value = formatNumber(value);

    // Calculate subtotal for this row
    const row = e.target.closest("tr");
    const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
    const harga = parseRupiah(e.target.value);
    const subtotal = qty * harga;
    row.querySelector(".itemTotal").textContent = formatNumber(subtotal);

    // Recalculate totals
    calculateInvoiceTotals();
  });
}

function hapusItem(button) {
  const row = button.closest("tr");
  row.remove();

  // Update ulang nomor urut
  const rows = document.querySelectorAll("#tabelItem tr");
  rows.forEach((row, index) => {
    row.children[0].innerText = index + 1;
  });

  // Hitung ulang total
  calculateInvoiceTotals();
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
      calculateInvoiceTotals();
    };
    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

function recalculateTotal() {
  const rows = document.querySelectorAll("#tabelItem tr");
  rows.forEach((row) => {
    const qty = parseInt(row.querySelector(".itemQty").value) || 0;
    const hargaText = row.querySelector(".itemHarga").value;
    const harga = parseRupiah(hargaText); // Pastikan fungsi parseRupiah benar

    const total = qty * harga;
    row.querySelector(".itemTotal").textContent = formatNumber(total);
  });

  calculateInvoiceTotals(); // Hitung ulang total invoice
}

function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("tanggal").value = `${yyyy}-${mm}-${dd}`;
}

function formatNumberInputs() {
  document.querySelectorAll(".itemHarga, #discount").forEach((input) => {
    input.addEventListener("input", () => {
      const raw = input.value.replace(/[^\d]/g, "");
      if (!raw) {
        input.value = "";
        return;
      }
      input.value = parseInt(raw, 10).toLocaleString("id-ID");
      calculateInvoiceTotals();
    });
  });
}

async function submitInvoice() {
  try {
    calculateInvoiceTotals();

    const rows = document.querySelectorAll("#tabelItem tr");
    const items = Array.from(rows).map((row, i) => {
      const product = row.querySelector(".itemProduct")?.value.trim() || "";
      const sub_category_id = parseInt(
        row.querySelector(".itemSubcategory")?.value || 0
      );
      const description = row.querySelector(".itemDesc")?.value.trim() || "-";
      const unit = row.querySelector(".itemUnit")?.value.trim() || "pcs";
      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const unit_price = parseRupiah(
        row.querySelector(".itemHarga")?.value || 0
      );

      if (
        !product ||
        qty <= 0 ||
        !unit ||
        isNaN(unit_price) ||
        unit_price <= 0
      ) {
        throw new Error(
          `❌ Invalid item data in row ${
            i + 1
          }: product, qty, unit, and price are required`
        );
      }
      if (!sub_category_id) {
        throw new Error(`❌ Subcategory belum dipilih di row ${i + 1}`);
      }

      return {
        product,
        sub_category: sub_category_id,
        description,
        qty,
        unit,
        unit_price,
        total: qty * unit_price,
      };
    });

    const owner_id = 100;
    const user_id = 100;
    const nominalKontrak = parseRupiah(
      document.getElementById("contract_amount_display").textContent
    );
    const disc = parseRupiah(document.getElementById("discount")?.value || 0);
    const ppn = parseRupiah(document.getElementById("ppn_display").textContent);
    const total = parseRupiah(
      document.getElementById("total_display").textContent
    );

    const formData = new FormData();
    formData.append("owner_id", owner_id);
    formData.append("user_id", user_id);
    formData.append(
      "project_name",
      document.getElementById("project_name")?.value || "-"
    );
    formData.append("no_qtn", document.getElementById("no_qtn")?.value || "-");
    formData.append("client", document.getElementById("client")?.value || "-");
    formData.append(
      "type_id",
      parseInt(document.getElementById("type_id")?.value || 0)
    );
    formData.append(
      "tanggal_ymd",
      document.getElementById("tanggal")?.value || ""
    );
    formData.append("contract_amount", nominalKontrak);
    formData.append("disc", disc);
    formData.append("ppn", ppn);
    formData.append("total", total);
    formData.append("status_id", 1);
    formData.append("revision_number", 0);

    let revisionText = "R0";
    if (window.detail_id) {
      if (typeof window.lastRevision === "number") {
        revisionText = `R${window.lastRevision + 1}`;
      }
    }
    document.getElementById("revision_number").value = revisionText;
    formData.append("revision_status", revisionText);

    formData.append("items", JSON.stringify(items));

    if (document.getElementById("file")?.files?.[0]) {
      formData.append("file", document.getElementById("file")?.files?.[0]);
    }
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

    const res = await fetch(`${baseUrl}/add/sales`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });

    const json = await res.json();

    if (res.ok) {
      Swal.fire(
        "Sukses",
        "✅ Quotation berhasil dibuat dengan status On Going",
        "success"
      );
      loadModuleContent("sales");
    } else {
      Swal.fire("Gagal", json.message || "❌ Gagal menyimpan data", "error");
    }
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Error", err.message || "❌ Terjadi kesalahan", "error");
  }
}
// Initialize automatic features when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Setup Rupiah formatting
  setupRupiahFormatting();

  // Recalculate when quantity changes
  document.querySelectorAll(".itemQty").forEach((input) => {
    input.addEventListener("input", function (e) {
      const row = e.target.closest("tr");
      const qty = parseInt(e.target.value || 0);
      const harga = parseRupiah(row.querySelector(".itemHarga")?.value || 0);
      row.querySelector(".itemTotal").textContent = formatNumber(qty * harga);
      calculateInvoiceTotals();
    });
  });

  // Recalculate when discount changes
  document.getElementById("discount")?.addEventListener("input", function (e) {
    e.target.value = formatRupiah(e.target.value.replace(/[^\d]/g, ""));
    calculateInvoiceTotals();
  });

  // Initial calculation
  calculateInvoiceTotals();
});

async function updateInvoice() {
  try {
    calculateInvoiceTotals();

    // Konfirmasi sebelum simpan
    const konfirmasi = await Swal.fire({
      title: "Update Data?",
      text: "Apakah kamu yakin ingin menyimpan perubahan?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Ya, simpan",
      cancelButtonText: "❌ Batal",
    });

    if (!konfirmasi.isConfirmed) return;

    // Ambil data item dari tabel
    const rows = document.querySelectorAll("#tabelItem tr");
    const items = Array.from(rows).map((row, i) => {
      const product = row.querySelector(".itemProduct")?.value.trim() || "";
      const description = row.querySelector(".itemDesc")?.value.trim() || "";
      const unit = row.querySelector(".itemUnit")?.value.trim() || "pcs";
      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const unit_price = parseRupiah(
        row.querySelector(".itemHarga")?.value || 0
      );
      const sub_category_id = parseInt(
        row.querySelector(".itemSubcategory")?.value || 0
      );

      if (!product || !unit || qty <= 0 || isNaN(unit_price)) {
        throw new Error(`Invalid item data in row ${i + 1}`);
      }

      return {
        product,
        description,
        unit,
        qty,
        unit_price,
        sub_category: sub_category_id,
      };
    });

    // Hitung nominal kontrak, diskon, DPP, PPN, dan total
    const nominalKontrak = items.reduce(
      (acc, item) => acc + item.qty * item.unit_price,
      0
    );
    const disc = parseRupiah(document.getElementById("discount")?.value || 0);
    const dpp = nominalKontrak - disc;
    const ppn = Math.round(dpp * 0.11);
    const total = dpp + ppn;

    // Ambil data status
    const status_id = parseInt(document.getElementById("status")?.value || 1);
    const revisionNumber = window.revision_count || 1;
    const revision_status = `Revisi ${revisionNumber}`;

    // Body untuk update sales
    const bodySales = {
      owner_id: 100,
      user_id: 100,
      no_qtn: document.getElementById("no_qtn")?.value || "",
      project_name: document.getElementById("project_name")?.value || "",
      client: document.getElementById("client")?.value || "",
      type_id: document.getElementById("type_id")?.value || 0,
      order_date: document.getElementById("tanggal")?.value || "",
      contract_amount: nominalKontrak,
      discount: disc,
      ppn: ppn,
      total: total,
      status_id: status_id,
      items: items,
      catatan: document.getElementById("catatan")?.value || "-",
      syarat_ketentuan:
        document.getElementById("syarat_ketentuan")?.value || "-",
      term_pembayaran: document.getElementById("term_pembayaran")?.value || "-",
    };

    // === 1. Update Sales ===
    const resSales = await fetch(
      `${baseUrl}/update/sales/${window.detail_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(bodySales),
      }
    );

    const jsonSales = await resSales.json();
    if (!resSales.ok) {
      Swal.fire(
        "Gagal",
        jsonSales.message || "❌ Gagal update data utama",
        "error"
      );
      return;
    }

    // Set nilai revisi di form
    document.getElementById("revision_number").value = revision_status;

    // === 2. Update Status ===
    const resStatus = await fetch(
      `${baseUrl}/update/status_sales/${window.detail_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          status_id,
          revision_status,
        }),
      }
    );

    const jsonStatus = await resStatus.json();
    if (!resStatus.ok) {
      Swal.fire(
        "Sebagian Gagal",
        jsonStatus.message ||
          "❌ Data utama tersimpan, tapi gagal update status",
        "warning"
      );
      return;
    }

    Swal.fire("Sukses", "✅ Data dan status berhasil diperbarui", "success");
    loadModuleContent("sales");
  } catch (error) {
    console.error("Update error:", error);
    Swal.fire("Error", error.message || "❌ Terjadi kesalahan", "error");
  }
}

document.getElementById("view_catatan").textContent = data.catatan || "-";
document.getElementById("view_syarat_ketentuan").textContent =
  data.syarat_ketentuan || "-";
document.getElementById("view_term_pembayaran").textContent =
  data.term_pembayaran || "-";

function initializeForm(isEdit = false) {
  if (isEdit) {
    document.getElementById("statusContainer").classList.remove("hidden");
    updateRevisionNumber();
  } else {
    document.getElementById("statusContainer").classList.add("hidden");
    document.getElementById("revision_number").value = "R0";
  }
}

async function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  try {
    const res = await fetch(`${baseUrl}/detail/sales/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const response = await res.json();
    console.log("Response API:", response);

    if (!response || !response.detail) {
      throw new Error("Invalid API response structure - missing detail");
    }

    const data = response.detail;
    window.revision_count = data.revision_number || 0;
    window.lastRevision = window.revision_count;

    await loadSalesType();
    await loadStatusOptions();

    // 📝 Isi form utama
    document.getElementById("formTitle").innerText = `Edit ${Detail}`;
    document.getElementById("tanggal").value = data.tanggal_ymd || "";
    document.getElementById("type_id").value = data.type_id || "";
    document.getElementById("no_qtn").value = data.no_qtn || "";
    document.getElementById("project_name").value = data.project_name || "";
    document.getElementById("client").value = data.pelanggan_nama || "";
    document.getElementById("contract_amount").value =
      data.contract_amount || 0;
    const discountEl = document.getElementById("discount");
    if (discountEl) discountEl.value = data.disc || 0;
    document.getElementById("ppn").value = data.ppn || 0;
    document.getElementById("total").value = data.total || 0;
    document.getElementById("status").value = data.status_id || 1;
    document.getElementById("revision_number").value =
      data.revision_status || `R${window.revision_count}`;
    document.getElementById("catatan").value = data.catatan || "";
    document.getElementById("syarat_ketentuan").value =
      data.syarat_ketentuan || "";
    document.getElementById("term_pembayaran").value =
      data.term_pembayaran || "";

    const simpanBtn = document.querySelector(
      'button[onclick="submitInvoice()"]'
    );
    const updateBtn = document.querySelector(
      'button[onclick="updateInvoice()"]'
    );
    const logBtn = document.getElementById("logBtn");

    if (logBtn) {
      logBtn.setAttribute(
        "onclick",
        `event.stopPropagation(); loadModuleContent('sales_log', '${Id}')`
      );
      logBtn.classList.remove("hidden");
    }
    if (data.status_id === 2) {
      updateBtn?.classList.add("hidden");
    } else {
      updateBtn?.classList.remove("hidden");
    }
    simpanBtn?.classList.add("hidden");

    // 🔹 Ambil list sub category dari API
    // 🔹 Ambil list sub category dari API
    const subcategoryRes = await fetch(`${baseUrl}/list/sub_category/100`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!subcategoryRes.ok) {
      throw new Error(
        `Failed to load subcategories, status: ${subcategoryRes.status}`
      );
    }
    const subcatResponse = await subcategoryRes.json();
    console.log("Subcategory response:", subcatResponse);

    // Perbaikan: Akses data subcategory dari response yang benar
    const subcats = Array.isArray(subcatResponse.listData)
      ? subcatResponse.listData
      : [];

    console.log("Subcategory array parsed:", subcats);

    // 🔹 Render item rows
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    for (const item of data.items || []) {
      tambahItem();
      const row = tbody.lastElementChild;

      row.querySelector(".itemProduct").value = item.product || "";
      row.querySelector(".itemDesc").value = item.description || "";
      row.querySelector(".itemUnit").value = item.unit || "";
      row.querySelector(".itemQty").value = item.qty || 1;
      row.querySelector(".itemHarga").value = formatNumber(
        item.unit_price || 0
      );
      row.querySelector(".itemTotal").innerText = formatNumber(
        item.total || item.qty * item.unit_price
      );

      // 🔹 Isi dropdown subcategory
      // 🔹 Isi dropdown subcategory
      const selectEl = row.querySelector(".itemSubcategory");
      if (selectEl) {
        selectEl.innerHTML =
          `<option value="">-- Pilih Subcategory --</option>` +
          subcats
            .map((sc) => {
              const scId = String(sc.sub_category_id || sc.id || "").trim();
              const scName = (sc.nama || "").trim().toLowerCase();
              const itemSubcatName = (item.sub_category || "")
                .trim()
                .toLowerCase();

              const isSelected = scName === itemSubcatName;

              console.log(
                `[DEBUG Subcat Match] Master: { id: ${scId}, nama: "${scName}" } | Item: { nama: "${itemSubcatName}" } => Match: ${isSelected}`
              );

              return `<option value="${scId}" ${isSelected ? "selected" : ""}>${
                sc.nama
              }</option>`;
            })
            .join("");

        // Tambahkan ini untuk memastikan seleksi diterapkan
        const selectedOption = selectEl.querySelector("option[selected]");
        if (selectedOption) {
          selectEl.value = selectedOption.value;
        }
      }
    }

    console.log("Items rendered:", data.items || []);
    calculateInvoiceTotals();
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail penjualan", "error");
  }
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
}

function formatDateForInput(dateStr) {
  const [d, m, y] = dateStr.split("/");
  return `${y}-${m}-${d}`;
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

    const { isConfirmed, dismiss } = await Swal.fire({
      title: "Cetak Faktur Penjualan",
      text: "Pilih metode pencetakan:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Download PDF",
      cancelButtonText: "Print Langsung",
      reverseButtons: true,
    });

    if (isConfirmed) {
      const url = `faktur_print.html?id=${pesanan_id}`;
      Swal.fire({
        title: "Menyiapkan PDF...",
        html: "File akan diunduh otomatis.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();

          const iframe = document.createElement("iframe");
          iframe.src = url + "&mode=download";
          iframe.style.width = "0";
          iframe.style.height = "0";
          iframe.style.border = "none";
          document.body.appendChild(iframe);

          setTimeout(() => {
            Swal.close();
            Swal.fire(
              "Berhasil",
              "Faktur Penjualan berhasil diunduh.",
              "success"
            );
          }, 3000);
        },
      });
    } else if (dismiss === Swal.DismissReason.cancel) {
      window.open(`faktur_print.html?id=${pesanan_id}`, "_blank");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
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
        owner_id: 100,
        user_id: 100,
      }),
    });

    const result = await response.json();
    console.log("Hasil generate:", result);

    document.getElementById("no_qtn").value =
      result.data.no_qtn || "[no_qtn kosong]";
  } catch (error) {
    console.error("Gagal generate no_qtn:", error);
  }
}

async function loadSalesType() {
  if (typeLoaded) return;
  typeLoaded = true;

  try {
    const response = await fetch(`${baseUrl}/type/sales`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data sales type");

    const result = await response.json();
    const salesTypes = result.data;

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
async function loadStatusOptions(defaultSelectedId = 1) {
  if (statusLoaded) return;

  try {
    const response = await fetch(`${baseUrl}/status/sales`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const data = await response.json();

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
        if (item.status_id == defaultSelectedId) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      // Revisi number untuk mode tambah saja
      if (defaultSelectedId == 1 && !window.detail_id) {
        document.getElementById("revision_number").value = R0;
      }

      statusLoaded = true;
    } else {
      console.error("Gagal memuat status:", data.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function updateRevisionNumber() {
  const statusSelect = document.getElementById("status");
  const selectedIndex = statusSelect.selectedIndex;
  const selectedValue = statusSelect.value;

  if (!selectedValue || selectedIndex === 0) {
    document.getElementById("revision_number").value = "";
    return;
  }

  const currentRevision = lastRevision || 0;
  const newRevision = currentRevision + 1;
  const revisionStatus = `R${newRevision}`;

  console.log("Revision status:", revisionStatus);
  document.getElementById("revision_number").value = revisionStatus;
}

document.addEventListener("input", function (e) {
  if (e.target.classList.contains("formatRupiah")) {
    const angka = e.target.value.replace(/[^\d]/g, "");
    e.target.value = formatRupiah(angka);
  }
});

function formatRupiah(angka) {
  if (isNaN(angka) || angka === "") return "Rp 0";
  return "Rp " + parseInt(angka).toLocaleString("id-ID");
}

function parseRupiah(rupiah) {
  if (!rupiah) return 0;
  // Hapus semua karakter non-digit termasuk titik
  return parseInt(rupiah.replace(/[^\d]/g, "")) || 0;
}

function updateDisplayedValues(subtotal, diskon, ppn, total) {
  // Update summary section - tanpa Rp
  document.getElementById("contract_amount_display").textContent =
    formatNumber(subtotal);
  document.getElementById("diskon").textContent = formatNumber(diskon);
  document.getElementById("ppn_display").textContent = formatNumber(ppn);
  document.getElementById("total_display").textContent = formatNumber(total);

  // Update input fields (if they exist)
  if (document.getElementById("contract_amount")) {
    document.getElementById("contract_amount").value = subtotal;
  }
  if (document.getElementById("ppn")) {
    document.getElementById("ppn").value = ppn;
  }
  if (document.getElementById("total")) {
    document.getElementById("total").value = total;
  }
}

function calculateInvoiceTotals() {
  const rows = document.querySelectorAll("#tabelItem tr");
  let subtotal = 0; // Ini adalah Nominal Kontrak (total semua item sebelum diskon & pajak)

  // 1. Hitung subtotal/nominal kontrak dari semua item (Harga x Qty)
  rows.forEach((row) => {
    const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
    const harga = parseRupiah(row.querySelector(".itemHarga")?.value || 0);
    subtotal += qty * harga;
  });

  // 2. Hitung diskon
  const diskon = parseRupiah(document.getElementById("discount")?.value || 0);

  // 3. Hitung DPP (setelah diskon)
  const dpp = subtotal - diskon;

  // 4. Hitung PPN 11% dari DPP
  const ppn = Math.round(dpp * 0.11);

  // 5. Hitung Total Akhir: (Subtotal - Diskon) + PPN
  const total = dpp + ppn;

  // Update tampilan
  updateDisplayedValues(subtotal, diskon, ppn, total);
}

function updateDisplayedValues(subtotal, diskon, ppn, total) {
  // Update summary section
  document.getElementById("contract_amount_display").textContent =
    formatRupiah(subtotal);
  document.getElementById("diskon").textContent = formatRupiah(diskon);
  document.getElementById("ppn_display").textContent = formatRupiah(ppn);
  document.getElementById("total_display").textContent = formatRupiah(total);

  // Update input fields (if they exist)
  if (document.getElementById("contract_amount")) {
    document.getElementById("contract_amount").value = subtotal;
  }
  if (document.getElementById("ppn")) {
    document.getElementById("ppn").value = ppn;
  }
  if (document.getElementById("total")) {
    document.getElementById("total").value = total;
  }
}

// Setup Rupiah formatting for inputs
function setupRupiahFormatting() {
  document.querySelectorAll(".itemHarga").forEach((input) => {
    input.addEventListener("input", function (e) {
      const value = e.target.value.replace(/[^\d]/g, "");
      e.target.value = formatRupiah(value);

      // Calculate subtotal for this row
      const row = e.target.closest("tr");
      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const harga = parseRupiah(e.target.value);
      const subtotal = qty * harga;
      row.querySelector(".itemTotal").textContent = formatNumber(subtotal);

      // Recalculate totals
      calculateInvoiceTotals();
    });
  });
}

document.addEventListener("input", function (e) {
  const id = e.target.id;
  const isRelevant = ["discount"].includes(id);

  if (e.target.classList.contains("formatRupiah")) {
    const angka = e.target.value.replace(/[^\d]/g, "");
    e.target.value = formatRupiah(angka);
  }

  if (isRelevant) {
    calculateInvoiceTotals();
  }
});

// Panggil fungsi saat halaman siap
document.addEventListener("DOMContentLoaded", () => {
  loadTermOfPayment(owner_id);
  // Set default status to "On Going" for new forms
  if (!window.detail_id) {
    document.getElementById("status").value = 1;
  }
});
function initModule() {
  const deleteButton = document.getElementById("confirmDeleteButton");
  if (deleteButton) {
    deleteButton.addEventListener("click", handleDelete);
  }
}
async function handleHapus(pesanan_id) {
  const confirm = await Swal.fire({
    title: "Yakin ingin menghapus?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
  });

  if (!confirm.isConfirmed) return;

  try {
    const response = await fetch(`${baseUrl}/delete/sales/${pesanan_id}`, {
      method: "PUT",
      headers: {
        Authorization: API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Gagal hapus: ${response.status}`);

    Swal.fire("Berhasil", "Data berhasil dihapus", "success");
  } catch (err) {
    Swal.fire("Gagal", "Terjadi kesalahan", "error");
  }
}
