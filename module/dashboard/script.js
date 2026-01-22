pagemodule = "Sales Performance Recap";
subpagemodule = "";
renderHeader();
setDataType("sales");
fetchProjectSalesData();

// --- Chart Instances (to allow updates) ---
var charts = {
  quotation: null,
  revenue: null,
  growth: null,
  customerBar: null,
  customerPie: null,
  productBar: null,
  productPie: null,
  poCategory: null,
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

async function initDashboard() {
  // Asumsi fungsi ini ada di template global kamu

  // 1. Fetch Year List & Set Default
  await fetchYearList();

  // 2. Fetch Dashboard Data
  fetchProjectSalesData(currentYear);
}

// --- API Functions ---

async function fetchYearList() {
  console.log("--- START FETCH YEAR ---");
  const yearSelect = document.getElementById("po-year-select");

  try {
    // Cek URL dan Owner ID

    const url = `${baseUrl}/list/sales_year/${owner_id}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();
    console.log("FULL RESPONSE API:", result); // <--- Cek ini di Console Browser

    // Hapus isi dropdown HANYA jika data valid ditemukan
    if (
      result.listData &&
      Array.isArray(result.listData) &&
      result.listData.length > 0
    ) {
      console.log("Data ditemukan, mengisi dropdown...");
      yearSelect.innerHTML = ""; // Baru kita kosongkan di sini

      // Urutkan tahun (handle jika format string atau number)
      const sortedList = result.listData.sort(
        (a, b) => Number(b.year) - Number(a.year),
      );

      sortedList.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.year;
        option.text = item.year;

        // Set default jika tahun sama dengan tahun ini
        if (Number(item.year) === Number(currentYear)) {
          option.selected = true;
        }
        yearSelect.appendChild(option);
      });
    } else {
      console.warn(
        "API 200 tapi listData kosong atau tidak ada format listData",
      );
      // Jika kosong, jangan biarkan kosong melompong, panggil fungsi fallback
      ensureDefaultOption(yearSelect);
    }
  } catch (error) {
    console.error("ERROR Fetch Year:", error);
    ensureDefaultOption(yearSelect);
  }
}

async function fetchProjectSalesData(year = currentYear) {
  document.getElementById("po-value").innerText = "Loading...";

  try {
    const url = `${baseUrl}/recap/sales/${year}`;

    // --- TAMBAHAN: Ambil Token ---
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Kirim token di sini
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    await fetchYearList();

    // Cek status code spesifik
    if (response.status === 401) {
      console.error("Sesi habis atau tidak valid. Silakan login ulang.");
      // Opsional: Redirect ke halaman login
      // window.location.href = '/login';
      return;
    }

    const result = await response.json();

    if (result.response == "200") {
      updateUI(result.data);
      renderAllCharts(result.data);
      renderTable(result.data.revenue_po_achievement_table);
    } else {
      console.error("API Error:", result.message);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

function handleYearChange(year) {
  currentYear = year;
  fetchProjectSalesData(year);
}

// --- DOM Manipulation ---

function updateUI(data) {
  const totals = data.yearly_totals;

  // 1. Cards Update
  document.getElementById("po-value").innerText = totals.total_po_achievement;

  // --- Current Sales ---
  document.getElementById("sales-value").innerText = formatCurrency(
    totals.total_current_sales,
  );
  // UPDATE: Menambahkan Tax Current Sales
  // Pastikan data JSON memiliki key 'ppn_current_sales'
  const taxSales = totals.ppn_current_sales ? totals.ppn_current_sales : 0;
  document.getElementById("sales-tax").innerText =
    "Tax " + formatCurrency(taxSales);

  document.getElementById("sales-year").innerText = totals.sales_year;
  document.getElementById("sales-percent").innerText =
    totals.total_current_sales_percent + "%";
  document.getElementById("sales-progress").style.width =
    Math.min(totals.total_current_sales_percent, 100) + "%";

  // --- Remaining Sales ---
  document.getElementById("remain-value").innerText = formatCurrency(
    totals.remaining_sales,
  );
  // UPDATE: Menambahkan Tax Remaining Sales
  // Pastikan data JSON memiliki key 'ppn_remaining_sales'
  const taxRemain = totals.ppn_remaining_sales ? totals.ppn_remaining_sales : 0;
  document.getElementById("remain-tax").innerText =
    "Tax " + formatCurrency(taxRemain);

  document.getElementById("remain-year").innerText = totals.sales_year;
  document.getElementById("remain-percent").innerText =
    totals.remaining_sales_percent + "%";
  document.getElementById("remain-progress").style.width =
    Math.min(totals.remaining_sales_percent, 100) + "%";

  // Growth
  const growthEl = document.getElementById("growth-value");
  growthEl.innerText =
    (totals.growth_rate_avg > 0 ? "+" : "") + totals.growth_rate_avg + "%";

  // Color logic for growth
  if (totals.growth_rate_avg < 0) {
    growthEl.className =
      "bg-red-100 text-red-700 text-2xl font-extrabold py-2 px-5 rounded-full inline-block mt-2";
  } else {
    growthEl.className =
      "bg-emerald-100 text-emerald-700 text-2xl font-extrabold py-2 px-5 rounded-full inline-block mt-2";
  }
  document.getElementById("growth-year").innerText = totals.sales_year;

  // Chart Titles/Years
  document.getElementById("chart-year-label").innerText = totals.sales_year;
  document.getElementById("growth-chart-year").innerText = totals.sales_year;

  // Pengecekan aman jika data chart growth kosong/null
  if (data.revenue_growth_line_chart) {
    document.getElementById("growth-chart-desc").innerText =
      data.revenue_growth_line_chart.insight;
  }

  // Pie Chart Shares Text
  // Pastikan melakukan pengecekan array index agar tidak error jika data kosong
  if (data.profit_share_top_customers_pie_chart?.series?.[0]?.data) {
    document.getElementById("customer-top-share").innerText =
      data.profit_share_top_customers_pie_chart.series[0].data[0] + "%";
    document.getElementById("customer-other-share").innerText =
      data.profit_share_top_customers_pie_chart.series[0].data[1] + "%";
  }

  if (data.profit_share_top_categories_pie_chart?.series?.[0]?.data) {
    document.getElementById("product-top-share").innerText =
      data.profit_share_top_categories_pie_chart.series[0].data[0] + "%";
    document.getElementById("product-other-share").innerText =
      data.profit_share_top_categories_pie_chart.series[0].data[1] + "%";
  }
}

function renderTable(tableData) {
  const tbody = document.getElementById("po-category-table-body");
  tbody.innerHTML = "";

  // 1. Definisikan Kategori yang ingin dijadikan Baris
  const categories = [
    "Material",
    "Service",
    "Turn Key",
    "Supervise",
    "Maintenance",
    "Tools",
  ];

  // Pastikan data rows ada dan terurut dari Jan-Des
  // Kita asumsikan tableData.rows berisi array 12 bulan urut (Jan, Feb, ... Dec)
  const monthlyData = tableData.rows;

  if (!monthlyData || monthlyData.length === 0) return;

  // 2. Looping per Kategori (Ini akan jadi Baris / TR)
  categories.forEach((cat) => {
    const tr = document.createElement("tr");
    tr.className =
      "hover:bg-blue-50 transition-colors border-b border-gray-100";

    // Style helper
    const tdClass = "px-2 py-3 border-r border-gray-100 font-mono text-xs";

    // -- Kolom 1: Nama Kategori --
    let html = `<td class="px-2 py-3 border-r border-blue-100 font-bold text-gray-600">${cat}</td>`;

    // -- Kolom 2 s/d 13: Data per Bulan (Looping ke samping) --
    monthlyData.forEach((monthRow) => {
      // Ambil value kategori tersebut di bulan ini
      const val = monthRow[cat] || 0;

      // Render Cell
      html += `<td class="${tdClass} ${
        val > 0 ? "text-gray-700" : "text-gray-300"
      }">${formatCurrencyMinimal(val)}</td>`;
    });

    tr.innerHTML = html;
    tbody.appendChild(tr);
  });

  // Opsional: Jika ingin menambahkan baris TOTAL di paling bawah
  // Kakak bisa buat satu loop lagi khusus menghitung total per bulan
}

