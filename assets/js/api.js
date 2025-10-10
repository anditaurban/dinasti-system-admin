const isLocalhost = ['localhost', '127.0.0.1', 'dev.dinastielektrik.id'].includes(window.location.hostname);
const mode = isLocalhost ? 'development' : 'production';
const baseUrl = mode === 'development'
  ? 'https://dev.dinastielektrik.cloud'
  : 'https://prod.dinastielektrik.cloud';
const API_TOKEN = 'e29c2e3db5f5299dc954eae580893689c35ecde79f40213365f56fb54850f9b1';



let url = null;
let currentDataSearch = "";
let currentPeriod = "weekly"; // default
let chartType = "bar"; // default (bisa bar atau line)

const defaultState = {
  currentPage: 1,
  totalPages: 1,
  totalRecords: 0,
  isSubmitting: false,
};

function modedev() {
  const devModeElement = document.getElementById("devmode");
  if (mode === "development") {
    devModeElement.classList.remove("hidden");
    devModeElement.textContent = "<dev> Development Mode </dev>";
  }
}

const endpointList = [
  "sales",
  "sales_unpaid",
  "sales_receipt",
  "sales_package",
  "sales_detail",
  "sales_detail_log",
  "sales_receipt",
  "project",
  "invoice",
  "invoice_detail",
  "project_detail",
  "package_slip",
  "sales_shipment",
  "shipment_slip",
  "shipment_label",
  "product",
  "sales_invoice",
  "product_bundling",
  "user",
  "client",
  "employee",
  "business_category",
  "account_receivable",
  "account_payable",
  "cashflow",
  
];

const state = endpointList.reduce((acc, type) => {
  acc[type] = { ...defaultState };
  return acc;
}, {});

// generate endpoints otomatis
const endpoints = endpointList.reduce((acc, type) => {
  acc[type] = {
    table: `${baseUrl}/table/${type}/${owner_id}`,
    list: `${baseUrl}/list/${type}/${owner_id}`,
    detail: `${baseUrl}/detail/${type}`,
    update: `${baseUrl}/update/${type}`,
    create: `${baseUrl}/add/${type}`,
    delete: `${baseUrl}/delete/${type}`,
  };
  return acc;
}, {});

async function loadLogoWithAuth(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`
      }
    });
    if (!res.ok) throw new Error("Gagal load logo");

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const logoPreview = document.getElementById("logo_preview");
    logoPreview.src = objectUrl;
    logoPreview.classList.remove("hidden");
  } catch (err) {
    console.error("Error load logo:", err);
  }
}



async function fetchData(type, page = 1, id = null) {
  try {
    let url = id
      ? `${endpoints[type].table}/${id}/${page}?search=${currentDataSearch}`
      : `${endpoints[type].table}/${page}?search=${currentDataSearch}`;
    // console.log(url);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return { data: [], totalRecords: 0, totalPages: 0 };
  }
}

async function fetchList(type) {
  try {
    const url = `${endpoints[type].list}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!response.ok)
      throw new Error(`Failed to fetch ${type} data: ${response.statusText}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error fetching ${type} list:`, error);
    return [];
  }
}

async function fetchById(type, id) {
  try {
    const response = await fetch(`${endpoints[type].detail}/${id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} by ID:`, error);
    return null;
  }
}

async function updateData(type, id, payload) {
  try {
    const response = await fetch(`${endpoints[type].update}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${type} data:`, error);
    return null;
  }
}

async function createData(type, payload) {
  try {
    const body = JSON.stringify({ owner_id, ...payload });
    const response = await fetch(`${endpoints[type].create}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    return null;
  }
}

async function createDataWithFile(type, payload) {
  try {
    const formDataFile = new FormData();

    // Append all payload fields to FormData
    for (const key in payload) {
      formDataFile.append(key, payload[key]);
    }

    // Append owner_id separately if needed
    if (owner_id) {
      formDataFile.append("owner_id", owner_id);
    }

    const response = await fetch(`${endpoints[type].create}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        // **DO NOT** manually set `Content-Type`, the browser will handle it automatically
      },
      body: formDataFile,
    });

    if (!response.ok) throw new Error("Network response was not ok");

    return await response.json();
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    return null;
  }
}

async function deleteData(type, id) {
  try {
    const response = await fetch(`${endpoints[type].delete}/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    // console.log("Response JSON:", data); // <-- Tambah ini
    return data;
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    return null;
  }
}
