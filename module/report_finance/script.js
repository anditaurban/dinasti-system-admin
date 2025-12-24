// --- 2. MAIN INITIALIZATION ---
pagemodule = "Project Finance Dashboard";
subpagemodule = "";
renderHeader();

// Global Chart Instances (supaya bisa di-destroy saat update)
var cashflowCharts = {
  incomePie: null,
  outcomePie: null,
  mainBar: null,
  receivablePie: null,
  payablePie: null,
};

document.addEventListener("DOMContentLoaded", () => {
  initCashflowDashboard();
});

async function initCashflowDashboard() {
  // 1. Ambil List Tahun dulu (biar dropdown terisi)
  fetchYearList();

  // 2. Ambil Data Cashflow (gunakan variabel global currentYear yang sudah diset di atas)
  fetchCashflowRecapData(currentYear);
}

// --- 3. API FUNCTIONS ---

async function fetchCashflowRecapData(year = currentYear) {
  // Tampilkan loading state sederhana
  const loadingEl = document.getElementById("cardExpected");
  if (loadingEl) loadingEl.innerText = "Loading...";

  try {
    // Fallback jika year undefined

    const url = `${baseUrl}/recap/cashflow/${year}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    await fetchYearList();

    if (response.status === 401) {
      console.error("Unauthorized: Login ulang diperlukan");
      return;
    }

    const result = await response.json();

    if (result.response == "200") {
      updateCashflowUI(result.data);
    } else {
      console.error("API Error:", result.message);
      if (loadingEl) loadingEl.innerText = "No Data";
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    if (loadingEl) loadingEl.innerText = "Error";
  }
}

async function fetchYearList() {
  // Cari elemen dropdown dengan class spesifik atau tag select
  // Kita gunakan class .year-filter agar lebih spesifik dan tidak menabrak select lain
  const yearSelects = document.querySelectorAll(
    ".year-filter, #year-select-main"
  );

  // GUARD CLAUSE: Cek apakah elemen ada? Jika tidak ada, stop (Cegah Error Null)
  if (yearSelects.length === 0) {
    console.warn(
      "⚠️ Warning: Dropdown tahun tidak ditemukan di HTML. Lewati fetch tahun."
    );
    return;
  }

  try {
    const url = `${baseUrl}/list/sales_year/${owner_id}`;
    console.log("Fetching Years:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();

    if (result.response == "200" && Array.isArray(result.listData)) {
      // Urutkan tahun dari terbesar ke terkecil
      const sortedYears = result.listData.sort((a, b) => b.year - a.year);

      // Update semua dropdown yang ditemukan
      yearSelects.forEach((select) => {
        select.innerHTML = ""; // Kosongkan opsi lama

        sortedYears.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.year;
          option.text = item.year;
          if (item.year == currentYear) option.selected = true;
          select.appendChild(option);
        });

        // Tambahkan Event Listener (Agar saat ganti tahun, data berubah)
        // Hapus listener lama biar gak double (opsional tapi good practice)
        select.onchange = null;
        select.onchange = function () {
          currentYear = this.value;
          console.log("📅 Tahun berubah ke:", currentYear);

          // Sinkronkan dropdown lain jika ada lebih dari 1
          yearSelects.forEach((s) => (s.value = currentYear));

          // Fetch data baru
          fetchCashflowRecapData(currentYear);

          // Update judul header jika perlu
          renderHeader();
        };
      });
    }
  } catch (error) {
    console.error("❌ Gagal load tahun:", error);

    // FALLBACK MANUAL: Jika API error, isi dropdown dengan tahun saat ini
    // (Ini pengganti fungsi ensureDefaultOption yang hilang)
    const thisYear = new Date().getFullYear();
    yearSelects.forEach((select) => {
      if (select.options.length === 0) {
        select.innerHTML = `<option value="${thisYear}" selected>${thisYear}</option>`;
      }
    });
  }
}

function handleYearChange(year) {
  currentYear = year;
  fetchCashflowRecapData(year);
}

// --- 4. UI UPDATE FUNCTIONS ---

function updateCashflowUI(data) {
  const totals = data.yearly_totals;

  // A. Update Top Cards
  setInnerText("cardExpected", formatIDR(totals.total_expected_cash_in));
  setInnerText("cardIncome", formatIDR(totals.total_cash_in));
  setInnerText("cardOutcome", formatIDR(totals.total_cash_out));
  setInnerText("cardNetFlow", formatIDR(totals.net_cashflow));

  // Update Percentages (Badges di bawah angka)
  // Note: Karena HTML cardnya statis, kita perlu cara pintar untuk update badgenya.
  // Asumsi urutan card di HTML tetap, kita cari div badge di parent element card.

  updateBadge("cardExpected", totals.total_expected_cash_in_percent + "%");
  updateBadge("cardIncome", totals.total_cash_in_percent + "%");
  updateBadge("cardOutcome", totals.total_cash_out_percent + "%");
  updateBadge(
    "cardNetFlow",
    (totals.net_cashflow > 0 ? "+" : "") + totals.net_cashflow_percent + "%"
  );

  // B. Update Receivable & Payable Texts
  const recv = data.receivable_pie_chart;
  const pay = data.payable_pie_chart;

  // Receivable
  setInnerText("receivable-title", "Account Receivable's share"); // Statis atau ambil dari mana? API tidak kirim title
  setInnerText("receivable-received-pct", recv.series[0].percentage + " %");
  setInnerText("receivable-received-amt", formatM(recv.series[0].amount));
  setInnerText("receivable-outstanding-pct", recv.series[1].percentage + " %");
  setInnerText("receivable-outstanding-amt", formatM(recv.series[1].amount));

  // Payable
  setInnerText("payable-title", pay.title);
  setInnerText("payable-paid-pct", pay.series[0].percentage + " %");
  setInnerText("payable-paid-amt", formatM(pay.series[0].amount));
  setInnerText("payable-unpaid-pct", pay.series[1].percentage + " %");
  setInnerText("payable-unpaid-amt", formatM(pay.series[1].amount));

  // C. Render Charts
  renderCashflowCharts(data);

  // D. Render Table
  renderCashflowTable(data.monthly_cashflow_summary);
}

function updateBadge(cardId, text) {
  const cardTitle = document.getElementById(cardId);
  if (cardTitle) {
    // Cari sibling element (div badge) setelah h3
    const badge = cardTitle.nextElementSibling;
    if (badge) badge.innerText = text;
  }
}

// --- 5. CHART LOGIC ---

function renderCashflowCharts(data) {
  console.log("--- DEBUG START: renderCashflowCharts ---");
  console.log("1. Data diterima:", data);

  Chart.defaults.font.family = "'Inter', sans-serif";

  // --- CHECK CHART UTAMA ---
  const ctxMain = document.getElementById("mainChart");
  if (!ctxMain) {
    console.error(
      "❌ ERROR: Elemen <canvas id='mainChart'> TIDAK DITEMUKAN di HTML!"
    );
  } else {
    console.log("✅ Canvas Main ditemukan.");
    // Cek ukuran canvas di browser
    const rect = ctxMain.getBoundingClientRect();
    console.log(
      `📏 Ukuran Canvas Main: Width=${rect.width}px, Height=${rect.height}px`
    );

    if (rect.height === 0 || rect.width === 0) {
      console.warn(
        "⚠️ PERINGATAN: Canvas size 0px. Grafik tidak akan muncul! Cek CSS."
      );
    }

    // Cek data di dalam chart
    console.log("📊 Data Main Chart:", data.cashflow_bar_chart);

    if (cashflowCharts.mainBar) cashflowCharts.mainBar.destroy();

    // Render
    cashflowCharts.mainBar = new Chart(ctxMain.getContext("2d"), {
      type: "bar",
      data: {
        labels: data.cashflow_bar_chart.labels,
        datasets: [
          {
            label: "Cash In",
            data: data.cashflow_bar_chart.cash_in,
            backgroundColor: "#FACC15",
            borderRadius: 2,
          },
          {
            label: "Cash Out",
            data: data.cashflow_bar_chart.cash_out,
            backgroundColor: "#10B981",
            borderRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // PENTING: Set false agar ikut ukuran container CSS
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => "Rp " + v / 1000000 + "M" },
            grid: { borderDash: [5, 5] },
          },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
    console.log("✅ new Chart() Main Bar dieksekusi.");
  }

  // 2. Income & Outcome Pie Charts
  // Warna untuk Income/Outcome (API tidak kirim warna, kita set default array)
  const incomeColors = ["#10B981", "#F97316", "#3B82F6", "#9F1239", "#8B5CF6"];
  const outcomeColors = [
    "#64748B",
    "#DC2626",
    "#F59E0B",
    "#10B981",
    "#06B6D4",
    "#6366F1",
  ];

  renderPie(
    "incomePieChart",
    "incomePie",
    data.income_pie_chart.series,
    incomeColors
  );
  renderPie(
    "outcomePieChart",
    "outcomePie",
    data.outcome_pie_chart.series,
    outcomeColors
  );

  // 3. Receivable & Payable Share Pies
  renderSharePie(
    "receivablePieChart",
    "receivablePie",
    data.receivable_pie_chart.series[0].percentage, // Received
    data.receivable_pie_chart.series[1].percentage // Outstanding
  );

  renderSharePie(
    "payablePieChart",
    "payablePie",
    data.payable_pie_chart.series[0].percentage, // Paid
    data.payable_pie_chart.series[1].percentage // Unpaid
  );
}

// Helper: Render General Pie Chart
function renderPie(canvasId, chartKey, seriesData, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (cashflowCharts[chartKey]) cashflowCharts[chartKey].destroy();

  cashflowCharts[chartKey] = new Chart(ctx.getContext("2d"), {
    type: "pie",
    data: {
      labels: seriesData.map((i) => i.name),
      datasets: [
        {
          data: seriesData.map((i) => i.value),
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 10, font: { size: 9 } },
        },
      },
    },
  });
}

// Helper: Render Share Pie Chart (2 segments)
function renderSharePie(canvasId, chartKey, val1, val2) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (cashflowCharts[chartKey]) cashflowCharts[chartKey].destroy();

  cashflowCharts[chartKey] = new Chart(ctx.getContext("2d"), {
    type: "pie",
    data: {
      labels: ["Success/Paid", "Pending/Unpaid"],
      datasets: [
        {
          data: [val1, val2],
          backgroundColor: ["#1e3a8a", "#bfdbfe"],
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
}

// --- 6. TABLE LOGIC ---

function renderCashflowTable(monthlyData) {
  const headerRow = document.getElementById("cashflow-table-header");
  const tableBody = document.getElementById("cashflow-table-body");

  if (!headerRow || !tableBody) return;

  // Headers statis (sesuai desain lama) karena API tidak kirim headers array
  const headers = [
    "Months",
    "Opening Balance",
    "Cash In",
    "Cash Out",
    "Net Cashflow",
    "Ending Cash Balance",
  ];

  // Render Headers
  headerRow.innerHTML = headers
    .map(
      (h, i) =>
        `<th class="px-4 py-3 ${
          i < headers.length - 1 ? "border-r border-white/20" : ""
        }">${h}</th>`
    )
    .join("");

  // Render Data Rows
  if (!monthlyData || monthlyData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No Data</td></tr>`;
    return;
  }

  tableBody.innerHTML = monthlyData
    .map((row, index) => {
      const isAlternate = index % 2 !== 0;
      const format = (val) =>
        val < 0
          ? `-Rp${Math.abs(val).toLocaleString("id-ID")}`
          : `Rp${val.toLocaleString("id-ID")}`;

      return `
            <tr class="${
              isAlternate ? "bg-[#e0f2f9]" : "bg-white"
            } border-b border-gray-100 text-center text-xs">
                <td class="px-4 py-3 border-r border-gray-200 font-bold text-[#1e6b8c]">${
                  row.month
                }</td>
                <td class="px-4 py-3 border-r border-gray-200">${format(
                  row.opening_balance
                )}</td>
                <td class="px-4 py-3 border-r border-gray-200">${format(
                  row.cash_in
                )}</td>
                <td class="px-4 py-3 border-r border-gray-200">${format(
                  row.cash_out
                )}</td>
                <td class="px-4 py-3 border-r border-gray-200 ${
                  row.net_cashflow < 0 ? "text-red-500 font-bold" : ""
                }">${format(row.net_cashflow)}</td>
                <td class="px-4 py-3 font-bold">${format(
                  row.ending_cash_balance
                )}</td>
            </tr>`;
    })
    .join("");
}

// --- 7. UTILITIES ---
function setInnerText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}

function formatIDR(num) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatM(val) {
  if (val >= 1000000000) return "Rp " + (val / 1000000000).toFixed(2) + "M";
  return "Rp " + (val / 1000000).toFixed(1) + "jt";
}
