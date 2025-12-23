const user = JSON.parse(localStorage.getItem("user") || "{}");
// const user_detail = JSON.parse(localStorage.getItem("user_detail") || "{}");
const company = JSON.parse(localStorage.getItem("company") || "{}");

const owner_id = user.owner_id;
const user_id = user.user_id;
const status_active = user.status_active;
const level = user.level;
const username = user.username || user.phone;
const nama = user.name || user.full_name || "";
const logo = company.logo;
const business_place = company.business_place;
const address = company.address;
const company_phone = company.company_phone;
const printer_setting = company.printer_setting;

const default_module = "dashboard";

let currentScript = null;
let formHtml = null;
let h1Element = null;
let campaignTitle = null;
let responseData = "";
let loadingStart = 0;
let pagemodule = "";
let subpagemodule = "";
let subCategories = [];
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");
const formattedDate = `${year}-${month}-${day}`;
let cashier_id = 0;
let unitDebounceTimer;
let picDebounceTimer;
let clientDebounceTimer;
let vendorDebounceTimer;
const AUTOSAVE_KEY = "autosave_quotation_draft";




let current_date = formattedDate;

// Function to load JavaScript files dynamically
function loadScript(src, callback) {
  const script = document.createElement("script");
  script.src = src;
  script.onload = callback;
  script.onerror = () => console.error(`Error loading script: ${src}`);
  document.body.appendChild(script);
}

const scriptsToLoad = [
  `./assets/js/utils.js?v=${new Date().getTime()}`,
  `./assets/js/api.js?v=${new Date().getTime()}`,
  `./assets/js/table.js?v=${new Date().getTime()}`,
];

if (!owner_id || !user_id) {
  window.location.href = "login.html";
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function finance(value) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function setTodayDate() {
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("tanggal").value = `${yyyy}-${mm}-${dd}`;
}

function renderCompanyInfo() {
  document.getElementById("companyName").textContent = user.company || "-";
  document.getElementById("companyTagline").textContent = user.tagline || "";
  document.getElementById("companyAddress").innerHTML =
    user.address?.replace(/\n/g, "<br>") || "-";

  const socmed = document.getElementById("companySocial");
  socmed.innerHTML = "";
  if (user.instagram) {
    socmed.innerHTML += `<p>Instagram: ${user.instagram}</p>`;
  }
  if (user.other_sosmed) {
    socmed.innerHTML += `<p>Instagram: ${user.other_sosmed}</p>`;
  }
}

function openLink(baseURL) {
  // Retrieve all localStorage data from the current tab
  const data = {
    owner_id: localStorage.getItem("owner_id"),
    user_id: localStorage.getItem("user_id"),
    status_active: localStorage.getItem("status_active"),
    level: localStorage.getItem("level"),
    nama: localStorage.getItem("nama"),
    logo: localStorage.getItem("logo"),
    business_place: localStorage.getItem("business_place"),
    address: localStorage.getItem("address"),
    company_phone: localStorage.getItem("company_phone"),
    printer_setting: localStorage.getItem("printer_setting"), // Keep as a string
  };

  // Open the new tab
  const newWindow = window.open(baseURL, "_blank");

  // Wait until the new tab is fully loaded
  newWindow.onload = function () {
    // Once the new tab is loaded, set the localStorage data
    Object.keys(data).forEach((key) => {
      if (data[key] !== null) {
        newWindow.localStorage.setItem(key, data[key]);
      }
    });

    // Optional: Log to verify that data is being set
    // console.log("Session data set in new tab:", data);
  };
}

async function loadSection(sectionPath) {
  try {
    const response = await fetch(sectionPath);
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error(`Failed to load ${sectionPath}`);
    }
  } catch (error) {
    console.error(error);
    return `<div>Error loading ${sectionPath}</div>`;
  }
}

function loadScript(src, callback) {
  const script = document.createElement("script");
  script.src = src;
  script.onload = callback;
  script.onerror = () => console.error(`Error loading script: ${src}`);
  document.body.appendChild(script);
}

scriptsToLoad.forEach((script) =>
  loadScript(`${script}?v=${new Date().getTime()}`, () => {})
);

function showUserName() {
  const welcomeMessageSpan = document.getElementById("nameUser");
  const mobileNameSpan = document.getElementById("mobileNameUser");

  const displayName = nama || username || "User";

  if (welcomeMessageSpan) {
    welcomeMessageSpan.textContent = `Hi, ${displayName} 👋`;
  }

  if (mobileNameSpan) {
    mobileNameSpan.textContent = displayName.charAt(0).toUpperCase();
  }
}