// --- Chart Rendering Logic ---

function renderAllCharts(data) {
  // 1. Quotation Chart (Doughnut)
  renderChart(
    "quotationChart",
    "quotation",
    "doughnut",
    {
      labels: data.quotation_status_pie_chart.series.map((s) => s.name),
      datasets: [
        {
          data: data.quotation_status_pie_chart.series.map((s) => s.count),
          backgroundColor: ["#10b981", "#cbd5e1", "#ef4444"], // Won (Green), Draft (Gray), Lost (Red)
          borderWidth: 0,
        },
      ],
    },
    { cutout: "70%", plugins: { legend: { display: false } } },
  );

  // Update Quotation Legend HTML manually
  const legendContainer = document.getElementById("quotation-legend");
  legendContainer.innerHTML = data.quotation_status_pie_chart.series
    .map(
      (s, i) => `
        <div class="flex justify-between items-center">
            <span class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" style="background-color: ${
                  ["#10b981", "#cbd5e1", "#ef4444"][i]
                }"></span>
                ${s.name}
            </span>
            <span>${s.count} (${s.percentage}%)</span>
        </div>
    `,
    )
    .join("");

  // 2. Revenue Chart (General Revenue only - Bar)
  // Mapping series from JSON
  // 2. Revenue Chart (General Revenue) - LINE CHART
  const revSeries = data.general_revenue_chart.series.map((s, i) => ({
    label: s.name,
    data: s.data,
    // Ubah warna batang menjadi warna garis (borderColor)
    borderColor:
      s.name === "Won" ? "#3b82f6" : s.name === "Draft" ? "#94a3b8" : "#ef4444",
    // Warna titik (point)
    backgroundColor:
      s.name === "Won" ? "#3b82f6" : s.name === "Draft" ? "#94a3b8" : "#ef4444",
    borderWidth: 2,
    tension: 0.4, // Membuat garis sedikit melengkung (smooth)
    pointRadius: 3, // Ukuran titik
    pointHoverRadius: 5,
    fill: false, // Pastikan area bawah garis transparan (tidak di-blok warna)
  }));

  renderChart(
    "revenueChart",
    "revenue",
    "line", // <--- UBAH TIPE DARI 'bar' KE 'line' DI SINI
    {
      labels: data.general_revenue_chart.xAxis,
      datasets: revSeries,
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index", // Tooltip muncul untuk semua garis saat hover di bulan yang sama
        intersect: false,
      },
      plugins: { legend: { display: false } }, // Legend tetap dimatikan (menggunakan legend custom HTML di atas chart)
      scales: {
        y: {
          beginAtZero: true,
          grid: { borderDash: [2, 2] },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  );

  // 3. Growth Line Chart
  renderChart(
    "growthLineChart",
    "growth",
    "line",
    {
      labels: data.revenue_growth_line_chart.yAxis, // Using months as labels
      datasets: [
        {
          label: "Growth %",
          data: data.revenue_growth_line_chart.series[0].data,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#3b82f6",
          pointRadius: 4,
        },
      ],
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { borderDash: [4, 4] } },
        x: { grid: { display: false } },
      },
    },
  );

  // 4. Top Customers Bar (Horizontal)
  renderChart(
    "customerBarChart",
    "customerBar",
    "bar",
    {
      labels: data.top_customers_chart.yAxis,
      datasets: [
        {
          label: "Revenue",
          data: data.top_customers_chart.series[0].data,
          backgroundColor: "#34d399",
          barThickness: 20,
          borderRadius: 4,
        },
      ],
    },
    {
      indexAxis: "y", // Horizontal Bar
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { grid: { display: false } } },
    },
  );

  // 5. Customer Profit Share (Pie)
  renderChart(
    "customerPieChart",
    "customerPie",
    "doughnut",
    {
      labels: data.profit_share_top_customers_pie_chart.labels,
      datasets: [
        {
          data: data.profit_share_top_customers_pie_chart.series[0].data,
          backgroundColor: ["#10b981", "#1f2937"],
          borderWidth: 0,
        },
      ],
    },
    { cutout: "60%", plugins: { legend: { display: false } } },
  );

  // 6. Top Products Category Bar (Horizontal)
  renderChart(
    "productBarChart",
    "productBar",
    "bar",
    {
      labels: data.top_categories_chart.yAxis,
      datasets: [
        {
          label: "Revenue",
          data: data.top_categories_chart.series[0].data,
          backgroundColor: "#60a5fa",
          barThickness: 20,
          borderRadius: 4,
        },
      ],
    },
    {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { grid: { display: false } } },
    },
  );

  // 7. Product Profit Share (Pie)
  renderChart(
    "productPieChart",
    "productPie",
    "doughnut",
    {
      labels: data.profit_share_top_categories_pie_chart.labels,
      datasets: [
        {
          data: data.profit_share_top_categories_pie_chart.series[0].data,
          backgroundColor: ["#10b981", "#1f2937"],
          borderWidth: 0,
        },
      ],
    },
    { cutout: "60%", plugins: { legend: { display: false } } },
  );

  // 8. Revenue PO Achievement by Category (Stacked Bar)
  // Need to transform "revenue_po_achievement_chart" data which is flat lineData into stacked categories?
  // WARNING: The JSON structure provided for "revenue_po_achievement_chart" is a bit weird.
  // It has "types" (categories) and ONE "lineData" array. Usually stacked charts need an array of datasets.
  // Based on the table data provided in JSON, I will reconstruct the datasets for the chart manually to be safe.

  const tableRows = data.revenue_po_achievement_table.rows;
  const categories = [
    "Material",
    "Service",
    "Turn Key",
    "Supervise",
    "Maintenance",
    "Tools",
  ];
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#64748b",
  ];

  const poDatasets = categories.map((cat, index) => ({
    label: cat,
    data: tableRows.map((row) => row[cat]),
    backgroundColor: colors[index],
    stack: "combined",
  }));

  renderChart(
    "poCategoryChart",
    "poCategory",
    "bar",
    {
      labels: data.revenue_po_achievement_chart.months,
      datasets: poDatasets,
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { stacked: true, grid: { borderDash: [2, 2] } },
        x: { stacked: true, grid: { display: false } },
      },
    },
  );
}

// Helper to destroy old chart and create new one
function renderChart(canvasId, chartKey, type, data, options) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  if (charts[chartKey]) {
    charts[chartKey].destroy();
  }

  charts[chartKey] = new Chart(ctx, {
    type: type,
    data: data,
    options: options,
  });
}

// --- Utilities ---
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyMinimal(value) {
  if (value === 0) return "-";
  // Format compact: 1.2M, 100K if needed, otherwise standard
  return new Intl.NumberFormat("id-ID").format(value);
}
