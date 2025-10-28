pagemodule = "Project";
subpagemodule = "Project Costing";
// renderHeader(); // Diasumsikan sudah ada di file lain

// ================================================================
// DATA JSON SEMENTARA
// ================================================================
const projectData = {
  detail: {
    project_value: 38295000,
    plan_costing: 12000000, // Initial plan cost (8jt + 4jt)
    actual_cost: 10750000,
    margin: 27545000,
    no_qo: "QO/2025/09/123",
    no_inv: "INV/2025/09/456",
    no_po: "PO-789XYZ",
    pic_pm: "Budi Santoso",
    items: [
      {
        id: 101,
        sub_category: "JASA",
        product: "Ganti Kabel",
        description: "Termasuk pengerjaan glow in the dark",
        qty: 1,
        unit: "set",
        unit_price: 10300000,
        total: 10300000,
        plan_costing: 8000000,
        actual_costing: 7000000,
        payment_date: "2025-09-12",
      },
      {
        id: 102,
        sub_category: "MOB/DEMOB",
        product: "Drop Team",
        description: "Mobilisasi tim ke lokasi",
        qty: 2,
        unit: "Person",
        unit_price: 2900000,
        total: 5800000,
        plan_costing: 4000000,
        actual_costing: 3750000,
        payment_date: "2025-09-14",
      },
    ],
  },
};

const realCalculationData = [
  {
    id: 1,
    tanggal: "2025-09-01",
    product: "Kabel Ungu",
    korelasi: "Ganti Kabel",
    harga: 2000000,
  },
  {
    id: 2,
    tanggal: "2025-09-12",
    product: "Kabel PINK",
    korelasi: "Ganti Kabel",
    harga: 5000000,
  },
  {
    id: 3,
    tanggal: "2025-09-13",
    product: "Tiket Pesawat Agus",
    korelasi: "Drop Team",
    harga: 2000000,
  },
  {
    id: 4,
    tanggal: "2025-09-14",
    product: "Tiket Pesawat Nandar",
    korelasi: "Drop Team",
    harga: 1750000,
  },
];

// ================================================================
// PENGATURAN TAB
// ================================================================
const tab1 = document.getElementById("tab1");
const tab2 = document.getElementById("tab2");
const tab1Btn = document.getElementById("tab1Btn");
const tab2Btn = document.getElementById("tab2Btn");

tab1Btn.addEventListener("click", () => {
  tab1.classList.remove("hidden");
  tab2.classList.add("hidden");
  tab1Btn.classList.add("border-blue-600", "text-blue-600");
  tab2Btn.classList.remove("border-blue-600", "text-blue-600");
});

tab2Btn.addEventListener("click", () => {
  tab2.classList.remove("hidden");
  tab1.classList.add("hidden");
  tab2Btn.classList.add("border-blue-600", "text-blue-600");
  tab1Btn.classList.remove("border-blue-600", "text-blue-600");
});

