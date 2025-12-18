pagemodule = "Project Finance Dashboard";
subpagemodule = "";
renderHeader();
setDataType("project");
fetchAndUpdateData();

(function () {
  // 1. DATA JSON LENGKAP
  const apiData = {
    summary: {
      expected_cash_in: { amount: 2000000000, percent: 100 },
      total_cash_in: { amount: 11550000000, percent: 100 },
      total_cash_out: { amount: 8550000000, percent: 100 },
      net_cashflow: { amount: 450000000, percent: 25.97 },
    },
    cashflow_history: {
      months: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      cash_in: [1.5, 2.5, 4.2, 0.8, 0.9, 0.2, 1.8, 2.1, 3.5, 4.0, 2.5, 5.0],
      cash_out: [0.5, 1.2, 2.2, 0.1, 2.3, 0.9, 1.0, 1.5, 2.8, 3.0, 1.8, 3.5],
    },
    income_distribution: [
      { label: "Project Payment", value: 81, color: "#10B981" },
      { label: "Debt", value: 10, color: "#F97316" },
      { label: "Buy Back", value: 5, color: "#3B82F6" },
      { label: "Miscellaneous", value: 4, color: "#9F1239" },
    ],
    outcome_distribution: [
      { label: "Project Direct Cost", value: 45, color: "#64748B" },
      { label: "Debt Return", value: 15, color: "#DC2626" },
      { label: "Salary", value: 10, color: "#F59E0B" },
      { label: "Daily Cash", value: 10, color: "#10B981" },
      { label: "Tax", value: 10, color: "#06B6D4" },
      { label: "Admin Fee", value: 10, color: "#6366F1" },
    ],
    receivable_payable: {
      receivable: {
        title: "Account Receivable's share of the",
        received: { percent: 83.3, amount: 10000000 },
        outstanding: { percent: 16.7, amount: 2000000 },
      },
      payable: {
        title: "Account Payable's share of the",
        paid: { percent: 94.3, amount: 8300000 },
        unpaid: { percent: 5.7, amount: 500000 },
      },
    },
    project_cashflow_table: {
      year: 2024,
      headers: [
        "Months",
        "Opening Balance",
        "Cash In",
        "Cash Out",
        "Net Cashflow",
        "Ending Cash Balance",
      ],
      data: [
        {
          month: "Jan",
          opening: 2000000000,
          in: 1200000000,
          out: 850000000,
          net: 350000000,
          ending: 2350000000,
        },
        {
          month: "Feb",
          opening: 2350000000,
          in: 900000000,
          out: 1100000000,
          net: -200000000,
          ending: 2150000000,
        },
        {
          month: "Mar",
          opening: 2150000000,
          in: 1800000000,
          out: 1500000000,
          net: 300000000,
          ending: 2450000000,
        },
        {
          month: "Apr",
          opening: 2450000000,
          in: 1000000000,
          out: 950000000,
          net: 50000000,
          ending: 2500000000,
        },
        {
          month: "Mei",
          opening: 2500000000,
          in: 2500000000,
          out: 2000000000,
          net: 500000000,
          ending: 3000000000,
        },
        {
          month: "Jun",
          opening: 3000000000,
          in: 1200000000,
          out: 1000000000,
          net: 200000000,
          ending: 3200000000,
        },
        {
          month: "Jul",
          opening: 3200000000,
          in: 1500000000,
          out: 1300000000,
          net: 200000000,
          ending: 3400000000,
        },
        {
          month: "Agu",
          opening: 3400000000,
          in: 1100000000,
          out: 1200000000,
          net: -100000000,
          ending: 3300000000,
        },
        {
          month: "Sep",
          opening: 3300000000,
          in: 2100000000,
          out: 1800000000,
          net: 300000000,
          ending: 3600000000,
        },
        {
          month: "Okt",
          opening: 3600000000,
          in: 1600000000,
          out: 1400000000,
          net: 200000000,
          ending: 3800000000,
        },
        {
          month: "Nov",
          opening: 3800000000,
          in: 1800000000,
          out: 1700000000,
          net: 100000000,
          ending: 3900000000,
        },
        {
          month: "Des",
          opening: 3900000000,
          in: 2200000000,
          out: 2000000000,
          net: 200000000,
          ending: 4100000000,
        },
      ],
    },
  };

  // 2. HELPER FUNCTIONS
  const formatIDR = (num) => "Rp " + num.toLocaleString("id-ID");
  const formatM = (val) => "Rp " + (val / 1000000).toFixed(1) + "M";
  const setInnerText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  // 3. MAIN INITIALIZER FUNCTION
  function initDashboard() {
    try {
      // Mapping Summary KPI Cards
      setInnerText(
        "cardExpected",
        formatIDR(apiData.summary.expected_cash_in.amount)
      );
      setInnerText(
        "cardIncome",
        formatIDR(apiData.summary.total_cash_in.amount)
      );
      setInnerText(
        "cardOutcome",
        formatIDR(apiData.summary.total_cash_out.amount)
      );
      setInnerText(
        "cardNetFlow",
        formatIDR(apiData.summary.net_cashflow.amount)
      );

      // Mapping Receivable & Payable Labels
      const rp = apiData.receivable_payable;
      setInnerText("receivable-title", rp.receivable.title);
      setInnerText(
        "receivable-received-pct",
        rp.receivable.received.percent + " %"
      );
      setInnerText(
        "receivable-received-amt",
        formatM(rp.receivable.received.amount)
      );
      setInnerText(
        "receivable-outstanding-pct",
        rp.receivable.outstanding.percent + " %"
      );
      setInnerText(
        "receivable-outstanding-amt",
        formatM(rp.receivable.outstanding.amount)
      );

      setInnerText("payable-title", rp.payable.title);
      setInnerText("payable-paid-pct", rp.payable.paid.percent + " %");
      setInnerText("payable-paid-amt", formatM(rp.payable.paid.amount));
      setInnerText("payable-unpaid-pct", rp.payable.unpaid.percent + " %");
      setInnerText("payable-unpaid-amt", formatM(rp.payable.unpaid.amount));

      // PERBAIKAN: Panggil fungsi tabel di sini agar muncul
      renderCharts();
      initProjectCashflowTable();
    } catch (e) {
      console.error("Dashboard Init Error:", e);
    }
  }

  // 4. CHART RENDERING FUNCTIONS
  function renderCharts() {
    Chart.defaults.font.family = "'Inter', sans-serif";

    // --- Main Bar Chart: Cash In vs Cash Out ---
    const ctxMain = document.getElementById("mainChart");
    if (ctxMain) {
      new Chart(ctxMain.getContext("2d"), {
        type: "bar",
        data: {
          labels: apiData.cashflow_history.months,
          datasets: [
            {
              label: "Cash In",
              data: apiData.cashflow_history.cash_in,
              backgroundColor: "#FACC15",
              borderRadius: 2,
            },
            {
              label: "Cash Out",
              data: apiData.cashflow_history.cash_out,
              backgroundColor: "#10B981",
              borderRadius: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (v) => "Rp " + v + "M" },
              grid: { borderDash: [5, 5] },
            },
            x: { grid: { display: false } },
          },
          plugins: { legend: { display: false } },
        },
      });
    }

    // --- Pie Charts Helper ---
    const renderPie = (canvasId, dataArray) => {
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;
      new Chart(ctx.getContext("2d"), {
        type: "pie",
        data: {
          labels: dataArray.map((i) => i.label),
          datasets: [
            {
              data: dataArray.map((i) => i.value),
              backgroundColor: dataArray.map((i) => i.color),
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
    };
    renderPie("incomePieChart", apiData.income_distribution);
    renderPie("outcomePieChart", apiData.outcome_distribution);

    // --- Share Pie Charts ---
    const renderSharePie = (canvasId, receivedPct, remainingPct) => {
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;
      new Chart(ctx.getContext("2d"), {
        type: "pie",
        data: {
          labels: ["Success", "Pending"],
          datasets: [
            {
              data: [receivedPct, remainingPct],
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
    };
    renderSharePie(
      "receivablePieChart",
      apiData.receivable_payable.receivable.received.percent,
      apiData.receivable_payable.receivable.outstanding.percent
    );
    renderSharePie(
      "payablePieChart",
      apiData.receivable_payable.payable.paid.percent,
      apiData.receivable_payable.payable.unpaid.percent
    );
  }

  // 5. TABLE INITIALIZATION
  function initProjectCashflowTable() {
    const data = apiData.project_cashflow_table;
    const headerRow = document.getElementById("cashflow-table-header");
    const tableBody = document.getElementById("cashflow-table-body");

    if (!headerRow || !tableBody || !data) return;

    // Render Headers
    headerRow.innerHTML = data.headers
      .map(
        (h, i) =>
          `<th class="px-4 py-3 ${
            i < data.headers.length - 1 ? "border-r border-white/20" : ""
          }">${h}</th>`
      )
      .join("");

    // Render Data Rows
    tableBody.innerHTML = data.data
      .map((row, index) => {
        const isAlternate = index % 2 !== 0;
        const format = (val) =>
          val < 0
            ? `-Rp${Math.abs(val).toLocaleString("id-ID")}.000`
            : `Rp${val.toLocaleString("id-ID")}.000`;

        return `
            <tr class="${
              isAlternate ? "bg-[#e0f2f9]" : "bg-white"
            } border-b border-gray-100 text-center text-xs">
                <td class="px-4 py-3 border-r border-gray-200 font-bold text-[#1e6b8c]">${
                  row.month
                }</td>
                <td class="px-4 py-3 border-r border-gray-200">${format(
                  row.opening
                )}</td>
                <td class="px-4 py-3 border-r border-gray-200">${format(
                  row.in
                )}</td>
                <td class="px-4 py-3 border-r border-gray-200">${format(
                  row.out
                )}</td>
                <td class="px-4 py-3 border-r border-gray-200 ${
                  row.net < 0 ? "text-red-500 font-bold" : ""
                }">${format(row.net)}</td>
                <td class="px-4 py-3 font-bold">${format(row.ending)}</td>
            </tr>`;
      })
      .join("");
  }

  // 6. BOOTSTRAP EXECUTION
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    initDashboard();
  } else {
    document.addEventListener("DOMContentLoaded", initDashboard);
  }
})();
