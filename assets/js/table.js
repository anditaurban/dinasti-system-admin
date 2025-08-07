let dataItems = null;
let colSpanCount = null;
let currentDataType = null;
let debounceTimeout;
let accountOptions = [];
let itemCounter = 0;
let daftarKlien = [];
let customerList = [];
let produkList = [];
let regionList = [];

function setDataType(type) {
  currentDataType = type;
}

function debounceSearch() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    searchData();
  }, 500);
}

async function searchData() {
  const searchInput = document.getElementById("searchInput").value;

  try {
    if (searchInput.length > 0) {
      currentDataSearch = searchInput;
    } else {
      currentDataSearch = "";
    }

    fetchAndUpdateData(detail_id);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// ---------------------------------------
// LOAD DATA FUNCTIONS
// ---------------------------------------

async function fetchAndUpdateData(id = null) {
  const tableBodyId = "tableBody";
  showLoadingSpinner(document.querySelector(`#${tableBodyId}`));

  try {
    const response = await fetchData(
      currentDataType,
      state[currentDataType].currentPage,
      id
    );
    if (!response || !response.tableData)
      throw new Error("Invalid response from the API");

    dataItems = response.tableData;
    updateState(response);

    setTimeout(() => {
      loadData();
      updatePagination();
    }, 500);
  } catch (error) {
    showErrorLoadingData(document.querySelector(`#${tableBodyId}`));
  }
}

function showLoadingSpinner(tableBody) {
  const colSpanCount =
    tableBody.parentElement.querySelector("thead tr").children.length;
  tableBody.innerHTML = `
      <tr>
        <td colspan="${colSpanCount}">
          <div class="flex justify-center items-center py-6">
            <div class="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </td>
      </tr>
    `;
}

function getStatusClass(status) {
  switch (status.toLowerCase()) {
    case "on progress":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function updateState(response) {
  state[currentDataType].totalPages = response.totalPages;
  state[currentDataType].totalRecords = response.totalRecords;
}

function showErrorLoadingData(tableBody) {
  setTimeout(() => {
    tableBody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; color: red; font-weight: bold;">Error Loading Data</td></tr>`;
  }, 500);
}

function loadData() {
  const tableBody = document.querySelector("#tableBody");
  if (!tableBody) {
    console.error(`Table body element not found for ${currentDataType}`);
    return;
  }

  tableBody.innerHTML = "";
  if (!dataItems || dataItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; color: red; font-weight: bold;">No Data Available</td></tr>`;
    return;
  }

  dataItems.forEach((item, index) => {
    row = document.createElement("tr");

    const html = window.rowTemplate(item, index);
    const hasDropdown = html.includes("dropdown-menu");
    const action = hasDropdown;

    // Tambahkan class & event jika ada dropdown
    if (action) {
      row.classList.add(
        "hover:bg-gray-50",
        "cursor-pointer",
        "transition",
        "relative"
      );
      row.onclick = function (e) {
        toggleDropdown(this, e);
      };
    }
    row.innerHTML = window.rowTemplate(item, index);
    tableBody.appendChild(row);
  });
}

function getTableBody() {
  switch (currentDataType) {
    case "income":
      return document.querySelector("#incomeTableBody");
    case "expense":
      return document.querySelector("#expenseTableBody");
    default:
      return document.querySelector("#tableBody");
  }
}

function updatePagination(paginationContainer, onPageChange) {
  const { currentPage, totalPages, totalRecords } = state[currentDataType];

  paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  // Buat wrapper utama yang akan membagi kiri-kanan
  const wrapper = document.createElement("div");
  wrapper.className =
    "w-full flex justify-between items-center flex-wrap gap-2 text-sm text-gray-600";

  // Kiri: info jumlah data
  const info = document.createElement("div");
  info.textContent = `Total Data: ${totalRecords} | Halaman ${currentPage} dari ${totalPages}`;
  wrapper.appendChild(info);

  // Kanan: tombol navigasi
  const nav = document.createElement("div");
  nav.className = "flex flex-wrap gap-1";

  function createButton(text, disabled, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `px-3 py-1 rounded border text-sm 
      ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white hover:bg-blue-100 text-blue-700 border-blue-500"
      }`;
    btn.disabled = disabled;
    if (!disabled && typeof onClick === "function")
      btn.addEventListener("click", onClick);
    return btn;
  }

  nav.appendChild(
    createButton("« First", currentPage === 1, () => onPageChange(1))
  );
  nav.appendChild(
    createButton("‹ Prev", currentPage === 1, () =>
      onPageChange(currentPage - 1)
    )
  );

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    const btn = createButton(i, false, () => onPageChange(i));
    if (isActive) {
      btn.className += " font-bold bg-blue-500 text-white border-blue-700";
    }
    nav.appendChild(btn);
  }

  nav.appendChild(
    createButton("Next ›", currentPage === totalPages, () =>
      onPageChange(currentPage + 1)
    )
  );
  nav.appendChild(
    createButton("Last »", currentPage === totalPages, () =>
      onPageChange(totalPages)
    )
  );

  wrapper.appendChild(nav);
  paginationContainer.appendChild(wrapper);

  //mobile
  const pageSelect = document.getElementById("pageSelect");
  if (!pageSelect) return;

  // Kosongkan dulu
  pageSelect.innerHTML = "";

  // Tambahkan opsi halaman
  for (let i = 1; i <= totalPages; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Halaman ${i}`;
    if (i === currentPage) option.selected = true;
    pageSelect.appendChild(option);
  }

  // Tambahkan event onChange
  pageSelect.onchange = function () {
    const selectedPage = parseInt(this.value);
    if (!isNaN(selectedPage)) {
      onPageChange(selectedPage); // Fungsi pagination utama
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll ke atas
    }
  };

  function onPageChange(page) {
    // Update state halaman saat ini
    if (!state[currentDataType]) {
      state[currentDataType] = {};
    }
    state[currentDataType].currentPage = page;
    fetchAndUpdateData(detail_id);
  }
}

function showFormModal() {
  Swal.fire({
    title: "Create New Data",
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const fileInput = document.querySelector("#file");
      if (fileInput && fileInput.files.length > 0) {
        return getFormDataFile();
      } else {
        return getFormData();
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const fileInput = document.querySelector("#file");
      if (fileInput && fileInput.files.length > 0) {
        handleCreateFile(result.value, detail_id); // Handle with file
      } else {
        handleCreate(result.value, detail_id); // Handle without file
      }
      currentDataSearch = "";
    }
  });
}

function getFormData() {
  const formElement = document.querySelector("#dataform");
  if (!formElement) {
    throw new Error("Form not found");
  }

  const formData = new FormData(formElement);
  const dataObj = {};
  const alwaysString = ["phone" || "whatsapp"]; // ← field yang jangan di-parse ke Number

  for (const [key, value] of formData.entries()) {
    const isArrayField = key.endsWith("[]");
    const cleanKey = isArrayField ? key.slice(0, -2) : key;

    const parsedValue =
      !alwaysString.includes(cleanKey) && !isNaN(value) && value.trim() !== ""
        ? Number(value)
        : value;

    if (isArrayField) {
      if (!dataObj[cleanKey]) {
        dataObj[cleanKey] = [];
      }
      dataObj[cleanKey].push(parsedValue);
    } else {
      dataObj[cleanKey] = parsedValue;
    }
  }

  if (!validateFormData(dataObj)) {
    return false;
  } else {
    return dataObj;
  }
}

function handleCreate(formData, detail_id) {
  Swal.showLoading();
  console.log(formData);
  const createUrl = endpoints[currentDataType].create;
  console.log(createUrl);
  formData.owner_id = owner_id;
  fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => handleCreateResponse(data, detail_id))
    .catch(() => showErrorAlert("Failed to save data. Please try again."));
}

function getFormDataFile() {
  const formElement = document.querySelector("#dataformfile");
  if (!formElement) {
    throw new Error("Form not found");
  }

  const formDataFile = new FormData(formElement);

  if (!validateFormData(formDataFile)) {
    return false;
  }

  return formDataFile;
}

function handleCreateFile(formDataFile, detail_id) {
  Swal.showLoading();
  const createUrl = endpoints[currentDataType].create;

  fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: formDataFile,
  })
    .then((response) => response.json())
    .then((data) => handleCreateResponse(data, detail_id))
    .catch(() => showErrorAlert("Failed to save data. Please try again."));
}

function handleCreateResponse(data, detail_id) {
  const message = data.data.message;
  const isSuccess = message === "Data successfully added";

  Swal.fire({
    icon: isSuccess ? "success" : "error",
    title: isSuccess ? "Success" : "Failed",
    text: message,
  }).then(() => {
    fetchAndUpdateData(detail_id);
  });
}

function toggleDropdown(row, event) {
  const dropdown = row.querySelector(".dropdown-menu");

  document.querySelectorAll(".dropdown-menu").forEach((el) => {
    if (el !== dropdown) el.classList.add("hidden");
  });

  const x = event.clientX;
  const y = event.clientY;

  dropdown.style.left = `${x}px`;
  dropdown.style.top = `${y}px`;

  if (dropdown) dropdown.classList.toggle("hidden");
}

document.addEventListener("click", function (e) {
  if (!e.target.closest("tr")) {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((el) => el.classList.add("hidden"));
  }
});

// ---------------------------------------
// DELETE DATA FUNCTIONS
// ---------------------------------------

function handleDelete(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      const deleteUrl = `${endpoints[currentDataType].delete}/${id}`;
      console.log("Deleting from:", deleteUrl);

      fetch(deleteUrl, {
        method: "PUT", // atau POST kalau backend pakai POST
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Delete response:", data);

          const isSuccess = data.response === "200";

          Swal.fire({
            icon: isSuccess ? "success" : "error",
            title: isSuccess ? "Deleted!" : "Failed",
            text: data.message || "Unknown error.",
          }).then(() => {
            if (isSuccess) {
              fetchAndUpdateData(); // refresh tabel
            }
          });
        })
        .catch((error) => {
          console.error("Delete error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Terjadi kesalahan saat menghapus data.",
          });
        });
    }
  });
}

function handleDeleteResponse(data) {
  const isSuccess = data.response == 200; // Perbaikan utama di sini
  const message = data.message || "Unknown response";

  setTimeout(() => {
    Swal.fire({
      icon: isSuccess ? "success" : "error",
      title: isSuccess ? "Deleted" : "Failed",
      text: message,
    }).then(() => {
      fetchAndUpdateData(detail_id);
    });
  }, 500);
}

// ---------------------------------------
// UPDATE DATA FUNCTIONS
// ---------------------------------------

async function handleEdit(Id, Data, tab) {
  const updateUrl = endpoints[currentDataType].detail;
  const fullUrl = `${updateUrl}/${Id}`;

  try {
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log("API URL Get Edit Data:", fullUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch item data");
    }

    const itemData = await response.json();
    console.log(itemData);
    if (!itemData.detail || itemData.detail.length === 0) {
      throw new Error("No item data found for editing");
    }

    const detailItem = itemData.detail;

    Swal.fire({
      title: `Edit ${Data}`,
      html: formHtml,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        Swal.showLoading();

        const fileInput = document.querySelector(
          '#dataformfile input[type="file"]'
        );
        const fileText = document.querySelector("#file_text");

        if (fileInput && fileInput.files.length > 0) {
          return getFormDataFile(); // Handles file upload
        } else if (
          fileText &&
          fileText.value.trim() &&
          fileText.value !== "No image selected"
        ) {
          return getFormDataWithExistingImage(fileText.value.trim()); // Uses existing image
        } else {
          return getFormData(); // Normal form data
        }
      },
      didOpen: async () => {
        await loadDropdownCall(tab);
        fillFormData(detailItem, tab);
        console.log(detailItem);

        //Set the file input label to the existing image name
        const fileInput = document.querySelector(
          '#dataformfile input[type="file"]'
        );
        const fileText = document.querySelector("#file_text");

        if (fileText && fileInput) {
          fileInput.dataset.placeholder = fileText.value; // Custom attribute to indicate the selected image
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.showLoading();
        handleUpdate(Id, result.value);
      }
    });
  } catch (error) {
    console.error("Error while editing:", error);
    showErrorAlert(error.message);
  }
}

function getFormDataWithExistingImage(imagePath) {
  const formData = getFormDataFile();
  formData.append("existing_image", imagePath);
  return formData;
}

function handleUpdate(id, formData) {
  const updateUrl = `${endpoints[currentDataType].update}/${id}`;

  // Check if formData is FormData (file upload) or a regular object
  const isMultipart = formData instanceof FormData;

  if (!isMultipart) {
    formData.owner_id = owner_id;
  } else {
    formData.append("owner_id", owner_id);
  }

  console.log(formData);
  fetch(updateUrl, {
    method: "PUT", // Use POST for form-data, some APIs allow PUT with form-data too
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      ...(isMultipart ? {} : { "Content-Type": "application/json" }), // Do not set Content-Type for FormData
    },
    body: isMultipart ? formData : JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => handleUpdateResponse(data))
    .catch(() => showErrorAlert("Failed to update data. Please try again."));
}

function handleUpdateResponse(data) {
  const message = data.data.message;
  const isSuccess = message === "Data successfully updated";

  Swal.fire({
    icon: isSuccess ? "success" : "error",
    title: isSuccess ? "Success" : "Failed",
    text: message,
  }).then(() => {
    fetchAndUpdateData(detail_id);
  });
}
