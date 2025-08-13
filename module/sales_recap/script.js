pagemoduleparent = "salesrecap";

selectedYear = new Date().getFullYear();
chartInstance = null;

async function fetchSalesData(year) {
  try {
    const res = await fetch(`${baseUrl}/marketing/recap_sales/${year}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return null;
  }
}

function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

function updateMetrics(data) {
  const {
    total_achievement,
    total_target,
    remaining_target,
    ongoing,
    won,
    loss,
  } = data.yearly_totals;

  document.getElementById(
    "metricAchievement"
  ).innerText = `Rp${total_achievement.toLocaleString("id-ID")}`;

  document.getElementById("metricAchievementRate").innerText = `${(
    (total_achievement / total_target) *
    100
  ).toFixed(1)}% of target`;

  document.getElementById(
    "metricRemaining"
  ).innerText = `Rp${remaining_target.toLocaleString("id-ID")}`;

  document.getElementById("metricRemainingRate").innerText = `${(
    (remaining_target / total_target) *
    100
  ).toFixed(1)}% to achieve`;

  // Tambahan: Update Qty & Nominal dari status won, ongoing, dan loss
  document.getElementById("wonQty").innerText = won.qty;
  document.getElementById("wonNominal").innerText = formatCurrency(won.nominal);

  document.getElementById("ongoingQty").innerText = ongoing.qty;
  document.getElementById("ongoingNominal").innerText = formatCurrency(
    ongoing.nominal
  );

  document.getElementById("lossQty").innerText = loss.qty;
  document.getElementById("lossNominal").innerText = formatCurrency(
    loss.nominal
  );
}

function renderChart(data) {
  const colors = [
    "#1e40af",
    "#3b82f6",
    "#93c5fd",
    "#f59e0b",
    "#10b981",
    "#ef4444",
  ];
  const labels = data.chart.months;
  const typeKeys = data.chart.types;

  const barDatasets = typeKeys.map((type, idx) => ({
    type: "bar",
    label: type,
    data: data.table.rows.map((r) => r[type] || 0),
    backgroundColor: colors[idx % colors.length],
    borderRadius: 4,
    order: 1,
  }));

  const trendDataset = {
    type: "line",
    label: "Total",
    data: data.chart.lineData,
    borderColor: "#111827",
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 4,
    fill: false,
    tension: 0.25,
    order: 2,
  };

  const ctxBar = document.getElementById("chartMarketingBar");
  if (ctxBar) {
    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels,
        datasets: [...barDatasets, trendDataset],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, padding: 16 },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: Rp${Number(
                  context.raw || 0
                ).toLocaleString("id-ID")}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "Rp" + (value / 1_000_000).toFixed(1) + "jt",
            },
            grid: { drawBorder: false },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }
}

function renderTable(data) {
  const tableEl = document.getElementById("salesRecapTable");

  let thead = `<thead class="bg-gray-50">
    <tr>
      <th class="border px-3 py-2 text-left">Type</th>`;
  data.table.rows.forEach((row) => {
    thead += `<th class="border px-3 py-2">${row.month}</th>`;
  });
  thead += `<th class="border px-3 py-2">Total</th></tr></thead>`;

  const types = data.table.columns
    .filter((c) => c.key !== "month" && c.key !== "total")
    .map((c) => c.key);

  let tbody = `<tbody>`;
  types.forEach((typeKey) => {
    const label =
      data.table.columns.find((c) => c.key === typeKey)?.label || typeKey;
    tbody += `<tr class="hover:bg-gray-50">
      <td class="border px-3 py-2 font-medium">${label}</td>`;
    data.table.rows.forEach((row) => {
      const val = row[typeKey] || 0;
      tbody += `<td class="border px-3 py-2 text-right">Rp${val.toLocaleString(
        "id-ID"
      )}</td>`;
    });

    const totalPerType = data.table.rows.reduce(
      (sum, row) => sum + (row[typeKey] || 0),
      0
    );
    tbody += `<td class="border px-3 py-2 font-semibold text-right">Rp${totalPerType.toLocaleString(
      "id-ID"
    )}</td></tr>`;
  });

  tbody += `<tr class="bg-gray-100 font-bold">
    <td class="border px-3 py-2">TOTAL</td>`;
  data.table.rows.forEach((row) => {
    const totalMonth = types.reduce((sum, key) => sum + (row[key] || 0), 0);
    tbody += `<td class="border px-3 py-2 text-right">Rp${totalMonth.toLocaleString(
      "id-ID"
    )}</td>`;
  });

  const grandTotal = types.reduce(
    (sum, key) =>
      sum + data.table.rows.reduce((s, row) => s + (row[key] || 0), 0),
    0
  );
  tbody += `<td class="border px-3 py-2 text-right">Rp${grandTotal.toLocaleString(
    "id-ID"
  )}</td></tr>`;
  tbody += `</tbody>`;

  tableEl.innerHTML = thead + tbody;
}

async function renderSalesRecap(year = selectedYear) {
  const result = await fetchSalesData(year);
  if (!result?.data) return;

  updateMetrics(result.data);
  renderChart(result.data);
  renderTable(result.data);
}

function setupYearFilter() {
  const filterButton = document.getElementById("filterButton");
  const yearDropdown = document.getElementById("yearDropdown");
  if (!filterButton || !yearDropdown) return;

  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 5; year--) {
    const option = document.createElement("button");
    option.type = "button";
    option.className =
      "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors";
    option.textContent = year;
    option.addEventListener("click", () => {
      selectedYear = year;
      updateFilterButton(year);
      yearDropdown.classList.add("hidden");
      renderSalesRecap(year);
    });
    yearDropdown.appendChild(option);
  }

  updateFilterButton(selectedYear);

  filterButton.addEventListener("click", (e) => {
    e.stopPropagation();
    yearDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    yearDropdown.classList.add("hidden");
  });
}

function updateFilterButton(year) {
  const filterButton = document.getElementById("filterButton");
  if (filterButton) {
    filterButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      ${year}
    `;
  }
}

if (pagemoduleparent === "salesrecap") {
  setupYearFilter();
  renderSalesRecap();
}
