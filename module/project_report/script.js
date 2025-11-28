pagemodule = "Project Costing Dashboard";
subpagemodule = "";
renderHeader();
setDataType("project");
fetchAndUpdateData();

// Gunakan IIFE (Immediately Invoked Function Expression) agar variable tidak bentrok
(function () {
  // 1. DATA PROJECT (DUMMY DATA)
  const projectsData = [
    {
      id: 1,
      name: "Proteksi Relay",
      value: 15000000,
      plan: 5000000,
      actual: 4200000,
      status: "On Going",
    },
    {
      id: 2,
      name: "Install & Routing Cable",
      value: 25000000,
      plan: 8000000,
      actual: 8500000,
      status: "On Going",
    },
    {
      id: 3,
      name: "Pemasangan Power Meter",
      value: 12000000,
      plan: 3000000,
      actual: 2500000,
      status: "Completed",
    },
    {
      id: 4,
      name: "Maintenance Panel",
      value: 45000000,
      plan: 15000000,
      actual: 2000000,
      status: "Pending",
    },
    {
      id: 5,
      name: "Project Manual Testing",
      value: 8000000,
      plan: 2000000,
      actual: 1800000,
      status: "Completed",
    },
    {
      id: 6,
      name: "Event BEM El Rahma",
      value: 5000000,
      plan: 4000000,
      actual: 4100000,
      status: "Completed",
    },
  ];

  // Helper Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // --- MAIN FUNCTION ---
  window.initDashboard = function () {
    console.log("Loading Project Costing Dashboard (No Table)...");

    // A. Hitung KPI Cards
    calculateAndRenderKPI();

    // B. Render Charts
    if (typeof Chart !== "undefined") {
      renderCharts();
    } else {
      setTimeout(() => {
        if (typeof Chart !== "undefined") renderCharts();
      }, 1000);
    }
  };

  function calculateAndRenderKPI() {
    let totalProjects = projectsData.length;
    let totalValue = 0;
    let totalPlan = 0;
    let totalActual = 0;

    projectsData.forEach((p) => {
      totalValue += p.value;
      totalPlan += p.plan;
      totalActual += p.actual;
    });

    // Hitung Margin Global
    const totalMarginRp = totalValue - totalActual;
    const overallMarginPersen =
      totalValue > 0 ? (totalMarginRp / totalValue) * 100 : 0;

    // Render ke HTML Elements
    document.getElementById("cardTotalProject").innerText = totalProjects;
    document.getElementById("cardTotalValue").innerText =
      formatRupiah(totalValue);
    document.getElementById("cardTotalPlan").innerText =
      formatRupiah(totalPlan);
    document.getElementById("cardTotalActual").innerText =
      formatRupiah(totalActual);

    const elMargin = document.getElementById("cardOverallMargin");
    elMargin.innerText = overallMarginPersen.toFixed(1) + "%";

    if (overallMarginPersen < 20)
      elMargin.className = "text-2xl font-bold text-red-600 mt-1";
    else if (overallMarginPersen < 40)
      elMargin.className = "text-2xl font-bold text-yellow-600 mt-1";
    else elMargin.className = "text-2xl font-bold text-green-600 mt-1";
  }

  function renderCharts() {
    if (window.chartStatus) window.chartStatus.destroy();
    if (window.chartPlanVsActual) window.chartPlanVsActual.destroy();
    if (window.chartMargin) window.chartMargin.destroy();

    const labels = projectsData.map((p) => p.name);

    // --- CHART 1: Project By Status (Doughnut) ---
    const statusCounts = { "On Going": 0, Completed: 0, Pending: 0 };
    projectsData.forEach((p) => {
      if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;
      else statusCounts[p.status] = 1;
    });

    const ctxStatus = document.getElementById("statusChart").getContext("2d");
    window.chartStatus = new Chart(ctxStatus, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    // --- CHART 2: Plan vs Actual (Grouped Bar) ---
    const planData = projectsData.map((p) => p.plan);
    const actualData = projectsData.map((p) => p.actual);

    const ctxPva = document
      .getElementById("planVsActualChart")
      .getContext("2d");
    window.chartPlanVsActual = new Chart(ctxPva, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Plan Cost",
            data: planData,
            backgroundColor: "#E5E7EB",
            borderRadius: 4,
          },
          {
            label: "Actual Cost",
            data: actualData,
            backgroundColor: "#EF4444",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
          x: { grid: { display: false } },
        },
      },
    });

    // --- CHART 3: Margin per Project (Bar) ---
    const marginData = projectsData.map((p) => p.value - p.actual);
    const ctxMargin = document.getElementById("marginChart").getContext("2d");

    window.chartMargin = new Chart(ctxMargin, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Margin (IDR)",
            data: marginData,
            backgroundColor: "#10B981",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  // Jalankan init
  initDashboard();
})();
