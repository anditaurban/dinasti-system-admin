pagemodule = "Sales Performance Recap";
subpagemodule = "";
renderHeader();
setDataType("project");
fetchAndUpdateData();

(function () {
  // 1. DATA JSON LENGKAP
  const apiData = {
    summary: {
      po_achievement: {
        value: 112,
        unit: "Tasks",
        period: "Yearly",
        year: 2024,
      },
      current_sales: { amount: 10000000000, percent: 83, year: 2024 },
      remaining_sales: { amount: 2000000000, percent: 17, year: 2024 },
      growth: { value: "+4.5%", year: 2024 },
    },
    quotation_status: [
      { label: "Won", value: 74.2, color: "#22c55e" },
      { label: "Loss", value: 13.9, color: "#f97316" },
      { label: "On Going/Draft", value: 11.9, color: "#3b82f6" },
    ],
    revenue_history: {
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
      datasets: [
        {
          label: "Won",
          data: [1.5, 2.5, 4.2, 0.8, 0.9, 0.2, 1.1, 1.8, 2.5, 3.0, 2.2, 4.0],
          color: "#22c55e",
        },
        {
          label: "Loss",
          data: [0, 1.2, 0, 0.2, 2.4, 0.9, 0.5, 0.3, 1.0, 0.4, 0.8, 0.2],
          color: "#f97316",
        },
        {
          label: "Draft",
          data: [0, 0, 0, 0.4, 0.8, 0.2, 0.3, 0.6, 0.2, 0.5, 1.0, 0.8],
          color: "#3b82f6",
        },
      ],
    },
    growth_history: {
      title: "Revenue Growth on Monthly Basis",
      year: 2024,
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
      data: [0, 67, 68, -81, 13, -77, 20, 45, 10, -5, 30, 50],
    },
    customer_ranking: {
      title: "Top 5 Customers with Highest Retention",
      data: [
        { name: "PT Schneider Indonesia", value: 1500000, color: "#00ced1" },
        { name: "PT Siemens Indonesia", value: 1000000, color: "#4ecdc4" },
        {
          name: "PT Indofood Sukses Makmur Tbk",
          value: 750000,
          color: "#45b7d1",
        },
        { name: "PT Patra Jasa", value: 650000, color: "#6a5acd" },
        { name: "PT Pertamina Persero", value: 450000, color: "#9932cc" },
      ],
      profit_share: { top_5: 76.2, others: 23.8 },
    },
    product_ranking: {
      title: "Top 3 Categories by Profitability",
      data: [
        { name: "Turn Key", value: 4500000, color: "#00ced1" },
        { name: "Services", value: 3850000, color: "#4ecdc4" },
      ],
      profit_share: { top_3: 84.2, others: 15.8 },
    },
    // Pastikan nama properti ini konsisten
    po_category_achievement: {
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
      categories: [
        "Material",
        "Service",
        "Turn Key",
        "Supervise",
        "Maintenance",
        "Tools",
      ],
      datasets: [
        {
          label: "Material",
          data: [0.1, 0.9, 1.0, 0.2, 2.3, 0.3, 0.8, 1.2, 0.5, 1.5, 0.9, 2.0],
          color: "#bfdbfe",
        },
        {
          label: "Service",
          data: [0.2, 0.1, 0.3, 3.0, 0.3, 0.1, 0.4, 0.6, 0.8, 1.0, 0.5, 1.2],
          color: "#1e3a8a",
        },
        {
          label: "Turn Key",
          data: [0.0, 0.0, 2.0, 1.1, 0.0, 0.0, 1.5, 0.0, 2.5, 0.0, 3.0, 0.0],
          color: "#10b981",
        },
        {
          label: "Supervise",
          data: [0.2, 0.1, 0.05, 0.1, 0.02, 0.1, 0.1, 0.2, 0.1, 0.15, 0.1, 0.3],
          color: "#fbbf24",
        },
        {
          label: "Maintenance",
          data: [0.5, 0.2, 0.1, 0.1, 0.1, 0.15, 0.2, 0.3, 0.2, 0.4, 0.5, 0.6],
          color: "#d8b4fe",
        },
        {
          label: "Tools",
          data: [0.05, 0.02, 0.05, 0.0, 0.0, 0.7, 0.1, 0.0, 0.3, 0.2, 0.4, 0.5],
          color: "#f97316",
        },
      ],
    },
  };

  const formatIDR = (num) =>
    "Rp " + num.toLocaleString("id-ID").replace(/,/g, ".");
  const setInnerText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  function initDashboard() {
    try {
      // Summary Cards
      setInnerText(
        "po-value",
        `${apiData.summary.po_achievement.value} ${apiData.summary.po_achievement.unit}`
      );
      setInnerText("po-period", apiData.summary.po_achievement.period);
      setInnerText("po-year", apiData.summary.po_achievement.year);
      setInnerText(
        "sales-value",
        formatIDR(apiData.summary.current_sales.amount)
      );
      setInnerText(
        "sales-percent",
        apiData.summary.current_sales.percent + "%"
      );
      setInnerText(
        "remain-value",
        formatIDR(apiData.summary.remaining_sales.amount)
      );
      setInnerText(
        "remain-percent",
        apiData.summary.remaining_sales.percent + "%"
      );
      setInnerText("growth-value", apiData.summary.growth.value);
      setInnerText("growth-year", apiData.summary.growth.year);

      if (document.getElementById("sales-progress"))
        document.getElementById("sales-progress").style.width =
          apiData.summary.current_sales.percent + "%";
      if (document.getElementById("remain-progress"))
        document.getElementById("remain-progress").style.width =
          apiData.summary.remaining_sales.percent + "%";

      // Growth History
      setInnerText("growth-chart-title", apiData.growth_history.title);
      setInnerText("growth-chart-year", apiData.growth_history.year);
      const chartData = apiData.growth_history.data;
      const maxVal = Math.max(...chartData);
      const maxMonthIdx = chartData.indexOf(maxVal);
      const fullMonthNames = {
        Jan: "January",
        Feb: "February",
        Mar: "March",
        Apr: "April",
        May: "May",
        Jun: "June",
      };
      const maxMonthName =
        fullMonthNames[apiData.growth_history.months[maxMonthIdx]];
      setInnerText(
        "growth-chart-desc",
        `${maxMonthName} were our Top Performers, generated up to ${maxVal.toFixed(
          2
        )}% of our revenue growth`
      );

      // Ranking Section Labels
      setInnerText("customer-title", apiData.customer_ranking.title);
      setInnerText(
        "customer-top-share",
        apiData.customer_ranking.profit_share.top_5 + " %"
      );
      setInnerText(
        "customer-other-share",
        apiData.customer_ranking.profit_share.others + " %"
      );
      setInnerText("product-title", apiData.product_ranking.title);
      setInnerText(
        "product-top-share",
        apiData.product_ranking.profit_share.top_3 + " %"
      );
      setInnerText(
        "product-other-share",
        apiData.product_ranking.profit_share.others + " %"
      );

      // Menjalankan render grafik
      renderMainCharts();
      renderRankingCharts();
      initPOCategoryData(); // PENTING: Panggil fungsi tabel PO Category di sini
    } catch (e) {
      console.error("Dashboard Initialization Error:", e);
    }
  }

  function initPOCategoryData() {
    const tableBody = document.getElementById("po-category-table-body");
    const data = apiData.po_category_achievement;

    if (!tableBody || !data) return;

    tableBody.innerHTML = data.categories
      .map((cat) => {
        const rowData = data.datasets.find((ds) => ds.label === cat).data;
        // Membuat kolom untuk ke-12 bulan
        const monthCols = rowData
          .map(
            (val) =>
              `<td class="px-2 py-3 border-r text-center">Rp ${val.toFixed(
                1
              )}M</td>`
          )
          .join("");

        return `
        <tr class="border-b hover:bg-gray-50 transition-colors">
            <td class="px-2 py-3 font-bold border-r bg-gray-50">${cat}</td>
            ${monthCols}
        </tr>`;
      })
      .join("");

    renderPOCategoryChart();
  }

  function renderPOCategoryChart() {
    const canvas = document.getElementById("poCategoryChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const data = apiData.po_category_achievement;

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.months,
        datasets: data.datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color,
          borderRadius: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              font: { size: 10, weight: "bold" },
              padding: 20,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => "Rp " + v.toFixed(1) + "M",
              font: { size: 11, weight: "bold" },
            },
            grid: { borderDash: [5, 5] },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: "bold" } },
          },
        },
      },
    });
  }

  function renderMainCharts() {
    // Pie Chart Quotation
    const canvasPie = document.getElementById("quotationChart");
    if (canvasPie) {
      new Chart(canvasPie.getContext("2d"), {
        type: "pie",
        data: {
          labels: apiData.quotation_status.map((i) => i.label),
          datasets: [
            {
              data: apiData.quotation_status.map((i) => i.value),
              backgroundColor: apiData.quotation_status.map((i) => i.color),
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

      const legendContainer = document.getElementById("quotation-legend");
      if (legendContainer) {
        legendContainer.innerHTML = apiData.quotation_status
          .map(
            (item) => `
          <div class="flex justify-between items-center">
            <div class="flex items-center"><span class="w-3 h-3 mr-2 rounded" style="background:${item.color}"></span> ${item.label}</div>
            <span>${item.value}%</span>
          </div>`
          )
          .join("");
      }
    }

    // Revenue Area Chart
    const canvasArea = document.getElementById("revenueChart");
    if (canvasArea) {
      new Chart(canvasArea.getContext("2d"), {
        type: "line",
        data: {
          labels: apiData.revenue_history.months,
          datasets: apiData.revenue_history.datasets.map((ds) => ({
            label: ds.label,
            data: ds.data,
            fill: true,
            backgroundColor: ds.color + "aa",
            borderColor: ds.color,
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.1,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              stacked: true,
              ticks: { callback: (v) => "Rp" + v + "M" },
              grid: { borderDash: [5, 5] },
            },
            x: { stacked: true, grid: { display: false } },
          },
          plugins: { legend: { display: false } },
        },
      });
    }

    // Growth Line Chart
    const canvasGrowth = document.getElementById("growthLineChart");
    if (canvasGrowth) {
      new Chart(canvasGrowth.getContext("2d"), {
        type: "line",
        data: {
          labels: apiData.growth_history.months,
          datasets: [
            {
              data: apiData.growth_history.data,
              borderColor: "#adcdec",
              backgroundColor: "#adcdec",
              borderWidth: 3,
              pointRadius: 4,
              tension: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: -100,
              max: 100,
              ticks: {
                stepSize: 50,
                callback: (v) => v + "%",
                font: { weight: "bold" },
                color: "#9ca3af",
              },
              grid: { color: "#f3f4f6", drawBorder: false },
            },
            x: {
              ticks: { font: { weight: "bold" }, color: "#374151" },
              grid: { display: false },
            },
          },
          plugins: { legend: { display: false } },
        },
      });
    }
  }

  function renderRankingCharts() {
    // Customers Bar
    const ctxCustBar = document.getElementById("customerBarChart");
    if (ctxCustBar) {
      new Chart(ctxCustBar.getContext("2d"), {
        type: "bar",
        data: {
          labels: apiData.customer_ranking.data.map((i) => i.name),
          datasets: [
            {
              data: apiData.customer_ranking.data.map((i) => i.value),
              backgroundColor: apiData.customer_ranking.data.map(
                (i) => i.color
              ),
              borderRadius: 4,
              barThickness: 20,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: {
                callback: (v) => "Rp " + (v / 1000).toLocaleString() + "K",
                font: { size: 8 },
              },
            },
            y: { ticks: { font: { size: 8, weight: "bold" } } },
          },
        },
      });
    }

    // Customer Share Pie
    const ctxCustPie = document.getElementById("customerPieChart");
    if (ctxCustPie) {
      new Chart(ctxCustPie.getContext("2d"), {
        type: "pie",
        data: {
          datasets: [
            {
              data: [
                apiData.customer_ranking.profit_share.top_5,
                apiData.customer_ranking.profit_share.others,
              ],
              backgroundColor: ["#1e3a8a", "#cbd5e1"],
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

    // Products Bar
    const ctxProdBar = document.getElementById("productBarChart");
    if (ctxProdBar) {
      new Chart(ctxProdBar.getContext("2d"), {
        type: "bar",
        data: {
          labels: apiData.product_ranking.data.map((i) => i.name),
          datasets: [
            {
              data: apiData.product_ranking.data.map((i) => i.value),
              backgroundColor: apiData.product_ranking.data.map((i) => i.color),
              borderRadius: 4,
              barThickness: 30,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: {
                callback: (v) => "Rp " + (v / 1000).toLocaleString() + "K",
                font: { size: 8 },
              },
            },
            y: { ticks: { font: { size: 8, weight: "bold" } } },
          },
        },
      });
    }

    // Product Share Pie
    const ctxProdPie = document.getElementById("productPieChart");
    if (ctxProdPie) {
      new Chart(ctxProdPie.getContext("2d"), {
        type: "pie",
        data: {
          datasets: [
            {
              data: [
                apiData.product_ranking.profit_share.top_3,
                apiData.product_ranking.profit_share.others,
              ],
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
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    initDashboard();
  } else {
    document.addEventListener("DOMContentLoaded", initDashboard);
  }
})();
