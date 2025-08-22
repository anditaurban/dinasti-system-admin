pagemoduleparent = "project";

if (window.detail_id && window.detail_desc) {
  loadDetailProject(window.detail_id, window.detail_desc);
  loadPaymentDetail(window.detail_id, 0);
  formatNumberInputs();
}

// Item management
async function tambahItem() {
  const tbody = document.getElementById("tabelItem");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemProduct" placeholder="Produk">
    </td>
    <td class="border px-3 py-2">
        <select class="w-full border rounded px-2 itemSubcategory"></select>
    </td>
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemDesc" placeholder="Deskripsi">
    </td>
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemUnit" placeholder="pcs/lusin">
    </td>
    <td class="border px-3 py-2">
      <input type="number" class="w-full border rounded px-2 itemQty text-right">
    </td>
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemHarga text-right" value="0">
    </td>
    <td class="border px-3 py-2 text-right itemTotal">0</td>
    <td class="border px-3 py-2 text-center">
      <button onclick="hapusItem(this)" class="text-red-500 hover:underline">Hapus</button>
    </td>
  `;

  tbody.appendChild(tr);

  // Setup event listeners untuk kalkulasi otomatis
  const qtyInput = tr.querySelector(".itemQty");
  const hargaInput = tr.querySelector(".itemHarga");

  qtyInput.addEventListener("input", calculateRowTotal);
  hargaInput.addEventListener("input", function (e) {
    this.value = formatRupiah(this.value);
    calculateRowTotal.call(this);
  });

  // Set initial calculation
  calculateRowTotal.call(qtyInput);

  // Load subcategories
  await loadSubcategories(tr.querySelector(".itemSubcategory"));
}

function hapusItem(button) {
  const row = button.closest("tr");
  row.remove();
  calculateProjectTotals();
}

function parseRupiah(value) {
  if (!value) return 0;
  return parseFloat(value.toString().replace(/\./g, "")) || 0;
}

function formatNumber(num) {
  return num.toLocaleString("id-ID").replace(/,/g, ".");
}

function calculateRowTotal() {
  const row = this.closest("tr");
  const qty = parseFloat(row.querySelector(".itemQty").value) || 0;
  const harga = parseRupiah(row.querySelector(".itemHarga").value) || 0;
  const total = qty * harga;

  row.querySelector(".itemTotal").textContent = formatNumber(total);

  // Update project totals
  calculateProjectTotals();
}

function calculateProjectTotals() {
  let totalItem = 0;

  // Hitung total dari semua item
  document.querySelectorAll("#tabelItem tr").forEach((row) => {
    const qty = parseFloat(row.querySelector(".itemQty").value) || 0;
    const harga = parseRupiah(row.querySelector(".itemHarga").value) || 0;
    totalItem += qty * harga;
  });

  // Update plan costing dengan total item
  document.getElementById("plan_costing").value = formatNumber(totalItem);
}

// Format number to Rupiah (using dots as thousand separators)
function formatRupiah(angka) {
  if (!angka) return "0";
  const numberString = angka.toString().replace(/\./g, "");
  const number = parseInt(numberString);
  return isNaN(number)
    ? "0"
    : number.toLocaleString("id-ID").replace(/,/g, ".");
}

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

      // 🔹 auto-select kalau sama dengan yang di detail Project
      if (selectedId && selectedId == item.sub_category_id) {
        option.selected = true;
      }

      selectElement.appendChild(option);
    });
  } catch (err) {
    console.error("Gagal load subcategory:", err);
    selectElement.innerHTML = `<option value="">Gagal load</option>`;
  }
}
// Load Project Managers
async function loadProjectManagers() {
  try {
    const res = await fetch(`${baseUrl}/manager/project`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const response = await res.json();

    const select = document.getElementById("project_manager");
    select.innerHTML = '<option value="">Pilih Project Manager</option>';

    response.data.forEach((pm) => {
      const option = document.createElement("option");
      option.value = pm.project_manager_id;
      option.textContent = pm.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading project managers:", err);
    document.getElementById("project_manager").innerHTML =
      '<option value="">Error loading data</option>';
  }
}

// Load Projects
async function loadProjects() {
  try {
    const res = await fetch(`${baseUrl}/won/project`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const response = await res.json();

    const select = document.getElementById("deskripsi");
    select.innerHTML = '<option value="">Pilih Project</option>';

    response.data.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.pesanan_id;
      option.textContent = project.project_name;
      option.dataset.total = project.total_order;
      select.appendChild(option);
    });

    // Auto-fill contract value when project is selected
    select.addEventListener("change", function () {
      const selectedOption = this.options[this.selectedIndex];
      if (selectedOption.value && selectedOption.dataset.total) {
        const nilaiKontrak = selectedOption.dataset.total;
        document.getElementById("nilai_kontrak").value =
          formatRupiah(nilaiKontrak);
      } else {
        document.getElementById("nilai_kontrak").value = "";
      }
    });
  } catch (err) {
    console.error("Error loading projects:", err);
    document.getElementById("deskripsi").innerHTML =
      '<option value="">Error loading data</option>';
  }
}

// Initialize form
document.addEventListener("DOMContentLoaded", function () {
  loadProjectManagers();
  loadProjects();

  // Format Rupiah input
  document
    .getElementById("nilai_kontrak")
    .addEventListener("input", function () {
      this.value = formatRupiah(this.value);
    });
});

// Submit Project
async function submitProject() {
  try {
    // Validasi field utama
    const requiredFields = [
      { id: "project_manager", name: "Project Manager" },
      { id: "deskripsi", name: "Project" },
      { id: "start_date", name: "Start Date" },
      { id: "finish_date", name: "Finish Date" },
    ];

    for (const field of requiredFields) {
      const element = document.getElementById(field.id);
      if (!element?.value) {
        throw new Error(`Harap pilih ${field.name}`);
      }
    }

    // Validasi items
    const itemRows = document.querySelectorAll("#tabelItem tr");
    if (itemRows.length === 0) {
      throw new Error("Harap tambahkan minimal 1 item produk");
    }

    // Kumpulkan data items sesuai format endpoint
    const items = [];
    let totalItemCost = 0;

    itemRows.forEach((row, index) => {
      const product = row.querySelector(".itemProduct")?.value.trim();
      const subcategory = row.querySelector(".itemSubcategory")?.value;
      const description = row.querySelector(".itemDesc")?.value.trim();
      const unit = row.querySelector(".itemUnit")?.value.trim();
      const qty = parseFloat(row.querySelector(".itemQty")?.value) || 0;
      const price = parseRupiah(row.querySelector(".itemHarga")?.value) || 0;

      // Validasi ketat semua field item
      if (!product)
        throw new Error(`Produk pada baris ${index + 1} harus diisi`);
      if (!subcategory)
        throw new Error(`Subkategori pada baris ${index + 1} harus dipilih`);
      if (!description)
        throw new Error(`Deskripsi pada baris ${index + 1} harus diisi`);
      if (!unit) throw new Error(`Unit pada baris ${index + 1} harus diisi`);
      if (qty <= 0)
        throw new Error(`Quantity pada baris ${index + 1} harus > 0`);
      if (price <= 0)
        throw new Error(`Harga pada baris ${index + 1} harus > 0`);

      items.push({
        product,
        sub_category: subcategory, // Perhatikan nama field sesuai endpoint
        description,
        unit,
        qty, // Gunakan qty bukan quantity
        unit_price: price,
        // total tidak perlu dikirim
      });

      totalItemCost += qty * price;
    });

    // Siapkan data sesuai format endpoint
    const projectData = {
      pesanan_id: document.getElementById("deskripsi").value, // Nama field sesuai endpoint
      project_manager_id: document.getElementById("project_manager").value,
      contract_value: parseRupiah(
        document.getElementById("nilai_kontrak").value
      ),
      plan_costing: totalItemCost,
      start_date: document.getElementById("start_date").value,
      finish_date: document.getElementById("finish_date").value,
      items: items,
    };

    console.log("Data yang akan dikirim:", projectData); // Untuk debugging

    // Kirim ke API
    const res = await fetch(`${baseUrl}/add/project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!res.ok) {
      const errorResponse = await res.json();
      throw new Error(errorResponse.message || "Gagal membuat project");
    }

    // Handle success
    Swal.fire("Berhasil!", "Project berhasil dibuat", "success").then(() =>
      loadModuleContent("project")
    );
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Error!", err.message, "error");
  }
}
// Load project details for editing
// Load project details for editing
async function loadDetailProject(Id, Detail) {
  console.log("Load detail project:", Id, Detail);
  if (!Id) {
    console.warn("Add mode - tidak load detail project");
    return;
  }
  window.detail_id = Id;
  window.detail_desc = Detail;

  try {
    const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const response = await res.json();
    console.log("Response API:", response);

    if (!response || !response.detail) {
      throw new Error("Invalid API response structure - missing detail");
    }

    const data = response.detail;

    // 📝 Title form - TAMPILKAN PROJECT NUMBER/NOMOR PROYEK
    // Cek jika ada project_number, jika tidak gunakan ID sebagai fallback
    const projectNumber = data.project_number || `PRJ-${Id}`;
    document.getElementById("formTitle").innerText = `Edit (${projectNumber})`;

    // --- Load Selects dulu ---
    await loadProjectManagers(); // isi daftar project manager
    await loadProjects(); // isi daftar project

    // --- Isi form utama ---
    // Jangan set plan_costing dari API, biarkan dihitung dari items
    document.getElementById("start_date").value = data.start_date || "";
    document.getElementById("finish_date").value = data.finish_date || "";

    // --- Set Project Manager Select ---
    const pmSelect = document.getElementById("project_manager");
    if (pmSelect) {
      pmSelect.value = data.project_manager_id || "";
    }

    // --- Set Project Select ---
    const projectSelect = document.getElementById("deskripsi");
    if (projectSelect) {
      projectSelect.value = data.pesanan_id || "";
      // auto isi nilai kontrak kalau ada
      const opt = projectSelect.querySelector(
        `option[value="${data.pesanan_id}"]`
      );
      if (opt && opt.dataset.total) {
        document.getElementById("nilai_kontrak").value = formatRupiah(
          opt.dataset.total
        );
      } else {
        // fallback isi dari API
        document.getElementById("nilai_kontrak").value = formatNumber(
          data.nilai_kontrak || 0
        );
      }
    }

    const simpanBtn = document.querySelector(
      'button[onclick="submitProject()"]'
    );
    const updateBtn = document.querySelector(
      'button[onclick="updateProject()"]'
    );
    const logBtn = document.getElementById("logBtn");

    if (logBtn) {
      logBtn.setAttribute(
        "onclick",
        `event.stopPropagation(); loadModuleContent('project_log', '${Id}')`
      );
      logBtn.classList.remove("hidden");
    }

    if (data.status_id === 2) {
      updateBtn?.classList.add("hidden");
    } else {
      updateBtn?.classList.remove("hidden");
    }
    simpanBtn?.classList.add("hidden");

    // --- Render Item Rows ---
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    for (const item of data.items || []) {
      tambahItem();
      const row = tbody.lastElementChild;

      // load subcategory → isi option dulu, lalu pilih
      const subcatSelect = row.querySelector(".itemSubcategory");
      if (subcatSelect) {
        await loadSubcategories(subcatSelect, item.sub_category_id);
      }

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
    }

    // Hitung ulang total project setelah semua item dimuat
    calculateProjectTotals();

    console.log("Items rendered:", data.items || []);
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", err.message || "Gagal memuat detail project", "error");
  }
}

