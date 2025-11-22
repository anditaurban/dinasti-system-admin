pagemodule = "Project";
subpagemodule = "Purchase";
renderHeader();

var projectId = window.detail_id;
var poList = [];
var currentUpdatePurchId = null;

(async function initPurchase() {
  document.getElementById("projectNameDisplay").textContent =
    window.detail_desc || "Project";

  const elProjectId = document.getElementById("purchProjectId");
  if (elProjectId) elProjectId.value = projectId;

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("purchDate").value = today;

  await Promise.all([loadPoList(), loadAccountList()]);
  loadPurchaseTable(1);

  document
    .getElementById("purchaseForm")
    .addEventListener("submit", handlePurchaseSubmit);
  document
    .getElementById("cancelUpdateBtn")
    .addEventListener("click", resetForm);
  document
    .getElementById("purchNoPo")
    .addEventListener("change", handlePoChange);

  document.querySelectorAll(".formatNumber").forEach((i) => {
    i.addEventListener("input", (e) => {
      e.target.value = finance(e.target.value.replace(/\D/g, ""));
    });
  });

  document.getElementById("purchaseBody").addEventListener("click", (e) => {
    if (e.target.closest(".edit-btn")) {
      const id = e.target.closest(".edit-btn").dataset.id;
      populateForm(id);
    }
    if (e.target.closest(".delete-btn")) {
      const id = e.target.closest(".delete-btn").dataset.id;
      handleDelete(id);
    }
  });
})();

// --- LOAD DATA ---