async function loadAppSections() {
  const sectionDataDiv = document.getElementById("section-data");

  const [headNavbar, sideNavbar, mainContent, footNavbar, footer] =
    await Promise.all([
      loadSection(`section/headnavbar.html?v=${new Date().getTime()}`),
      loadSection(`section/sidenavbar.html?v=${new Date().getTime()}`),
      loadSection(`section/maincontent.html?v=${new Date().getTime()}`),
      loadSection(`section/footnavbar.html?v=${new Date().getTime()}`),
      loadSection(`section/footer.html?v=${new Date().getTime()}`),
    ]);

  sectionDataDiv.innerHTML = `${headNavbar}${sideNavbar}${mainContent}${footNavbar}${footer}`;
  modedev();
  addSideNavListeners();

  loadScript(`./assets/js/section.js?v=${new Date().getTime()}`, () => {});
  showUserName();
  loadModuleContent(default_module);
}

function addSideNavListeners() {
  // const links = document.querySelectorAll('nav div ul li a');
  const links = document.querySelectorAll("nav a");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const module = link.getAttribute("data-module");
      loadModuleContent(module);
    });
  });
}

function showLoading() {
  loadingStart = Date.now();
  document.getElementById("loadingOverlay")?.classList.remove("hidden");
}

function hideLoading() {
  const elapsed = Date.now() - loadingStart;
  const delay = Math.max(0, 500 - elapsed); // pastikan minimal 1 detik

  setTimeout(() => {
    document.getElementById("loadingOverlay")?.classList.add("hidden");
  }, delay);
}

async function loadModuleContent(module, Id, Detail) {
  try {
    // showLoading();
    setActiveMenu(module);
    currentDataSearch = "";

    // 1. Load HTML
    const htmlResponse = await fetch(
      `./module/${module}/data.html?v=${Date.now()}`
    );
    if (!htmlResponse.ok) {
      throw new Error(`Gagal memuat HTML untuk modul: ${module}`);
    }

    const htmlContent = await htmlResponse.text();
    document.getElementById("content").innerHTML = htmlContent;

    // 2. Set Global Variables (PENTING: Sebelum load script)
    // Pastikan nilai null jika undefined
    window.detail_id = Id || null;
    window.detail_desc = Detail || null;

    // Debugging: Cek apakah ID terbaca
    console.log(
      `Loading Module: ${module}, ID: ${window.detail_id}, Desc: ${window.detail_desc}`
    );

    // 3. Hapus script lama
    if (currentScript) {
      document.body.removeChild(currentScript);
      currentScript = null; // Reset variable
    }

    // 4. Load Script Baru
    await new Promise((resolve, reject) => {
      currentScript = document.createElement("script");
      currentScript.src = `./module/${module}/script.js?v=${Date.now()}`;

      currentScript.onload = () => {
        // Karena modul baru menggunakan IIFE (Self-Executing),
        // kita TIDAK PERLU memanggil fungsi init secara manual di sini.
        // Script akan otomatis jalan setelah di-load.

        // Logika legacy untuk modul LAMA (Invoice, Quotation Log) biarkan saja
        if (
          module === "invoice_detail" &&
          typeof loadDetailSales === "function"
        ) {
          loadDetailSales(Id, Detail);
        } else if (
          module === "invoice_detail_turnkey" &&
          typeof loadDetailSalesTurnKey === "function"
        ) {
          loadDetailSalesTurnKey(Id, Detail);
        } else if (
          (module === "quotation_log_detail" ||
            module === "quotation_log_turnkey") &&
          typeof loadPesananData === "function"
        ) {
          loadPesananData(Id);
        }

        resolve();
      };

      currentScript.onerror = () => {
        console.error(`Gagal memuat script: ${module}`);
        reject();
      };

      document.body.appendChild(currentScript);
    });
  } catch (error) {
    console.error(error);
    document.getElementById(
      "content"
    ).innerHTML = `<p class="text-red-600">Terjadi kesalahan saat memuat modul: ${module}</p>`;
  } finally {
    hideLoading();
  }
}

function collapseSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  document
    .querySelectorAll("#sidebar .menu-text")
    .forEach((el) => el.classList.add("hidden"));
  sidebar.classList.add("w-16");
  sidebar.classList.remove("w-64");
  mainContent.classList.add("md:ml-16");
  mainContent.classList.remove("md:ml-64");
}

window.onload = loadAppSections;
