// --- Main Initialization ---
pagemodule = "Project Performance Dashboard";
subpagemodule = "";
renderHeader();
setDataType("recap_project");
fetchProjectRecapData();
// Global Chart Instances
projectCharts = {
  status: null,
  planVsActual: null,
};

document.addEventListener("DOMContentLoaded", () => {
  initProjectDashboard();
});

async function initProjectDashboard() {
  await fetchProjectYearList(currentYear);
  fetchProjectRecapData(currentYear);
}

// --- API Functions ---

async function fetchProjectRecapData(year = currentYear) {
  const loadingEl = document.getElementById("cardTotalProject");
  if (loadingEl) loadingEl.innerText = "Loading...";

  // Update dropdown tahun agar sinkron
  const yearSelect = document.getElementById("po-year-select");
  if (yearSelect) yearSelect.value = year;

  try {
    const url = `${baseUrl}/recap/project/${year}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    await fetchProjectYearList();
    if (response.status === 401) {
      console.error("Unauthorized: Login ulang diperlukan");
      return;
    }

    const result = await response.json();

    if (result.response == "200") {
      updateProjectUI(result.data);
    } else {
      console.error("API Error:", result.message);
      if (loadingEl) loadingEl.innerText = "No Data";
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    if (loadingEl) loadingEl.innerText = "Error";
  }
}

async function fetchProjectYearList() {
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
        (a, b) => Number(b.year) - Number(a.year)
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
        "API 200 tapi listData kosong atau tidak ada format listData"
      );
      // Jika kosong, jangan biarkan kosong melompong, panggil fungsi fallback
      ensureDefaultOption(yearSelect);
    }
  } catch (error) {
    console.error("ERROR Fetch Year:", error);
    ensureDefaultOption(yearSelect);
  }
}

function handleYearChange(year) {
  currentYear = year;
  fetchProjectRecapData(year);
}

// --- UI Update Functions ---

function updateProjectUI(data) {
  const totals = data.yearly_totals;

  safeSetText("cardTotalProject", `${totals.total_projects} Tasks`);
  safeSetText("cardTotalValue", formatIDR(totals.total_value));
  safeSetText("cardTotalActual", formatIDR(totals.total_cogs));
  safeSetText("cardTotalGross", formatIDR(totals.total_gross_profit));

  const marginEl = document.getElementById("cardOverallMargin");
  if (marginEl) {
    marginEl.innerText = `${totals.gross_profit_percent}%`;
    if (totals.gross_profit_percent < 0) {
      marginEl.className =
        "bg-red-200 text-red-800 text-2xl font-black py-4 rounded-2xl border-2 border-red-300";
    } else {
      marginEl.className =
        "bg-emerald-200 text-emerald-800 text-2xl font-black py-4 rounded-2xl border-2 border-emerald-300";
    }
  }

  // Debugging: Cek apakah data chart ada
  console.log("Data Chart Masuk:", data);

  renderProjectCharts(data);
  renderProjectTable(data.cost_variance_table);
}

function renderProjectCharts(data) {
  // --- 1. PIE CHART ---
  const canvasStatus = document.getElementById("statusChart");

  if (canvasStatus) {
    const ctxStatus = canvasStatus.getContext("2d");
    const statusData = data.project_status_pie_chart;

    const colorMap = {
      Finished: "#10B981",
      "Completed / Finished": "#10B981",
      "On Going": "#3B82F6",
      "In Progress / Ongoing": "#3B82F6",
      "On Hold": "#F59E0B",
      "Not Sales Yet": "#EF4444",
      "Not Yet Sales": "#EF4444",
    };
    const defaultColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

    if (projectCharts.status) projectCharts.status.destroy();

    projectCharts.status = new Chart(ctxStatus, {
      type: "pie",
      data: {
        labels: statusData.series.map((s) => s.name),
        datasets: [
          {
            data: statusData.series.map((s) => s.percentage),
            backgroundColor: statusData.series.map(
              (s, i) =>
                colorMap[s.name] || defaultColors[i % defaultColors.length]
            ),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });

    // Update Legend
    const legendContainer = document.getElementById("statusLegend");
    if (legendContainer) {
      legendContainer.innerHTML = statusData.series
        .map((s) => {
          const color = colorMap[s.name] || defaultColors[0];
          return `
                <div class="flex justify-between items-center">
                    <div class="flex items-center"><span class="w-2 h-2 mr-2 rounded-full" style="background:${color}"></span>${s.name}</div>
                    <span>${s.percentage}%</span>
                </div>`;
        })
        .join("");
    }
  } else {
    console.error("Canvas ID 'statusChart' tidak ditemukan di HTML!");
  }

  // --- 2. BAR CHART ---
  const canvasPva = document.getElementById("planVsActualChart");

  if (canvasPva) {
    const ctxPva = canvasPva.getContext("2d");
    const barData = data.cost_plan_vs_actual_bar_chart;

    if (projectCharts.planVsActual) projectCharts.planVsActual.destroy();

    projectCharts.planVsActual = new Chart(ctxPva, {
      type: "bar",
      data: {
        labels: barData.projects,
        datasets: [
          {
            label: barData.series[0].name,
            data: barData.series[0].data,
            backgroundColor: "#86EFAC",
            barPercentage: 0.6,
          },
          {
            label: barData.series[1].name,
            data: barData.series[1].data,
            backgroundColor: "#DC2626",
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (v) =>
                v >= 1000000000
                  ? (v / 1000000000).toFixed(1) + "M"
                  : (v / 1000000).toFixed(0) + "jt",
            },
          },
          x: {
            grid: { display: false },
            ticks: {
              autoSkip: false,
              maxRotation: 90,
              minRotation: 45,
              font: { size: 9 },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.dataset.label + ": " + formatIDR(context.raw);
              },
            },
          },
        },
      },
    });
  } else {
    console.error("Canvas ID 'planVsActualChart' tidak ditemukan di HTML!");
  }
}

function renderProjectTable(rows) {
  const tbody = document.getElementById("projectTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-4">No Data Available</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map((row, i) => {
      // Hapus logic warna-warni, ganti jadi teks hitam semua
      // Format baris tabel:
      return `
        <tr class="border-b text-center hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 border-r border-gray-100 text-gray-900">
                ${i + 1}
            </td>
            
            <td class="px-4 py-3 border-r border-gray-100 text-left font-semibold text-gray-900 truncate max-w-xs" title="${
              row.project_name
            }">
                ${row.project_name}
            </td>
            
            <td class="px-4 py-3 border-r border-gray-100 text-right text-gray-900">
                ${formatIDR(row.plan_costing)}
            </td>
            
            <td class="px-4 py-3 border-r border-gray-100 text-right text-gray-900">
                ${formatIDR(row.actual_costing)}
            </td>
            
            <td class="px-4 py-3 border-r border-gray-100 text-right font-bold text-gray-900">
                ${formatIDR(row.variance)}
            </td>
            
            <td class="px-4 py-3 border-r border-gray-100 text-xs text-gray-900">
                ${row.variance_percent}%
            </td>
            
            <td class="px-4 py-3 text-xs text-gray-900">
                <span class="font-bold">${row.project_status}</span>
                <div class="text-[9px] text-gray-500 mt-0.5 italic">${
                  row.costing_status
                }</div>
            </td>
        </tr>`;
    })
    .join("");
}

// --- Utilities ---
function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function formatIDR(num) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