async function loadPoList() {
  const sel = document.getElementById("purchNoPo");
  sel.innerHTML = '<option value="">Memuat...</option>';
  try {
    const res = await fetch(`${baseUrl}/list/no_po/${projectId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const json = await res.json();

    sel.innerHTML = '<option value="">-- Pilih PO --</option>';
    if (json.success && json.listData) {
      poList = json.listData;
      poList.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = item.no_po;
        opt.textContent = `${item.no_po}`;
        sel.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Gagal load PO", e);
    sel.innerHTML = '<option value="">Gagal Load</option>';
  }
}

async function loadAccountList() {
  const select = document.getElementById("purchAkun");
  let akunOptions = "<option value=''>-- Pilih Akun --</option>";

  try {
    const res = await fetch(`${baseUrl}/list/finance_accounts`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await res.json();

    if (res.ok && result.listData) {
      result.listData.forEach((acc) => {
        const opt = document.createElement("option");
        opt.value = acc.account_id; // Pastikan key ini benar dari API
        opt.textContent = `${acc.account_name} - ${acc.number_account}`;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("❌ Gagal load akun:", err);
    select.innerHTML = "<option value=''>Gagal memuat data</option>";
  }
}

async function loadPurchaseTable(page) {
  const tbody = document.getElementById("purchaseBody");
  tbody.innerHTML =
    '<tr><td colspan="9" class="text-center py-4">Memuat...</td></tr>';

  try {
    const res = await fetch(
      `${baseUrl}/table/project_purchase/${projectId}/${page}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const json = await res.json();
    const data = json.tableData || [];

    tbody.innerHTML = "";
    if (data.length) {
      data.forEach((d) => {
        tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="px-3 py-2 whitespace-nowrap">${
                          d.transaction_date
                        }</td>
                        <td class="px-3 py-2 whitespace-nowrap">${
                          d.po_date || "-"
                        }</td>
                        <td class="px-3 py-2">${d.no_po || "-"}</td>
                        <td class="px-3 py-2 font-mono text-blue-600">${
                          d.no_payable || "-"
                        }</td>
                        <td class="px-3 py-2">${d.vendor_name || "-"}</td>
                        <td class="px-3 py-2">${d.account_name || "-"}</td>
                        <td class="px-3 py-2 text-right font-semibold">${finance(
                          d.amount
                        )}</td>
                        <td class="px-3 py-2 text-xs text-gray-500 max-w-[150px] truncate">${
                          d.notes || "-"
                        }</td>
                        <td class="px-3 py-2 text-center whitespace-nowrap">
                            <button class="edit-btn text-blue-600 mr-2 hover:text-blue-800" data-id="${
                              d.payable_id
                            }" type="button">✏️</button>
                            <button class="delete-btn text-red-600 hover:text-red-800" data-id="${
                              d.payable_id
                            }" type="button">🗑️</button>
                        </td>
                    </tr>
                `;
      });
    } else {
      tbody.innerHTML =
        '<tr><td colspan="9" class="text-center py-4 text-gray-500">Belum ada data</td></tr>';
    }
  } catch (e) {
    console.error(e);
  }
}

// --- LOGIC FORM ---

function handlePoChange() {
  const selectedNoPo = document.getElementById("purchNoPo").value;
  const elNominal = document.getElementById("purchNominal");
  const elVendorId = document.getElementById("purchVendorId");
  const elPoDate = document.getElementById("purchPoDate");
  const elInfo = document.getElementById("poInfoText");

  if (!selectedNoPo) {
    elNominal.value = "";
    elVendorId.value = "0";
    elPoDate.value = "";
    elInfo.textContent = "";
    return;
  }

  const poData = poList.find((p) => p.no_po === selectedNoPo);

  if (poData) {
    elNominal.value = finance(poData.total_po || 0);
    elVendorId.value = poData.vendor_id || 0;

    // Auto-fill Tanggal PO jika ada di data list
    if (poData.po_date) {
      elPoDate.value = poData.po_date;
    } else {
      // Jika tidak ada, kosongkan atau set today (opsional)
      elPoDate.value = "";
    }

    const vendorName = poData.vendor || "Vendor Tidak Diketahui";
    elInfo.textContent = `Vendor: ${vendorName}`;
  }
}

async function handlePurchaseSubmit(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("owner_id", user.owner_id);
  formData.append("user_id", user.user_id);
  formData.append("akun", document.getElementById("purchAkun").value);
  formData.append("payable_date", document.getElementById("purchDate").value);
  formData.append("po_date", document.getElementById("purchPoDate").value);
  formData.append("no_po", document.getElementById("purchNoPo").value);
  formData.append("vendor_id", document.getElementById("purchVendorId").value);
  formData.append("project_id", projectId);
  formData.append(
    "payable_number",
    document.getElementById("purchPayableNumber").value
  );
  formData.append(
    "nominal",
    parseRupiah(document.getElementById("purchNominal").value)
  );
  formData.append("keterangan", document.getElementById("purchNotes").value);

  const fileInput = document.getElementById("purchFile");
  if (fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  }

  if (
    !formData.get("payable_date") ||
    !formData.get("no_po") ||
    !formData.get("nominal") ||
    !formData.get("akun")
  ) {
    return Swal.fire("Gagal", "Lengkapi data wajib (*)", "warning");
  }

  const url = currentUpdatePurchId
    ? `${baseUrl}/update/project_payable/${currentUpdatePurchId}`
    : `${baseUrl}/add/project_payable`;

  Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: formData,
    });
    const json = await res.json();

    if (res.ok && (json.success || json.response == "200")) {
      Swal.fire("Berhasil", "Data tersimpan", "success");
      resetForm();
      loadPurchaseTable(1);
    } else {
      throw new Error(json.message || "Gagal menyimpan");
    }
  } catch (e) {
    Swal.fire("Error", e.message, "error");
  }
}

async function handleDelete(id) {
  const c = await Swal.fire({
    title: "Hapus?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya",
  });
  if (!c.isConfirmed) return;
  try {
    await fetch(`${baseUrl}/delete/project_purchase/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    loadPurchaseTable(1);
    Swal.fire("Terhapus", "", "success");
  } catch (e) {
    Swal.fire("Error", "Gagal hapus", "error");
  }
}

function populateForm(id) {
  // Di sini kita perlu fetch data detail payable jika endpoint tersedia
  // Atau ambil data sementara dari row table (tidak disarankan untuk production)
  Swal.fire("Info", "Fitur edit sedang dalam pengembangan", "info");
}

function resetForm() {
  document.getElementById("purchaseForm").reset();
  currentUpdatePurchId = null;
  document.getElementById("submitPurchBtn").textContent = "+ Tambah";
  document
    .getElementById("submitPurchBtn")
    .classList.replace("bg-green-600", "bg-blue-600");
  document.getElementById("cancelUpdateBtn").classList.add("hidden");
  document.getElementById("poInfoText").textContent = "";
  document.getElementById("purchVendorId").value = "0";
}
