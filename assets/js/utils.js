let addFilter = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

let defaultPic = "https://pos.katib.id/src/img/product/productdefaults.png";
let sales = "https://pos.katib.id/src/img/product/productdefaults.png";

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("hidden");
  sidebar.classList.toggle("block");
}

function setActiveMenu(moduleName) {
  document.querySelectorAll("[data-module]")?.forEach((link) => {
    if (link.getAttribute("data-module") === moduleName) {
      link.classList.add("bg-blue-200");
    } else {
      link.classList.remove("bg-blue-200");
    }
  });
}

function toggleSubMenu(id) {
  const submenu = document.getElementById(id);
  const icon = document.getElementById(id + "Icon");
  submenu.classList.toggle("hidden");
  if (icon) icon.classList.toggle("rotate-180");
}

function showSuccessDialog(message) {
  showDialog("Success", message, "bg-green-500");
}

function showErrorDialog(message) {
  showDialog("Error", message, "bg-red-500");
}

function showDialog(title, message, colorClass) {
  const dialog = document.createElement("div");
  dialog.classList.add(
    "fixed",
    "inset-0",
    "z-50",
    "flex",
    "items-center",
    "justify-center",
    "bg-gray-500",
    "bg-opacity-75"
  );
  dialog.id = "customDialog";
  dialog.innerHTML = `
      <div class="rounded-lg bg-white p-6 text-center shadow-lg">
      <h2 class="mb-4 text-xl font-bold">${title}</h2>
      <p class="mb-4 text-gray-700">${message}</p>
      <button class="${colorClass} text-white px-4 py-2 rounded" onclick="closeDialog()">OK</button>
      </div>
  `;
  document.body.appendChild(dialog);
}

function closeDialog() {
  const dialog = document.getElementById("customDialog");
  if (dialog) {
    dialog.remove();
  }
}

function showAlert(title, message, type = "blue") {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    const container = document.createElement("div");
    container.id = "alertContainer";
    container.className = "fixed bottom-0 right-0 z-50 m-4";
    document.body.appendChild(container);
  }

  const alert = document.createElement("div");
  alert.className = `flex items-center p-4 mb-4 text-sm text-${type}-800 rounded-lg bg-${type}-50 bg-${type}-800 text-${type}-400`;
  alert.setAttribute("role", "alert");

  alert.innerHTML = `
      <svg class="me-3 inline h-4 w-4 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
      </svg>
      <span class="sr-only">${title}</span>
      <div>
          <span class="font-medium">${title}:</span> ${message}
      </div>
  `;

  document.getElementById("alertContainer").appendChild(alert);

  // Remove the alert after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

function showSuccessAlert(message) {
  showAlert("Success", message, "green");
}

function showErrorAlert(message) {
  showAlert("Error", message, "red");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
  } else {
    console.warn(`Modal with ID '${modalId}' not found.`);
  }
}

function debounce(func, delay) {
  let inDebounce;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
}

function copyLink(url) {
  if (navigator.clipboard && window.isSecureContext) {
    // Use Clipboard API
    navigator.clipboard
      .writeText(url)
      .then(() => {
        // Notify user that the link was copied with Swal.fire
        Swal.fire({
          icon: "success",
          title: "Copied!",
          text: "Link copied to clipboard!",
          showConfirmButton: false,
          timer: 1500,
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to copy the link.",
          showConfirmButton: true,
        });
      });
  }
}

// Utility function to populate dropdown elements from API data
async function populateDropdown(type, dropdownId, config = {}) {
  const {
    valueField = "id", // Field to use as option value
    textField = "name", // Field to use as option text
    defaultOption = "- Select an option -", // Default option text
    disabled = true, // Whether default option is disabled
    selectedValue = null, // Pre-selected value if any
  } = config;

  try {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
      throw new Error(`Dropdown with ID '${dropdownId}' not found`);
    }

    // Clear existing options
    dropdown.innerHTML = "";

    // Add default option
    if (defaultOption) {
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = defaultOption;
      defaultOpt.disabled = disabled;
      defaultOpt.selected = !selectedValue;
      dropdown.appendChild(defaultOpt);
    }

    // Fetch data from API
    const itemsData = await fetchList(type);
    const items = itemsData.listData;
    if (!Array.isArray(items)) {
      throw new Error(`Failed to fetch ${type} data`);
    }

    // Add options from data
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueField];
      option.textContent = item[textField];
      option.selected = item[valueField] === selectedValue;
      dropdown.appendChild(option);
    });

    return true;
  } catch (error) {
    console.error(`Error populating ${type} dropdown:`, error);
    showErrorAlert(`Failed to load ${type} options`);
    return false;
  }
}

function formatCurrency(value) {
  return `Rp. ${value.toLocaleString("id-ID")},-`;
}

function generateProductCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 13; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  document.getElementById("productcode").value = code;
}

function selectOptionById(elementId, value) {
  const selectElement = document.getElementById(elementId);
  if (selectElement) {
    let optionFound = false;
    for (let option of selectElement.options) {
      if (option.value == value) {
        option.selected = true;
        optionFound = true;
        break;
      }
    }
    if (!optionFound)
      console.warn(`ID ${value} not found in ${elementId} options`);
  }
}

function limitInputLength(input) {
  const maxLength = 13;
  if (input.value.length > maxLength) {
    input.value = input.value.slice(0, maxLength);
  }
}

async function fetchAndPopulateOptions(
  selectedCategoryId = null,
  selectedUnitId = null,
  selectedBrandId = null
) {
  try {
    const categoryResponse = await fetch(endpoints.product_category.list, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const categoryData = await categoryResponse.json();

    const unitResponse = await fetch(endpoints.product_unit.list, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const unitData = await unitResponse.json();

    const brandResponse = await fetch(endpoints.product_brand.list, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const brandData = await brandResponse.json();

    const categories = categoryData.listData || categoryData;
    const units = unitData.listData || unitData;
    const brands = brandData.listData || brandData;

    const categorySelect = document.getElementById("category_id");
    const unitSelect = document.getElementById("unit_id");
    const brandSelect = document.getElementById("brand_id");

    // Populate categories
    categorySelect.innerHTML =
      "<option disabled selected>Select Category</option>";
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category_id;
      option.textContent = cat.category;
      if (selectedCategoryId && cat.category_id == selectedCategoryId) {
        option.selected = true;
      }
      categorySelect.appendChild(option);
    });

    // Populate units
    unitSelect.innerHTML = "<option disabled selected>Select Unit</option>";
    units.forEach((ut) => {
      const option = document.createElement("option");
      option.value = ut.unit_id;
      option.textContent = ut.unit;
      if (selectedUnitId && ut.unit_id == selectedUnitId) {
        option.selected = true;
      }
      unitSelect.appendChild(option);
    });

    // Populate units
    brandSelect.innerHTML = "<option disabled selected>Select Brand</option>";
    brands.forEach((br) => {
      const option = document.createElement("option");
      option.value = br.brand_id;
      option.textContent = br.nama_brand;
      if (selectedBrandId && br.brand_id == selectedBrandId) {
        option.selected = true;
      }
      brandSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching options:", error);
  }
}
function formatNumber(angka) {
  if (isNaN(angka) || angka === "") return "0";
  return parseInt(angka).toLocaleString("id-ID");
}