// Helper format angka
function formatNumber(num) {
  if (!num) return "0";
  return new Intl.NumberFormat("id-ID", {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace(/,/g, ".");
}

// Helper function to calculate project values
function calculateProjectValues() {
  const projectValue =
    parseFloat(
      document.getElementById("project_value").value.replace(/\./g, "")
    ) || 0;
  const planCostingPercent =
    parseFloat(document.getElementById("plan_costing_percent").value) || 0;
  const actualCostPercent =
    parseFloat(document.getElementById("actual_cost_percent").value) || 0;

  // Calculate plan costing amount
  const planCostingAmount = projectValue * (planCostingPercent / 100);
  document.getElementById("plan_costing_amount").value =
    formatNumber(planCostingAmount);

  // Calculate actual cost amount
  const actualCostAmount = projectValue * (actualCostPercent / 100);
  document.getElementById("actual_cost_amount").value =
    formatNumber(actualCostAmount);

  // Calculate margin (assuming margin is already in percentage)
  const marginPercent =
    parseFloat(document.getElementById("margin_percent").value) || 0;
  document.getElementById("margin_amount").value = formatNumber(
    projectValue * (marginPercent / 100)
  );
}

// Update project
async function updateProject() {
  try {
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
        sub_category: sub_category_id,
        description,
        unit,
        qty,
        unit_price,
        total: "", // sesuai struktur endpoint
      };
    });

    // Hitung contract value (total nilai kontrak)
    const contractValue = items.reduce(
      (acc, item) => acc + item.qty * item.unit_price,
      0
    );

    // Body untuk update sesuai endpoint
    const bodyInvoice = {
      pesanan_id: window.detail_id, // id pesanan yang sedang diupdate
      project_manager_id: parseInt(
        document.getElementById("project_manager")?.value || 0
      ),
      contract_value: contractValue,
      plan_costing: parseRupiah(
        document.getElementById("plan_costing")?.value || 0
      ),
      start_date: document.getElementById("start_date")?.value || "",
      finish_date: document.getElementById("finish_date")?.value || "",
      items: items,
    };

    // Update data ke API
    const res = await fetch(`${baseUrl}/update/project/${window.detail_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(bodyInvoice),
    });

    const json = await res.json();
    if (!res.ok) {
      Swal.fire("Gagal", json.message || "❌ Gagal update data", "error");
      return;
    }

    Swal.fire("Berhasil", "✅ Data berhasil diupdate", "success");
    loadModuleContent("project");
  } catch (error) {
    Swal.fire("Error", error.message || "❌ Terjadi kesalahan", "error");
  }
}

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

      // Validasi ketat semua field item
      if (!product) throw new Error(`Produk pada baris ${i + 1} harus diisi`);
      if (!sub_category_id)
        throw new Error(`Subkategori pada baris ${i + 1} harus dipilih`);
      if (!description)
        throw new Error(`Deskripsi pada baris ${i + 1} harus diisi`);
      if (!unit) throw new Error(`Unit pada baris ${i + 1} harus diisi`);
      if (qty <= 0) throw new Error(`Quantity pada baris ${i + 1} harus > 0`);
      if (unit_price <= 0)
        throw new Error(`Harga pada baris ${i + 1} harus > 0`);

      return {
        product,
        sub_category: sub_category_id, // Sesuai format endpoint
        description,
        unit,
        qty, // Sesuai format endpoint
        unit_price, // Sesuai format endpoint
      };
    });

    // Hitung total plan_costing
    const plan_costing = items.reduce(
      (sum, item) => sum + item.qty * item.unit_price,
      0
    );

    // Siapkan data sesuai format endpoint
    const bodyData = {
      pesanan_id: document.getElementById("deskripsi")?.value,
      project_manager_id: document.getElementById("project_manager")?.value,
      contract_value: parseRupiah(
        document.getElementById("nilai_kontrak")?.value || 0
      ),
      plan_costing: plan_costing,
      start_date: document.getElementById("start_date")?.value,
      finish_date: document.getElementById("finish_date")?.value,
      items: items,
    };

    console.log("Data yang akan dikirim:", bodyData); // Untuk debugging

    // Kirim ke API
    const res = await fetch(`${baseUrl}/update/project/${window.detail_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(bodyData),
    });

    const response = await res.json();

    if (!res.ok) {
      throw new Error(response.message || "Gagal memperbarui proyek");
    }

    Swal.fire("Berhasil", "✅ Data berhasil diupdate", "success");
    loadModuleContent("projects"); // Sesuaikan dengan modul Anda
  } catch (error) {
    console.error("Update error:", error);
    Swal.fire("Error", error.message || "❌ Terjadi kesalahan", "error");
  }
}
