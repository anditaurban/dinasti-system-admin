pagemoduleparent = "sales";

setTodayDate();
loadCustomerList();
// Harus di atas, sebelum loadSalesType dipanggil
typeLoaded = false;
statusLoaded = false;
oldStatusText = "On Going"; // misalnya status sebelum diedit
lastRevision = 0;

loadProdukList();
formatNumberInputs();
document.getElementById("tanggal").addEventListener("change", tryGenerateNoQtn);
document.getElementById("type_id").addEventListener("change", tryGenerateNoQtn);

// Auto-set status to "On Going" for new quotations
if (!window.detail_id) {
  document.getElementById("status").value = 1; // Assuming 1 is "On Going"
}

if (window.detail_id && window.detail_desc) {
  loadDetailSales(detail_id, detail_desc);
  loadPaymentDetail(detail_id, 0);
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

function tambahItem() {
  const tbody = document.getElementById("tabelItem");
  const nomor = tbody.children.length + 1;

  const tr = document.createElement("tr");
  tr.innerHTML = `
        <td class="border px-3 py-2">
            <input type="text" class="w-full border rounded px-2 itemProduct" placeholder="product">
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
        <td class="border px-3 py-2 text-right w-[12%] itemTotal">0
        </td>
        <td class="border px-3 py-2 text-center w-[10%]">
            <button onclick="hapusItem(this)" class="text-red-500 hover:underline">Hapus</button>
        </td>

    `;

  tbody.appendChild(tr);

  // Setup Rupiah formatting for the new item
  setupRupiahFormattingForElement(tr.querySelector(".itemHarga"));
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
    // Auto-calculate totals before submission
    calculateInvoiceTotals();

    const rows = document.querySelectorAll("#tabelItem tr");
    const items = Array.from(rows).map((row, i) => {
      const product = row.querySelector(".itemProduct")?.value.trim() || "";
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

      return {
        product,
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
    formData.append("status_id", 1); // status_id: 1 = On Going
    formData.append("revision_number", 0);
    // Pastikan "On Going" cuma default untuk status_id === 1
    let revisionText = "On Going";
    if (window.revision_count && window.revision_count > 1) {
      revisionText = `On Going R${window.revision_count}`;
    }
    document.getElementById("revision_number").value = revisionText;
    formData.append("status_revision", revisionText);

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

    const konfirmasi = await Swal.fire({
      title: "Update Data?",
      text: "Apakah kamu yakin ingin menyimpan perubahan?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Ya, simpan",
      cancelButtonText: "❌ Batal",
    });

    if (!konfirmasi.isConfirmed) return;

    const rows = document.querySelectorAll("#tabelItem tr");
    const items = Array.from(rows).map((row, i) => {
      const product = row.querySelector(".itemProduct")?.value.trim() || "";
      const description = row.querySelector(".itemDesc")?.value.trim() || "";
      const unit = row.querySelector(".itemUnit")?.value.trim() || "pcs";
      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const unit_price = parseRupiah(
        row.querySelector(".itemHarga")?.value || 0
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
      };
    });

    const nominalKontrak = items.reduce(
      (acc, item) => acc + item.qty * item.unit_price,
      0
    );
    const disc = parseRupiah(document.getElementById("discount")?.value || 0);
    const dpp = nominalKontrak - disc;
    const ppn = Math.round(dpp * 0.11);
    const total = dpp + ppn;

    const status_id = parseInt(document.getElementById("status")?.value || 1);
    const revisionNumber = window.revision_count || 1;

    const body = {
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

    // Langkah 1: Update data utama sales
    const res = await fetch(`${baseUrl}/update/sales/${window.detail_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      Swal.fire("Gagal", json.message || "❌ Gagal update data", "error");
      return;
    }

    // Langkah 2: Update status + revision_status via endpoint khusus
    let revision_status = `Revisi ke ${revisionNumber}`;
    if (status_id === 1) revision_status = `On Going R${revisionNumber}`;
    else if (status_id === 2) revision_status = `Won R${revisionNumber}`;
    else if (status_id === 3) revision_status = `Lose R${revisionNumber}`;

    document.getElementById("revision_number").value = revision_status;

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

    const statusJson = await resStatus.json();

    if (!resStatus.ok) {
      Swal.fire(
        "Sebagian Gagal",
        statusJson.message ||
          "❌ Data utama tersimpan, tapi gagal update status",
        "warning"
      );
      return;
    }

    // Sukses total
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
    document.getElementById("revision_number").value = "On Going";
  }
}

function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  fetch(`${baseUrl}/detail/sales/${Id}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  })
    .then((res) => res.json())
    .then(async ({ data }) => {
      // ⛳ Tambahkan ini untuk menyimpan revision number ke window
      window.revision_count = data.revision_number || 1;

      await loadSalesType();
      await loadStatusOptions();
      await updateRevisionNumber();

      document.getElementById("formTitle").innerText = `Edit ${Detail}`;
      document.getElementById("tanggal").value = data.tanggal_ymd;
      document.getElementById("type_id").value = data.type_id;
      document.getElementById("no_qtn").value = data.no_qtn;
      document.getElementById("project_name").value = data.project_name;
      document.getElementById("client").value = data.pelanggan_nama;
      document.getElementById("contract_amount").value = data.contract_amount;
      document.getElementById("discount").value = data.disc;
      document.getElementById("shipping").value = data.shipping;
      document.getElementById("ppn").value = data.ppn;

      const subtotal =
        (data.contract_amount || 0) -
        (data.disc || 0) +
        (data.shipping || 0) +
        (data.ppn || 0);
      document.getElementById("total").value = subtotal;

      document.getElementById("status").value = data.status_id || 1;
      document.getElementById("revision_number").value =
        data.revision_status || "-";
      document.getElementById("catatan").value = data.catatan || "";
      document.getElementById("syarat_ketentuan").value =
        data.syarat_ketentuan || "";
      document.getElementById("term_pembayaran").value =
        data.term_pembayaran || "";

      // Tombol aksi
      const simpanBtn = document.querySelector(
        'button[onclick="submitInvoice()"]'
      );
      const updateBtn = document.querySelector(
        'button[onclick="updateInvoice()"]'
      );

      // Sembunyikan tombol update jika status_id === 2 (Won)
      if (data.status_id === 2) {
        updateBtn?.classList.add("hidden");
      } else {
        updateBtn?.classList.remove("hidden");
      }

      // Sembunyikan tombol submit pada mode edit
      simpanBtn?.classList.add("hidden");

      // Load item
      const tbody = document.getElementById("tabelItem");
      tbody.innerHTML = "";

      data.items.forEach((item, index) => {
        tambahItem();
        const row = tbody.lastElementChild;

        row.querySelector(".itemProduct").value = item.product || "";
        row.querySelector(".itemDesc").value = item.description || "";
        row.querySelector(".itemUnit").value = item.unit || "";
        row.querySelector(".itemQty").value = item.qty || 1;
        row.querySelector(".itemHarga").value = (
          item.unit_price || 0
        ).toLocaleString("id-ID");
        row.querySelector(".itemTotal").innerText = (
          item.total || item.qty * item.unit_price
        ).toLocaleString("id-ID");
      });

      calculateInvoiceTotals();
    })
    .catch((err) => console.error("Gagal load detail:", err));
}

function formatDateForInput(dateStr) {
  const [d, m, y] = dateStr.split("/");
  return `${y}-${m}-${d}`;
}

async function printInvoice(pesanan_id) {
  try {
    const response = await fetch(`${baseUrl}/detail/sales/${pesanan_id}/pdf`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();
    const data = result?.data;
    if (!data) throw new Error("Data faktur tidak ditemukan");

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
        document.getElementById("revision_number").value = 0;
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

  const statusText = statusSelect.options[selectedIndex].text;
  console.log("Status dipilih:", statusText);

  let revisionStatus = "";
  let currentRevision = lastRevision || 0;

  // Jika status tidak berubah dan revisi masih 0, maka tetap (misal: "On Going")
  if (currentRevision === 0 && statusText === oldStatusText) {
    revisionStatus = statusText;
  } else {
    // Kalau status berubah atau sudah pernah revisi sebelumnya
    const newRevision = statusText === oldStatusText ? currentRevision + 1 : 1;
    revisionStatus = `${statusText} R${newRevision}`;
  }

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

async function loadTermOfPayment(ownerId) {
  try {
    const response = await fetch(
      `${baseUrl}/table/finance_instruction_payment/${ownerId}/1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );

    const result = await response.json();
    const data = result?.tableData;

    if (data && data.length > 0) {
      // Temukan item dengan instruction sesuai
      const selected = data.find(
        (item) => item.instruction === "Pembayaran 30% DP, 70% setelah selesai."
      );

      // Jika ditemukan, tampilkan di textarea
      if (selected) {
        document.getElementById("termPayment").value = selected.instruction;
      } else {
        document.getElementById("termPayment").value = "";
      }
    }
  } catch (error) {
    console.error("Gagal memuat Term of Payment:", error);
  }
}

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