// ================================================================
// FUNGSI RENDER UTAMA
// ================================================================
function loadDetailProject() {
  try {
    const data = projectData.detail;
    if (!data) throw new Error("Struktur JSON tidak valid");

    // --- Kalkulasi Ulang Total Sebelum Render ---
    // Total Plan Costing berdasarkan nilai di setiap item
    data.plan_costing = data.items.reduce(
      (sum, item) => sum + (item.plan_costing || 0),
      0
    );
    // Total Actual Costing berdasarkan nilai di setiap item
    data.actual_cost = data.items.reduce(
      (sum, item) => sum + (item.actual_costing || 0),
      0
    );
    // Margin
    data.margin = data.project_value - data.actual_cost;

    // --- Update Kartu Ringkasan Atas ---
    document.getElementById("projectAmount").innerHTML = formatNumber(
      data.project_value
    );
    document.getElementById("plan_costing").innerHTML = formatNumber(
      data.plan_costing
    );
    document.getElementById("actual_costing").innerHTML = formatNumber(
      data.actual_cost
    );
    document.getElementById("margin").innerHTML = formatNumber(data.margin);

    // --- Update Info Detail Project ---
    document.getElementById("detailNoQO").textContent = data.no_qo || "---";
    document.getElementById("detailNoInv").textContent = data.no_inv || "---";
    document.getElementById("detailNoPO").textContent = data.no_po || "---";
    document.getElementById("detailPIC").textContent = data.pic_pm || "---";

    // --- Render Tabel Item di Tab 1 ---
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    if (data.items?.length) {
      const groups = {};
      data.items.forEach((item) => {
        if (!groups[item.sub_category]) groups[item.sub_category] = [];
        groups[item.sub_category].push(item);
      });

      let nomor = 1;
      Object.keys(groups).forEach((subCat) => {
        tbody.innerHTML += `<tr class="bg-gray-200 font-semibold"><td colspan="10" class="px-3 py-2 uppercase">${
          subCat || "-"
        }</td></tr>`;

        groups[subCat].forEach((item) => {
          const tr = document.createElement("tr");
          tr.className = "border-b";
          tr.dataset.itemId = item.id; // Penting untuk update

          // --- MODIFIKASI: Mengganti Plan Costing menjadi input ---
          tr.innerHTML = `
            <td class="px-3 py-2 text-center align-top">${nomor++}</td>
            <td class="px-3 py-2 align-top">
              <div class="font-medium">${item.product || "-"}</div>
              <div class="text-xs text-gray-500">${item.description || ""}</div>
            </td>
            <td class="px-3 py-2 text-right align-top">${item.qty || 0}</td>
            <td class="px-3 py-2 text-left align-top">${item.unit || ""}</td>
            <td class="px-3 py-2 text-right align-top">${formatNumber(
              item.unit_price || 0
            )}</td>
            <td class="px-3 py-2 text-right align-top">${formatNumber(
              item.total || 0
            )}</td>
            <td class="px-3 py-2 text-center align-top">
              <input class="plancosting text-right border rounded px-2 py-1 w-full" type="number" placeholder="0" value="${
                item.plan_costing || 0
              }">
            </td>
            <td class="px-3 py-2 text-right font-bold text-red-600 align-top">${formatNumber(
              item.actual_costing || 0
            )}</td>
            <td class="px-3 py-2 text-center align-top">${
              item.payment_date || "dd/mm/yyyy"
            }</td>
            <td class="px-3 py-2 text-center align-top">
              <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">Update</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
    }

    // Panggil fungsi untuk mengisi data Tab 2
    populateCorrelationDropdown(data.items);
    loadRealCalculationDetails(realCalculationData);
  } catch (err) {
    console.error("Gagal memuat detail:", err);
    alert("Gagal memuat detail project: " + err.message);
  }
}

// ================================================================
// FUNGSI UNTUK TAB 2
// ================================================================
function populateCorrelationDropdown(projectItems) {
  const select = document.getElementById("calcKorelasi");
  select.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>';
  if (!projectItems) return;
  projectItems.forEach((item) => {
    select.innerHTML += `<option value="${item.product}">${item.product}</option>`;
  });
}

function loadRealCalculationDetails(details) {
  const tbody = document.getElementById("realCalcBody");
  tbody.innerHTML = "";
  if (details && details.length > 0) {
    details.forEach((data) => {
      tbody.innerHTML += `
        <tr class="border-b">
          <td class="px-3 py-2">${data.tanggal}</td>
          <td class="px-3 py-2">${data.product}</td>
          <td class="px-3 py-2">${data.korelasi}</td>
          <td class="px-3 py-2 text-right">${formatNumber(data.harga)}</td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>';
  }
}

// ================================================================
// --- BARU: FUNGSI UNTUK MENGHITUNG ULANG ACTUAL COST ---
// ================================================================
function updateActualCosting() {
  projectData.detail.items.forEach((item) => {
    // Filter semua pengeluaran yang relevan untuk item ini
    const relatedExpenses = realCalculationData.filter(
      (expense) => expense.korelasi === item.product
    );
    // Jumlahkan harganya
    const totalActualCostForItem = relatedExpenses.reduce(
      (sum, expense) => sum + expense.harga,
      0
    );
    // Update nilai actual_costing di data item
    item.actual_costing = totalActualCostForItem;
  });

  // Setelah semua item diupdate, render ulang seluruh tampilan
  loadDetailProject();
}

// ================================================================
// EVENT LISTENERS UNTUK INTERAKSI
// ================================================================

// --- BARU: Event listener untuk form input di Tab 2 ---
document
  .getElementById("realCalcForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Mencegah form submit dan reload halaman

    // Ambil nilai dari form
    const tanggal = document.getElementById("calcTanggal").value;
    const product = document.getElementById("calcProduct").value;
    const korelasi = document.getElementById("calcKorelasi").value;
    const harga = parseInt(document.getElementById("calcHarga").value) || 0;

    // Validasi sederhana
    if (!tanggal || !product || !korelasi || harga <= 0) {
      alert("Harap isi semua field dengan benar.");
      return;
    }

    // Buat objek data baru
    const newData = {
      id: Date.now(), // ID unik sementara
      tanggal,
      product,
      korelasi,
      harga,
    };

    // Tambahkan data baru ke array `realCalculationData`
    realCalculationData.push(newData);

    // Reset form
    this.reset();

    // Tampilkan notifikasi (opsional)
    const notif = document.getElementById("notification");
    notif.textContent = "Detail pengeluaran berhasil ditambahkan!";
    notif.classList.remove("hidden");
    setTimeout(() => notif.classList.add("hidden"), 2000);

    // Hitung ulang semua nilai Actual Costing dan render ulang halaman
    updateActualCosting();
  });

// --- BARU: Event listener untuk input Plan Costing di Tab 1 ---
document
  .getElementById("tabelItem")
  .addEventListener("input", function (event) {
    // Pastikan event berasal dari input dengan class 'plancosting'
    if (event.target.classList.contains("plancosting")) {
      const inputElement = event.target;
      const newCost = parseInt(inputElement.value) || 0;
      const itemId = parseInt(inputElement.closest("tr").dataset.itemId);

      // Cari item di dalam data JSON dan update nilainya
      const itemToUpdate = projectData.detail.items.find(
        (item) => item.id === itemId
      );
      if (itemToUpdate) {
        itemToUpdate.plan_costing = newCost;
      }

      // Hitung ulang total Plan Costing untuk kartu ringkasan
      const totalPlanCost = projectData.detail.items.reduce(
        (sum, item) => sum + (item.plan_costing || 0),
        0
      );

      // Update data utama dan tampilkan di kartu ringkasan
      projectData.detail.plan_costing = totalPlanCost;
      document.getElementById("plan_costing").textContent =
        formatNumber(totalPlanCost);
    }
  });

// ================================================================
// PEMANGGILAN FUNGSI AWAL
// ================================================================
// Panggil fungsi ini saat script pertama kali dimuat
loadDetailProject();
