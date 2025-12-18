pagemodule = "Project Performance Dashboard";
subpagemodule = "";
renderHeader();
setDataType("project");
fetchAndUpdateData();

// Gunakan IIFE (Immediately Invoked Function Expression) agar variable tidak bentrok
(function () {
  const projectsData = [
    {
      id: 1,
      name: "Project A",
      value: 11550000000,
      plan: 20000000,
      actual: 40000000,
      status: "Completed / Finished",
    },
    {
      id: 2,
      name: "Project B",
      value: 0,
      plan: 45000000,
      actual: 50000000,
      status: "Completed / Finished",
    },
    {
      id: 3,
      name: "Project C",
      value: 0,
      plan: 30000000,
      actual: 25000000,
      status: "Not Yet Sales",
    },
    {
      id: 4,
      name: "Project D",
      value: 0,
      plan: 48000000,
      actual: 30000000,
      status: "Not Yet Sales",
    },
    {
      id: 5,
      name: "Project E",
      value: 0,
      plan: 60000000,
      actual: 30000000,
      status: "In Progress / Ongoing",
    },
  ];

  const formatIDR = (num) => "Rp " + num.toLocaleString("id-ID");

  function initDashboard() {
    let totalValue = projectsData.reduce((a, b) => a + b.value, 0);
    let totalActual = projectsData.reduce((a, b) => a + b.actual, 0);
    let grossProfit = totalValue - totalActual;
    let marginPercent =
      totalValue > 0 ? (grossProfit / totalValue) * 100 : 25.97;

    document.getElementById("cardTotalProject").innerText = "121 Tasks";
    document.getElementById("cardTotalValue").innerText =
      formatIDR(11550000000);
    document.getElementById("cardTotalActual").innerText =
      formatIDR(8550000000);
    document.getElementById("cardTotalGross").innerText = formatIDR(3000000000);
    document.getElementById("cardOverallMargin").innerText =
      marginPercent.toFixed(2) + " %";

    renderCharts();
    renderTable();
  }

  function renderCharts() {
    // 1. Status Chart
    const statusConfig = {
      "Completed / Finished": { color: "#10B981", percent: 71.8 },
      "In Progress / Ongoing": { color: "#F97316", percent: 13.5 },
      "On Hold (Waiting for Schedule)": { color: "#3B82F6", percent: 11.5 },
      "Not Yet Sales": { color: "#BE123C", percent: 3.2 },
    };

    const ctxStatus = document.getElementById("statusChart").getContext("2d");
    new Chart(ctxStatus, {
      type: "pie",
      data: {
        labels: Object.keys(statusConfig),
        datasets: [
          {
            data: Object.values(statusConfig).map((v) => v.percent),
            backgroundColor: Object.values(statusConfig).map((v) => v.color),
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

    const legendContainer = document.getElementById("statusLegend");
    legendContainer.innerHTML = Object.entries(statusConfig)
      .map(
        ([key, val]) => `
            <div class="flex justify-between items-center">
                <div class="flex items-center"><span class="w-2 h-2 mr-2" style="background:${val.color}"></span>${key}</div>
                <span>${val.percent}%</span>
            </div>
        `
      )
      .join("");

    // 2. Plan vs Actual (Grouped Bar)
    const ctxPva = document
      .getElementById("planVsActualChart")
      .getContext("2d");
    new Chart(ctxPva, {
      type: "bar",
      data: {
        labels: projectsData.map((p) => p.name),
        datasets: [
          {
            label: "Plan",
            data: projectsData.map((p) => p.plan),
            backgroundColor: "#86EFAC",
            barPercentage: 0.6,
          },
          {
            label: "Actual",
            data: projectsData.map((p) => p.actual),
            backgroundColor: "#DC2626",
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { ticks: { callback: (v) => "Rp " + v / 1000000 + "M" } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function renderTable() {
    const tbody = document.getElementById("projectTableBody");
    tbody.innerHTML = projectsData
      .map(
        (p, i) => `
            <tr class="border-b text-center">
                <td class="px-4 py-3 border-r">${i + 1}</td>
                <td class="px-4 py-3 border-r text-left font-bold">${
                  p.name
                }</td>
                <td class="px-4 py-3 border-r">${formatIDR(p.plan)}</td>
                <td class="px-4 py-3 border-r">${formatIDR(p.actual)}</td>
                <td class="px-4 py-3 border-r">${formatIDR(
                  p.plan - p.actual
                )}</td>
                <td class="px-4 py-3 border-r">xx.xx %</td>
                <td class="px-4 py-3 font-bold">${p.status}</td>
            </tr>
        `
      )
      .join("");
  }

  initDashboard();
})();
