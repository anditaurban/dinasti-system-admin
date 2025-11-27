pagemodule = "Project Finance Dashboard";
subpagemodule = "";
renderHeader();
setDataType("project");
fetchAndUpdateData();

// Gunakan IIFE (Immediately Invoked Function Expression) agar variable tidak bentrok
(function () {
  // --- 1. DATA DUMMY ---
  const transactionsData = [
    {
      id: 1,
      date: "2025-11-01",
      type: "Income",
      category: "Project DP",
      description: "DP Website PT Sigma",
      contact: "PT Sigma Media",
      amount: 5500000,
    },
    {
      id: 2,
      date: "2025-11-03",
      type: "Outcome",
      category: "Operational",
      description: "Sewa Server AWS",
      contact: "Amazon Web Services",
      amount: 1200000,
    },
    {
      id: 3,
      date: "2025-11-05",
      type: "Income",
      category: "Pelunasan",
      description: "Pelunasan App Booking",
      contact: "Bapak Budi",
      amount: 4500000,
    },
    {
      id: 4,
      date: "2025-11-10",
      type: "Outcome",
      category: "Gaji",
      description: "Gaji Freelance FE",
      contact: "Freelancer A",
      amount: 2500000,
    },
    {
      id: 5,
      date: "2025-11-12",
      type: "Outcome",
      category: "Tools",
      description: "Langganan Adobe CC",
      contact: "Adobe Systems",
      amount: 800000,
    },
    {
      id: 6,
      date: "2025-11-15",
      type: "Income",
      category: "Payment",
      description: "Maintenance Fee",
      contact: "PT Sigma Media",
      amount: 1500000,
    },
    {
      id: 7,
      date: "2025-11-20",
      type: "Outcome",
      category: "Material",
      description: "Harddisk Eksternal",
      contact: "Toko Komputer",
      amount: 1100000,
    },
  ];

  // --- 2. FORMAT RUPIAH ---
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // --- 3. INIT LOGIC (Langsung Jalankan) ---
  function initDashboard() {
    console.log("Dashboard Script Loaded & Running..."); // Debugging

    // A. Render Cards
    renderCards();

    // B. Render Table
    renderTableData();

    // C. Render Top Contacts
    renderTopContacts(transactionsData);

    // D. Render Charts (Cek apakah library sudah ada)
    if (typeof Chart !== "undefined") {
      renderCharts(transactionsData);
    } else {
      console.error("Chart.js belum terload! Pastikan ada di scriptsToLoad.");
      // Coba retry jika internet lambat loading CDN
      setTimeout(() => {
        if (typeof Chart !== "undefined") renderCharts(transactionsData);
      }, 1000);
    }
  }

  function renderCards() {
    let totalIncome = 0;
    let totalOutcome = 0;

    transactionsData.forEach((trx) => {
      if (trx.type === "Income") totalIncome += trx.amount;
      else totalOutcome += trx.amount;
    });

    const netCashflow = totalIncome - totalOutcome;

    // Pastikan ID element sesuai dengan yang ada di data.html
    const elIncome = document.getElementById("cardIncome");
    const elOutcome = document.getElementById("cardOutcome");
    const elNet = document.getElementById("cardNetFlow");
    const elTrx = document.getElementById("cardTransactions");

    if (elIncome) elIncome.innerText = formatRupiah(totalIncome);
    if (elOutcome) elOutcome.innerText = formatRupiah(totalOutcome);
    if (elTrx) elTrx.innerText = transactionsData.length + " Transaksi";

    if (elNet) {
      elNet.innerText =
        (netCashflow >= 0 ? "+ " : "") + formatRupiah(netCashflow);
      elNet.className =
        netCashflow >= 0
          ? "text-2xl font-bold text-teal-600"
          : "text-2xl font-bold text-red-600";
    }
  }

  function renderTableData() {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    transactionsData.forEach((trx) => {
      const isIncome = trx.type === "Income";
      const colorClass = isIncome ? "text-green-600" : "text-red-600";
      const bgClass = isIncome
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
      const sign = isIncome ? "+ " : "- ";

      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50 border-b";
      row.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-gray-700">${
                  trx.date
                }</td>
                <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs font-semibold ${bgClass}">${
        trx.type
      }</span></td>
                <td class="px-4 py-3 text-gray-600">${trx.category}</td>
                <td class="px-4 py-3 text-gray-800 font-medium">${
                  trx.description
                }</td>
                <td class="px-4 py-3 text-gray-600">${trx.contact}</td>
                <td class="px-4 py-3 text-right font-bold ${colorClass}">${sign}${formatRupiah(
        trx.amount
      )}</td>
            `;
      tableBody.appendChild(row);
    });
  }

  function renderTopContacts(data) {
    const clientStats = {};
    const vendorStats = {};

    data.forEach((t) => {
      if (t.type === "Income")
        clientStats[t.contact] = (clientStats[t.contact] || 0) + t.amount;
      else vendorStats[t.contact] = (vendorStats[t.contact] || 0) + t.amount;
    });

    const populateList = (statsObj, elementId, colorClass) => {
      const listEl = document.getElementById(elementId);
      if (!listEl) return;
      const sorted = Object.entries(statsObj)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      listEl.innerHTML = sorted
        .map(
          ([name, val]) => `
                <li class="flex justify-between items-center text-sm border-b pb-2 last:border-0 mb-2">
                    <span class="text-gray-700 font-medium">${name}</span>
                    <span class="${colorClass} font-bold">${formatRupiah(
            val
          )}</span>
                </li>
            `
        )
        .join("");
    };

    populateList(clientStats, "topClientsList", "text-blue-600");
    populateList(vendorStats, "topVendorsList", "text-red-600");
  }

  function renderCharts(data) {
    // Hancurkan chart lama jika ada (untuk mencegah double render saat pindah menu)
    // Kita simpan instance di window agar bisa diakses global sementara
    if (window.currentMainChart) window.currentMainChart.destroy();
    if (window.currentIncomePie) window.currentIncomePie.destroy();
    if (window.currentOutcomePie) window.currentOutcomePie.destroy();

    // 1. Data Prep
    const dates = [...new Set(data.map((d) => d.date))].sort();
    const incomes = dates.map((d) =>
      data
        .filter((t) => t.date === d && t.type === "Income")
        .reduce((a, b) => a + b.amount, 0)
    );
    const outcomes = dates.map((d) =>
      data
        .filter((t) => t.date === d && t.type === "Outcome")
        .reduce((a, b) => a + b.amount, 0)
    );

    // 2. Main Chart
    const ctxMain = document.getElementById("mainChart");
    if (ctxMain) {
      window.currentMainChart = new Chart(ctxMain, {
        type: "bar",
        data: {
          labels: dates,
          datasets: [
            { label: "Income", data: incomes, backgroundColor: "#3B82F6" },
            { label: "Outcome", data: outcomes, backgroundColor: "#EF4444" },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }

    // 3. Pie Charts Helper
    const renderPie = (type, canvasId, colors, windowVar) => {
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;
      const cats = {};
      data
        .filter((t) => t.type === type)
        .forEach(
          (t) => (cats[t.category] = (cats[t.category] || 0) + t.amount)
        );

      window[windowVar] = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: Object.keys(cats),
          datasets: [{ data: Object.values(cats), backgroundColor: colors }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
        },
      });
    };

    renderPie(
      "Income",
      "incomePieChart",
      ["#3B82F6", "#10B981", "#6366F1"],
      "currentIncomePie"
    );
    renderPie(
      "Outcome",
      "outcomePieChart",
      ["#EF4444", "#F59E0B", "#8B5CF6"],
      "currentOutcomePie"
    );
  }

  // --- 4. EXECUTE ---
  // Panggil fungsi init langsung!
  initDashboard();
})();
