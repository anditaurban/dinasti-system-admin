pagemodule = "Project";
subpagemodule = "Project Costing";
renderHeader();

// loadDetailSales(window.detail_id, window.detail_desc);

// // =====================
// // Render Detail Project
// // =====================
// async function loadDetailSales(Id, Detail) {
//   window.detail_id = Id;
//   window.detail_desc = Detail;

//   try {
//     const res = await fetch(`${baseUrl}/detail/project/${Id}`, {
//       headers: { Authorization: `Bearer ${API_TOKEN}` },
//     });
//     const response = await res.json();
//     const data = response.detail;
//     if (!data) throw new Error("Invalid API response structure");

//     // Update header nilai-nilai project
//     document.getElementById("projectAmount").innerHTML =
//       finance(data.project_value) || 0;
//     document.getElementById("plan_costing").innerHTML =
//       finance(data.plan_costing) || 0;
//     document.getElementById("actual_costing").innerHTML =
//       finance(data.actual_cost) || 0;
//     document.getElementById("margin").innerHTML = finance(data.margin) || 0;

//     // Table Body
//     const tbody = document.getElementById("tabelItem");
//     tbody.innerHTML = "";

//     if (data.items?.length) {
//       // --- Grouping berdasarkan sub_category ---
//       const groups = {};
//       data.items.forEach((item) => {
//         if (!groups[item.sub_category]) groups[item.sub_category] = [];
//         groups[item.sub_category].push(item);
//       });

//       let nomor = 1;

//       // --- Render per group ---
//       Object.keys(groups).forEach((subCat) => {
//         // Baris header sub_category
//         const trHeader = document.createElement("tr");
//         trHeader.className = "bg-gray-200 font-semibold";
//         trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase">${
//           subCat || "-"
//         }</td>`;
//         tbody.appendChild(trHeader);

//         groups[subCat].forEach((item) => {
//           // Baris produk utama
//           const tr = document.createElement("tr");
//           tr.className = "border-b bg-gray-50";
//           tr.dataset.materialId = item.id; // penting untuk update PUT

//           tr.innerHTML = `
//             <td class="px-3 py-2 align-top text-sm font-semibold">${nomor++}</td>
//             <td class="px-3 py-2 align-top">
//               <div class="font-medium">${item.product || "-"}</div>
//               <div class="text-xs text-gray-500">${item.description || ""}</div>
//             </td>
//             ${
//               item.materials?.length
//                 ? `<td colspan="8" class="px-3 py-2 text-center text-gray-400 italic"></td>`
//                 : `
//               <td class="px-3 py-2 text-right align-top">${item.qty || 0}</td>
//               <td class="px-3 py-2 text-center align-top">${
//                 item.unit || ""
//               }</td>
//               <td class="px-3 py-2 text-right align-top">${formatNumber(
//                 item.unit_price || 0
//               )}</td>
//               <td class="px-3 py-2 text-right align-top">${formatNumber(
//                 item.total || item.qty * item.unit_price
//               )}</td>
//               <td class="px-3 py-2 text-center align-top">
//                 <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${
//                   item.qty || 0
//                 }">
//               </td>
//               <td class="px-3 py-2 text-center align-top">
//                 <input class="actualcost text-right border px-2 py-1 w-20" placeholder="0" value="${
//                   item.actual_qty || 0
//                 }">
//               </td>
//               <td class="px-3 py-2 text-center align-top">
//                 <input type="date" class="payment_date border px-2 py-1">
//               </td>
//               <td class="px-3 py-2 text-center align-top">
//                 <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
//                   Update
//                 </button>
//               </td>
//             `
//             }
//           `;
//           tbody.appendChild(tr);

//           // Render sub-material kalau ada
//           if (item.materials?.length) {
//             item.materials.forEach((m, mIdx) => {
//               const subTr = document.createElement("tr");
//               subTr.className = "border-b bg-gray-50 text-sm";
//               subTr.dataset.materialId = m.id; // untuk update

//               subTr.innerHTML = `
//                 <td class="px-3 py-1"></td>
//                 <td class="px-3 py-1 italic">${mIdx + 1}. ${m.name || ""} - ${
//                 m.specification || ""
//               }</td>
//                 <td class="px-3 py-1 text-right">${m.qty || 0}</td>
//                 <td class="px-3 py-1 text-center">${m.unit || ""}</td>
//                 <td class="px-3 py-1 text-right">${formatNumber(
//                   m.unit_price || 0
//                 )}</td>
//                 <td class="px-3 py-1 text-right">${formatNumber(
//                   m.total || 0
//                 )}</td>
//                 <td class="px-3 py-1 text-center">
//                   <input class="plancosting text-right border px-2 py-1 w-20" placeholder="0" value="${
//                     m.qty || 0
//                   }">
//                 </td>
//                 <td class="px-3 py-1 text-center">
//                   <input class="actualcost text-right border px-2 py-1 w-20" placeholder="0" value="${
//                     m.actual_qty || 0
//                   }">
//                 </td>
//                 <td class="px-3 py-1 text-center">
//                   <input type="date" class="payment_date border px-2 py-1">
//                 </td>
//                 <td class="px-3 py-1 text-center">
//                   <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
//                     Update
//                   </button>
//                 </td>
//               `;
//               tbody.appendChild(subTr);
//             });
//           }
//         });
//       });
//     } else {
//       tbody.innerHTML = `
//         <tr>
//           <td colspan="10" class="text-center text-gray-500 italic py-3">
//             Tidak ada item
//           </td>
//         </tr>
//       `;
//     }

//     window.dataLoaded = true;
//   } catch (err) {
//     console.error("Gagal load detail:", err);
//     Swal.fire("Error", err.message || "Gagal memuat detail project", "error");
//   }
// }

// const tab1 = document.getElementById("tab1");
// const tab2 = document.getElementById("tab2");
// const tab1Btn = document.getElementById("tab1Btn");
// const tab2Btn = document.getElementById("tab2Btn");

// tab1Btn.addEventListener("click", () => {
//   tab1.classList.remove("hidden");
//   tab2.classList.add("hidden");
//   tab1Btn.classList.add("border-blue-600", "text-blue-600");
//   tab2Btn.classList.remove("border-blue-600", "text-blue-600");
//   tab2Btn.classList.add("text-gray-500");
// });

// tab2Btn.addEventListener("click", () => {
//   tab2.classList.remove("hidden");
//   tab1.classList.add("hidden");
//   tab2Btn.classList.add("border-blue-600", "text-blue-600");
//   tab1Btn.classList.remove("border-blue-600", "text-blue-600");
//   tab1Btn.classList.add("text-gray-500");
// });

// // =====================
// // Handler Tombol Update
// // =====================
// document.getElementById("tabelItem").addEventListener("click", async (e) => {
//   if (!e.target.classList.contains("update-btn")) return;

//   const tr = e.target.closest("tr");
//   const materialId = tr.dataset.materialId;
//   const projectId = window.detail_id;

//   if (!materialId) {
//     Swal.fire("Error", "Material ID tidak ditemukan", "error");
//     return;
//   }

//   // Ambil input dari user
//   const qty = parseFloat(tr.querySelector(".plancosting")?.value || 0);
//   const actualQty = parseFloat(tr.querySelector(".actualcost")?.value || 0);
//   const paymentDate = tr.querySelector(".payment_date")?.value || "";

//   // Cari data lama berdasarkan materialId
//   const findItem = (items) => {
//     for (const item of items) {
//       if (item.id == materialId) return item;
//       if (item.materials) {
//         const found = item.materials.find((m) => m.id == materialId);
//         if (found) return found;
//       }
//     }
//     return null;
//   };

//   const original = findItem(window.projectItems);
//   if (!original) {
//     Swal.fire("Error", "Data original tidak ditemukan", "error");
//     return;
//   }

//   // Gabungkan data lama + data baru dari input
//   const payload = {
//     qty: qty || original.qty,
//     unit_price: original.unit_price || 0,
//     actual_qty: actualQty || original.actual_qty || 0,
//     actual_unit_price: original.actual_unit_price || original.unit_price || 0,
//     name: original.name || original.product || "-",
//     specification: original.specification || original.description || "",
//     unit: original.unit || "",
//     payment_date: paymentDate || null,
//   };

//   try {
//     Swal.fire({
//       title: "Updating...",
//       text: "Mohon tunggu sebentar",
//       allowOutsideClick: false,
//       didOpen: () => Swal.showLoading(),
//     });

//     const res = await fetch(
//       `${baseUrl}/update/material_project/${projectId}/${materialId}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${API_TOKEN}`,
//         },
//         body: JSON.stringify(payload),
//       }
//     );

//     const result = await res.json();
//     if (!res.ok) throw new Error(result.message || "Gagal update data");

//     Swal.fire({
//       icon: "success",
//       title: "Berhasil!",
//       text: "Costing berhasil diperbarui",
//       timer: 1500,
//       showConfirmButton: false,
//     });

//     // Reload data project
//     loadDetailSales(window.detail_id, window.detail_desc);
//   } catch (err) {
//     Swal.fire("Error", err.message || "Gagal mengupdate data", "error");
//   }
// });

// function toggleSection(id) {
//   const section = document.getElementById(id);
//   const icon = document.getElementById("icon-" + id);
//   section.classList.toggle("hidden");
//   icon.textContent = section.classList.contains("hidden") ? "►" : "▼";
// }

// async function printInvoice(pesanan_id) {
//   try {
//     const response = await fetch(
//       `${baseUrl}/detail/sales_invoice/${pesanan_id}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${API_TOKEN}`,
//         },
//       }
//     );

//     const result = await response.json();
//     const detail = result?.detail;
//     if (!detail) throw new Error("Data faktur tidak ditemukan");

//     const { isConfirmed, dismiss } = await Swal.fire({
//       title: "Cetak Faktur Penjualan",
//       text: "Pilih metode pencetakan:",
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Download PDF",
//       cancelButtonText: "Print Langsung",
//       reverseButtons: true,
//     });

//     if (isConfirmed) {
//       const url = `invoice_print.html?id=${pesanan_id}`;
//       Swal.fire({
//         title: "Menyiapkan PDF...",
//         html: "File akan diunduh otomatis.",
//         allowOutsideClick: false,
//         allowEscapeKey: false,
//         didOpen: () => {
//           Swal.showLoading();

//           const iframe = document.createElement("iframe");
//           iframe.src = url + "&mode=download";
//           iframe.style.width = "0";
//           iframe.style.height = "0";
//           iframe.style.border = "none";
//           document.body.appendChild(iframe);

//           setTimeout(() => {
//             Swal.close();
//             Swal.fire(
//               "Berhasil",
//               "Faktur Penjualan berhasil diunduh.",
//               "success"
//             );
//           }, 3000);
//         },
//       });
//     } else if (dismiss === Swal.DismissReason.cancel) {
//       window.open(`invoice_print.html?id=${pesanan_id}`, "_blank");
//     }
//   } catch (error) {
//     Swal.fire({
//       title: "Gagal",
//       text: error.message,
//       icon: "error",
//     });
//   }
// }

// Menunggu hingga seluruh konten DOM (HTML) selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // MOCK DATA (Data JSON Sementara)
  // ==================================================

  // Data untuk Tab 1 (Detail Project & Item Pekerjaan)
  let mockProjectData = {
    detail: {
      project_value: 38295000,
      plan_costing: 35000000,
      actual_cost: 0, // Akan dikalkulasi
      margin: 0, // Akan dikalkulasi
      items: [
        {
          id: "item-001",
          sub_category: "JASA",
          product: "Ganti Kabel",
          description: "Penggantian kabel fiber optik utama",
          qty: 1,
          unit: "set",
          unit_price: 30000000,
          total: 30000000,
          plan_costing_val: 30000000,
          actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
          payment_date_val: null,
          materials: [],
        },
        {
          id: "item-002",
          sub_category: "MOB DEMOB",
          product: "Drop Team",
          description: "Mobilisasi tim teknisi ke lokasi",
          qty: 2,
          unit: "Person",
          unit_price: 2500000,
          total: 5000000,
          plan_costing_val: 5000000,
          actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
          payment_date_val: null,
          materials: [],
        },
      ],
    },
  };

  // Data untuk Tab 2 (Detail Pengeluaran Real)
  let mockCalculationDetails = [
    {
      id: "detail-001",
      tanggal: "2025-09-01",
      product: "Kabel Ungu",
      korelasi: "Ganti Kabel",
      harga: 20000000,
    },
    {
      id: "detail-002",
      tanggal: "2025-09-12",
      product: "Kabel PINK",
      korelasi: "Ganti Kabel",
      harga: 50000000,
    },
    {
      id: "detail-003",
      tanggal: "2025-09-13",
      product: "Tiket Pesawat Agus",
      korelasi: "Drop Team",
      harga: 2000000,
    },
    {
      id: "detail-004",
      tanggal: "2025-09-14",
      product: "Tiket Pesawat Nandar",
      korelasi: "Drop Team",
      harga: 1750000,
    },
  ];

  // ==================================================
  // ELEMEN-ELEMEN DOM
  // ==================================================
  // Disimpan dalam variabel agar mudah diakses

  // Tabs
  const tab1 = document.getElementById("tab1");
  const tab2 = document.getElementById("tab2");
  const tab1Btn = document.getElementById("tab1Btn");
  const tab2Btn = document.getElementById("tab2Btn");

  // Elemen Tab 1
  const projectAmountEl = document.getElementById("projectAmount");
  const planCostingEl = document.getElementById("plan_costing");
  const actualCostingEl = document.getElementById("actual_costing");
  const marginEl = document.getElementById("margin");
  const tabelItemBody = document.getElementById("tabelItem");

  // Elemen Tab 2
  const realCalcBody = document.getElementById("realCalcBody");
  const realCalcForm = document.getElementById("realCalcForm");
  const calcKorelasiSelect = document.getElementById("calcKorelasi");

  // Lainnya
  const notificationEl = document.getElementById("notification");

  // ==================================================
  // HELPER FUNCTIONS
  // ==================================================

  // Fungsi untuk format angka ke Rupiah
  function formatNumber(value) {
    if (typeof value !== "number") {
      value = parseFloat(value) || 0;
    }
    return value.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // Fungsi untuk format ke Rupiah (finance)
  function finance(value) {
    return `Rp ${formatNumber(value)}`;
  }

  // Fungsi untuk menampilkan notifikasi
  function showNotification(message, isError = false) {
    notificationEl.textContent = message;
    notificationEl.classList.remove("hidden", "bg-green-500", "bg-red-500");

    if (isError) {
      notificationEl.classList.add("bg-red-500");
    } else {
      notificationEl.classList.add("bg-green-500");
    }

    setTimeout(() => {
      notificationEl.classList.add("hidden");
    }, 3000);
  }

  // ==================================================
  // LOGIC INTI (Kalkulasi & Render)
  // ==================================================

  /**
   * 1. MENGHITUNG TOTAL DARI TAB 2
   * Fungsi ini adalah "otak" dari aplikasi.
   * - Mengambil semua data dari `mockCalculationDetails` (Tab 2).
   * - Menjumlahkannya berdasarkan 'korelasi'.
   * - Meng-update data `mockProjectData` (Tab 1).
   * - Menghitung ulang total summary project.
   */
  function calculateAndUpdateActuals() {
    console.log("Running calculation...");

    let actualsMap = {}; // Cth: { "Ganti Kabel": 70000000, "Drop Team": 3750000 }
    let totalActualCosting = 0;

    // 1. Loop data Tab 2 & buat map total
    mockCalculationDetails.forEach((detail) => {
      if (!actualsMap[detail.korelasi]) {
        actualsMap[detail.korelasi] = 0;
      }
      actualsMap[detail.korelasi] += detail.harga;
    });

    // 2. Loop data Tab 1 & update nilainya pakai map
    mockProjectData.detail.items.forEach((item) => {
      const calculatedCost = actualsMap[item.product] || 0;
      item.actual_costing_val = calculatedCost;
    });

    // 3. Hitung ulang total summary
    const data = mockProjectData.detail;
    data.plan_costing = data.items.reduce(
      (acc, item) => acc + item.plan_costing_val,
      0
    );
    data.actual_cost = data.items.reduce(
      (acc, item) => acc + item.actual_costing_val,
      0
    );
    data.margin = data.project_value - data.actual_cost;
  }

  /**
   * 2. RENDER TAB 1 (Project Costing)
   * Fungsi ini mengambil data dari `mockProjectData` dan menampilkannya di UI.
   */
  async function loadDetailSales() {
    console.log("Rendering Tab 1...");
    try {
      const data = mockProjectData.detail;
      if (!data) throw new Error("Mock data tidak ditemukan");

      // Update header nilai-nilai project
      projectAmountEl.innerHTML = finance(data.project_value);
      planCostingEl.innerHTML = finance(data.plan_costing);
      actualCostingEl.innerHTML = finance(data.actual_cost);
      marginEl.innerHTML = finance(data.margin);

      // Ubah warna margin jika negatif
      if (data.margin < 0) {
        marginEl.classList.remove("text-green-600");
        marginEl.classList.add("text-red-600");
      } else {
        marginEl.classList.remove("text-red-600");
        marginEl.classList.add("text-green-600");
      }

      // Table Body
      tabelItemBody.innerHTML = "";

      if (data.items?.length) {
        const groups = {};
        data.items.forEach((item) => {
          if (!groups[item.sub_category]) groups[item.sub_category] = [];
          groups[item.sub_category].push(item);
        });

        let nomor = 1;

        Object.keys(groups).forEach((subCat) => {
          const trHeader = document.createElement("tr");
          trHeader.className = "bg-gray-200 font-semibold";
          trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase">${
            subCat || "-"
          }</td>`;
          tabelItemBody.appendChild(trHeader);

          groups[subCat].forEach((item) => {
            const tr = document.createElement("tr");
            tr.className = "border-b bg-gray-50";
            tr.dataset.itemId = item.id; // penting untuk update

            tr.innerHTML = `
                            <td class="px-3 py-2 align-top text-sm font-semibold text-center">${nomor++}</td>
                            <td class="px-3 py-2 align-top">
                                <div class="font-medium">${
                                  item.product || "-"
                                }</div>
                                <div class="text-xs text-gray-500">${
                                  item.description || ""
                                }</div>
                            </td>
                            <td class="px-3 py-2 text-right align-top">${
                              item.qty || 0
                            }</td>
                            <td class="px-3 py-2 text-center align-top">${
                              item.unit || ""
                            }</td>
                            <td class="px-3 py-2 text-right align-top">${formatNumber(
                              item.unit_price || 0
                            )}</td>
                            <td class="px-3 py-2 text-right align-top font-semibold">${formatNumber(
                              item.total || 0
                            )}</td>
                            
                            <!-- Kolom Plan Costing (Bisa Diedit) -->
                            <td class="px-3 py-2 text-center align-top">
                                <input class="plancosting text-right border rounded px-2 py-1 w-full" type="number" placeholder="0" value="${
                                  item.plan_costing_val || 0
                                }">
                            </td>
                            
                            <!-- Kolom Actual Costing (Read Only - Hasil Kalkulasi) -->
                            <td class="px-3 py-2 text-center align-top">
                                <input class="actualcost text-right border rounded px-2 py-1 w-full" type="text" placeholder="0" value="${formatNumber(
                                  item.actual_costing_val || 0
                                )}" readonly>
                            </td>
                            
                            <td class="px-3 py-2 text-center align-top">
                                <input type="date" class="payment_date border rounded px-2 py-1 w-full" value="${
                                  item.payment_date_val || ""
                                }">
                            </td>
                            <td class="px-3 py-2 text-center align-top">
                                <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                                    Update
                                </button>
                            </td>
                        `;
            tabelItemBody.appendChild(tr);
          });
        });
      } else {
        tabelItemBody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
      }
    } catch (err) {
      console.error("Gagal load detail:", err);
      showNotification(err.message || "Gagal memuat detail project", true);
    }
  }

  /**
   * 3. RENDER TAB 2 (Real Calculation)
   * Menampilkan data dari `mockCalculationDetails` ke tabel.
   */
  function loadRealCalculations() {
    console.log("Rendering Tab 2...");
    realCalcBody.innerHTML = "";

    if (mockCalculationDetails.length === 0) {
      realCalcBody.innerHTML = `<tr><td colspan="4" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>`;
      return;
    }

    // Urutkan berdasarkan tanggal terbaru
    const sortedDetails = [...mockCalculationDetails].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    );

    sortedDetails.forEach((detail) => {
      const tr = document.createElement("tr");
      tr.className = "border-b";
      tr.innerHTML = `
                <td class="px-3 py-2">${new Date(
                  detail.tanggal
                ).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}</td>
                <td class="px-3 py-2">${detail.product}</td>
                <td class="px-3 py-2 font-medium">${detail.korelasi}</td>
                <td class="px-3 py-2 text-right">${finance(detail.harga)}</td>
            `;
      realCalcBody.appendChild(tr);
    });
  }

  /**
   * 4. POPULATE KORELASI DROPDOWN
   * Mengisi dropdown di form Tab 2 dengan nama pekerjaan dari Tab 1.
   */
  function populateKorelasiDropdown() {
    calcKorelasiSelect.innerHTML =
      '<option value="">-- Pilih Pekerjaan --</option>'; // Reset

    mockProjectData.detail.items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.product;
      option.textContent = item.product;
      calcKorelasiSelect.appendChild(option);
    });
  }

  // ==================================================
  // EVENT LISTENERS
  // ==================================================

  // --- Tab Switching ---
  tab1Btn.addEventListener("click", () => {
    tab1.classList.remove("hidden");
    tab2.classList.add("hidden");
    tab1Btn.classList.add("border-blue-600", "text-blue-600");
    tab2Btn.classList.remove("border-blue-600", "text-blue-600");
    tab2Btn.classList.add("text-gray-500");

    // Refresh data Tab 1 saat diklik
    loadDetailSales();
  });

  tab2Btn.addEventListener("click", () => {
    tab2.classList.remove("hidden");
    tab1.classList.add("hidden");
    tab2Btn.classList.add("border-blue-600", "text-blue-600");
    tab1Btn.classList.remove("border-blue-600", "text-blue-600");
    tab1Btn.classList.add("text-gray-500");

    // Refresh data Tab 2 saat diklik
    loadRealCalculations();
  });

  // --- Handler Tombol Update (Tab 1) ---
  tabelItemBody.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("update-btn")) return;

    const tr = e.target.closest("tr");
    const itemId = tr.dataset.itemId;
    if (!itemId) return showNotification("Item ID tidak ditemukan", true);

    // Ambil input dari user
    const newPlanCosting = parseFloat(
      tr.querySelector(".plancosting")?.value || 0
    );
    const newPaymentDate = tr.querySelector(".payment_date")?.value || "";

    // Cari item di mock data dan update
    const itemToUpdate = mockProjectData.detail.items.find(
      (item) => item.id === itemId
    );
    if (!itemToUpdate)
      return showNotification("Data item tidak ditemukan", true);

    itemToUpdate.plan_costing_val = newPlanCosting;
    itemToUpdate.payment_date_val = newPaymentDate;

    // Hitung ulang total
    calculateAndUpdateActuals();
    // Render ulang Tab 1
    loadDetailSales();

    console.log("Updated Plan Costing:", itemToUpdate);
    showNotification("Plan Costing berhasil diupdate!");
  });

  // --- Handler Form Input (Tab 2) ---
  realCalcForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = e.target;
    const tanggal = form.calcTanggal.value;
    const product = form.calcProduct.value;
    const korelasi = form.calcKorelasi.value;
    const harga = parseFloat(form.calcHarga.value || 0);

    if (!tanggal || !product || !korelasi || !harga) {
      return showNotification("Semua field wajib diisi", true);
    }

    // Buat data baru
    const newData = {
      id: `detail-${new Date().getTime()}`, // ID unik
      tanggal,
      product,
      korelasi,
      harga,
    };

    // Tambahkan ke mock data
    mockCalculationDetails.push(newData);
    console.log("Added new detail:", newData);

    // Reset form
    form.reset();

    // --- (RE-KALKULASI & RE-RENDER) ---
    // 1. Hitung ulang semua total
    calculateAndUpdateActuals();
    // 2. Render ulang tabel Tab 2
    loadRealCalculations();

    showNotification("Data detail berhasil ditambahkan!");
  });

  // ==================================================
  // INISIALISASI SAAT HALAMAN DIBUKA
  // ==================================================
  console.log("Page loaded. Initializing demo...");

  // 1. Hitung total berdasarkan data awal
  calculateAndUpdateActuals();

  // 2. Tampilkan Tab 1 dengan data yang sudah dihitung (Ini adalah default)
  loadDetailSales();

  // 3. Siapkan dropdown di form Tab 2
  populateKorelasiDropdown();
});
// Menunggu hingga seluruh konten DOM (HTML) selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // MOCK DATA (Data JSON Sementara)
  // ==================================================

  // Data untuk Tab 1 (Detail Project & Item Pekerjaan)
  let mockProjectData = {
    detail: {
      project_value: 38295000,
      plan_costing: 35000000,
      actual_cost: 0, // Akan dikalkulasi
      margin: 0, // Akan dikalkulasi
      items: [
        {
          id: "item-001",
          sub_category: "JASA",
          product: "Ganti Kabel",
          description: "Penggantian kabel fiber optik utama",
          qty: 1,
          unit: "set",
          unit_price: 30000000,
          total: 30000000,
          plan_costing_val: 30000000,
          actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
          payment_date_val: null,
          materials: [],
        },
        {
          id: "item-002",
          sub_category: "MOB DEMOB",
          product: "Drop Team",
          description: "Mobilisasi tim teknisi ke lokasi",
          qty: 2,
          unit: "Person",
          unit_price: 2500000,
          total: 5000000,
          plan_costing_val: 5000000,
          actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
          payment_date_val: null,
          materials: [],
        },
      ],
    },
  };

  // Data untuk Tab 2 (Detail Pengeluaran Real)
  let mockCalculationDetails = [
    {
      id: "detail-001",
      tanggal: "2025-09-01",
      product: "Kabel Ungu",
      korelasi: "Ganti Kabel",
      harga: 20000000,
    },
    {
      id: "detail-002",
      tanggal: "2025-09-12",
      product: "Kabel PINK",
      korelasi: "Ganti Kabel",
      harga: 50000000,
    },
    {
      id: "detail-003",
      tanggal: "2025-09-13",
      product: "Tiket Pesawat Agus",
      korelasi: "Drop Team",
      harga: 2000000,
    },
    {
      id: "detail-004",
      tanggal: "2025-09-14",
      product: "Tiket Pesawat Nandar",
      korelasi: "Drop Team",
      harga: 1750000,
    },
  ];

  // ==================================================
  // ELEMEN-ELEMEN DOM
  // ==================================================
  // Disimpan dalam variabel agar mudah diakses

  // Tabs
  const tab1 = document.getElementById("tab1");
  const tab2 = document.getElementById("tab2");
  const tab1Btn = document.getElementById("tab1Btn");
  const tab2Btn = document.getElementById("tab2Btn");

  // Elemen Tab 1
  const projectAmountEl = document.getElementById("projectAmount");
  const planCostingEl = document.getElementById("plan_costing");
  const actualCostingEl = document.getElementById("actual_costing");
  const marginEl = document.getElementById("margin");
  const tabelItemBody = document.getElementById("tabelItem");

  // Elemen Tab 2
  const realCalcBody = document.getElementById("realCalcBody");
  const realCalcForm = document.getElementById("realCalcForm");
  const calcKorelasiSelect = document.getElementById("calcKorelasi");

  // Lainnya
  const notificationEl = document.getElementById("notification");

  // ==================================================
  // HELPER FUNCTIONS
  // ==================================================

  // Fungsi untuk format angka ke Rupiah
  function formatNumber(value) {
    if (typeof value !== "number") {
      value = parseFloat(value) || 0;
    }
    return value.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // Fungsi untuk format ke Rupiah (finance)
  function finance(value) {
    return `Rp ${formatNumber(value)}`;
  }

  // Fungsi untuk menampilkan notifikasi
  function showNotification(message, isError = false) {
    notificationEl.textContent = message;
    notificationEl.classList.remove("hidden", "bg-green-500", "bg-red-500");

    if (isError) {
      notificationEl.classList.add("bg-red-500");
    } else {
      notificationEl.classList.add("bg-green-500");
    }

    setTimeout(() => {
      notificationEl.classList.add("hidden");
    }, 3000);
  }

  // ==================================================
  // LOGIC INTI (Kalkulasi & Render)
  // ==================================================

  /**
   * 1. MENGHITUNG TOTAL DARI TAB 2
   * Fungsi ini adalah "otak" dari aplikasi.
   * - Mengambil semua data dari `mockCalculationDetails` (Tab 2).
   * - Menjumlahkannya berdasarkan 'korelasi'.
   * - Meng-update data `mockProjectData` (Tab 1).
   * - Menghitung ulang total summary project.
   */
  function calculateAndUpdateActuals() {
    console.log("Running calculation...");

    let actualsMap = {}; // Cth: { "Ganti Kabel": 70000000, "Drop Team": 3750000 }
    let totalActualCosting = 0;

    // 1. Loop data Tab 2 & buat map total
    mockCalculationDetails.forEach((detail) => {
      if (!actualsMap[detail.korelasi]) {
        actualsMap[detail.korelasi] = 0;
      }
      actualsMap[detail.korelasi] += detail.harga;
    });

    // 2. Loop data Tab 1 & update nilainya pakai map
    mockProjectData.detail.items.forEach((item) => {
      const calculatedCost = actualsMap[item.product] || 0;
      item.actual_costing_val = calculatedCost;
    });

    // 3. Hitung ulang total summary
    const data = mockProjectData.detail;
    data.plan_costing = data.items.reduce(
      (acc, item) => acc + item.plan_costing_val,
      0
    );
    data.actual_cost = data.items.reduce(
      (acc, item) => acc + item.actual_costing_val,
      0
    );
    data.margin = data.project_value - data.actual_cost;
  }

  /**
   * 2. RENDER TAB 1 (Project Costing)
   * Fungsi ini mengambil data dari `mockProjectData` dan menampilkannya di UI.
   */
  async function loadDetailSales() {
    console.log("Rendering Tab 1...");
    try {
      const data = mockProjectData.detail;
      if (!data) throw new Error("Mock data tidak ditemukan");

      // Update header nilai-nilai project
      projectAmountEl.innerHTML = finance(data.project_value);
      planCostingEl.innerHTML = finance(data.plan_costing);
      actualCostingEl.innerHTML = finance(data.actual_cost);
      marginEl.innerHTML = finance(data.margin);

      // Ubah warna margin jika negatif
      if (data.margin < 0) {
        marginEl.classList.remove("text-green-600");
        marginEl.classList.add("text-red-600");
      } else {
        marginEl.classList.remove("text-red-600");
        marginEl.classList.add("text-green-600");
      }

      // Table Body
      tabelItemBody.innerHTML = "";

      if (data.items?.length) {
        const groups = {};
        data.items.forEach((item) => {
          if (!groups[item.sub_category]) groups[item.sub_category] = [];
          groups[item.sub_category].push(item);
        });

        let nomor = 1;

        Object.keys(groups).forEach((subCat) => {
          const trHeader = document.createElement("tr");
          trHeader.className = "bg-gray-200 font-semibold";
          trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase">${
            subCat || "-"
          }</td>`;
          tabelItemBody.appendChild(trHeader);

          groups[subCat].forEach((item) => {
            const tr = document.createElement("tr");
            tr.className = "border-b bg-gray-50";
            tr.dataset.itemId = item.id; // penting untuk update

            tr.innerHTML = `
                            <td class="px-3 py-2 align-top text-sm font-semibold text-center">${nomor++}</td>
                            <td class="px-3 py-2 align-top">
                                <div class="font-medium">${
                                  item.product || "-"
                                }</div>
                                <div class="text-xs text-gray-500">${
                                  item.description || ""
                                }</div>
                            </td>
                            <td class="px-3 py-2 text-right align-top">${
                              item.qty || 0
                            }</td>
                            <td class="px-3 py-2 text-center align-top">${
                              item.unit || ""
                            }</td>
                            <td class="px-3 py-2 text-right align-top">${formatNumber(
                              item.unit_price || 0
                            )}</td>
                            <td class="px-3 py-2 text-right align-top font-semibold">${formatNumber(
                              item.total || 0
                            )}</td>
                            
                            <!-- Kolom Plan Costing (Bisa Diedit) -->
                            <td class="px-3 py-2 text-center align-top">
                                <input class="plancosting text-right border rounded px-2 py-1 w-full" type="number" placeholder="0" value="${
                                  item.plan_costing_val || 0
                                }">
                            </td>
                            
                            <!-- Kolom Actual Costing (Read Only - Hasil Kalkulasi) -->
                            <td class="px-3 py-2 text-center align-top">
                                <input class="actualcost text-right border rounded px-2 py-1 w-full" type="text" placeholder="0" value="${formatNumber(
                                  item.actual_costing_val || 0
                                )}" readonly>
                            </td>
                            
                            <td class="px-3 py-2 text-center align-top">
                                <input type="date" class="payment_date border rounded px-2 py-1 w-full" value="${
                                  item.payment_date_val || ""
                                }">
                            </td>
                            <td class="px-3 py-2 text-center align-top">
                                <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                                    Update
                                </button>
                            </td>
                        `;
            tabelItemBody.appendChild(tr);
          });
        });
      } else {
        tabelItemBody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
      }
    } catch (err) {
      console.error("Gagal load detail:", err);
      showNotification(err.message || "Gagal memuat detail project", true);
    }
  }

  /**
   * 3. RENDER TAB 2 (Real Calculation)
   * Menampilkan data dari `mockCalculationDetails` ke tabel.
   */
  function loadRealCalculations() {
    console.log("Rendering Tab 2...");
    realCalcBody.innerHTML = "";

    if (mockCalculationDetails.length === 0) {
      realCalcBody.innerHTML = `<tr><td colspan="4" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>`;
      return;
    }

    // Urutkan berdasarkan tanggal terbaru
    const sortedDetails = [...mockCalculationDetails].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    );

    sortedDetails.forEach((detail) => {
      const tr = document.createElement("tr");
      tr.className = "border-b";
      tr.innerHTML = `
                <td class="px-3 py-2">${new Date(
                  detail.tanggal
                ).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}</td>
                <td class="px-3 py-2">${detail.product}</td>
                <td class="px-3 py-2 font-medium">${detail.korelasi}</td>
                <td class="px-3 py-2 text-right">${finance(detail.harga)}</td>
            `;
      realCalcBody.appendChild(tr);
    });
  }

  /**
   * 4. POPULATE KORELASI DROPDOWN
   * Mengisi dropdown di form Tab 2 dengan nama pekerjaan dari Tab 1.
   */
  function populateKorelasiDropdown() {
    calcKorelasiSelect.innerHTML =
      '<option value="">-- Pilih Pekerjaan --</option>'; // Reset

    mockProjectData.detail.items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.product;
      option.textContent = item.product;
      calcKorelasiSelect.appendChild(option);
    });
  }

  // ==================================================
  // EVENT LISTENERS
  // ==================================================

  // --- Tab Switching ---
  tab1Btn.addEventListener("click", () => {
    tab1.classList.remove("hidden");
    tab2.classList.add("hidden");
    tab1Btn.classList.add("border-blue-600", "text-blue-600");
    tab2Btn.classList.remove("border-blue-600", "text-blue-600");
    tab2Btn.classList.add("text-gray-500");

    // Refresh data Tab 1 saat diklik
    loadDetailSales();
  });

  tab2Btn.addEventListener("click", () => {
    tab2.classList.remove("hidden");
    tab1.classList.add("hidden");
    tab2Btn.classList.add("border-blue-600", "text-blue-600");
    tab1Btn.classList.remove("border-blue-600", "text-blue-600");
    tab1Btn.classList.add("text-gray-500");

    // Refresh data Tab 2 saat diklik
    loadRealCalculations();
  });

  // --- Handler Tombol Update (Tab 1) ---
  tabelItemBody.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("update-btn")) return;

    const tr = e.target.closest("tr");
    const itemId = tr.dataset.itemId;
    if (!itemId) return showNotification("Item ID tidak ditemukan", true);

    // Ambil input dari user
    const newPlanCosting = parseFloat(
      tr.querySelector(".plancosting")?.value || 0
    );
    const newPaymentDate = tr.querySelector(".payment_date")?.value || "";

    // Cari item di mock data dan update
    const itemToUpdate = mockProjectData.detail.items.find(
      (item) => item.id === itemId
    );
    if (!itemToUpdate)
      return showNotification("Data item tidak ditemukan", true);

    itemToUpdate.plan_costing_val = newPlanCosting;
    itemToUpdate.payment_date_val = newPaymentDate;

    // Hitung ulang total
    calculateAndUpdateActuals();
    // Render ulang Tab 1
    loadDetailSales();

    console.log("Updated Plan Costing:", itemToUpdate);
    showNotification("Plan Costing berhasil diupdate!");
  });

  // --- Handler Form Input (Tab 2) ---
  realCalcForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = e.target;
    const tanggal = form.calcTanggal.value;
    const product = form.calcProduct.value;
    const korelasi = form.calcKorelasi.value;
    const harga = parseFloat(form.calcHarga.value || 0);

    if (!tanggal || !product || !korelasi || !harga) {
      return showNotification("Semua field wajib diisi", true);
    }

    // Buat data baru
    const newData = {
      id: `detail-${new Date().getTime()}`, // ID unik
      tanggal,
      product,
      korelasi,
      harga,
    };

    // Tambahkan ke mock data
    mockCalculationDetails.push(newData);
    console.log("Added new detail:", newData);

    // Reset form
    form.reset();

    // --- (RE-KALKULASI & RE-RENDER) ---
    // 1. Hitung ulang semua total
    calculateAndUpdateActuals();
    // 2. Render ulang tabel Tab 2
    loadRealCalculations();

    showNotification("Data detail berhasil ditambahkan!");
  });

  // ==================================================
  // INISIALISASI SAAT HALAMAN DIBUKA
  // ==================================================
  console.log("Page loaded. Initializing demo...");

  // 1. Hitung total berdasarkan data awal
  calculateAndUpdateActuals();

  // 2. Tampilkan Tab 1 dengan data yang sudah dihitung (Ini adalah default)
  loadDetailSales();

  // 3. Siapkan dropdown di form Tab 2
  populateKorelasiDropdown();
});
// Menunggu hingga seluruh konten DOM (HTML) selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // MOCK DATA (Data JSON Sementara)
  // ==================================================

  // Data untuk Tab 1 (Detail Project & Item Pekerjaan)
  let mockProjectData = {
    detail: {
      project_value: 38295000,
      plan_costing: 35000000,
      actual_cost: 0, // Akan dikalkulasi
      margin: 0, // Akan dikalkulasi
      items: [
        {
          id: "item-001",
          sub_category: "JASA",
          product: "Ganti Kabel",
          description: "Penggantian kabel fiber optik utama",
          qty: 1,
          unit: "set",
          unit_price: 30000000,
          total: 30000000,
          plan_costing_val: 30000000,
          actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
          payment_date_val: null,
          materials: [],
        },
        {
          id: "item-002",
          sub_category: "MOB DEMOB",
          product: "Drop Team",
          description: "Mobilisasi tim teknisi ke lokasi",
          qty: 2,
          unit: "Person",
          unit_price: 2500000,
          total: 5000000,
          plan_costing_val: 5000000,
          actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
          payment_date_val: null,
          materials: [],
        },
      ],
    },
  };

  // Data untuk Tab 2 (Detail Pengeluaran Real)
  let mockCalculationDetails = [
    {
      id: "detail-001",
      tanggal: "2025-09-01",
      product: "Kabel Ungu",
      korelasi: "Ganti Kabel",
      harga: 20000000,
    },
    {
      id: "detail-002",
      tanggal: "2025-09-12",
      product: "Kabel PINK",
      korelasi: "Ganti Kabel",
      harga: 50000000,
    },
    {
      id: "detail-003",
      tanggal: "2025-09-13",
      product: "Tiket Pesawat Agus",
      korelasi: "Drop Team",
      harga: 2000000,
    },
    {
      id: "detail-004",
      tanggal: "2025-09-14",
      product: "Tiket Pesawat Nandar",
      korelasi: "Drop Team",
      harga: 1750000,
    },
  ];

  // ==================================================
  // ELEMEN-ELEMEN DOM
  // ==================================================
  // Disimpan dalam variabel agar mudah diakses

  // Tabs
  const tab1 = document.getElementById("tab1");
  const tab2 = document.getElementById("tab2");
  const tab1Btn = document.getElementById("tab1Btn");
  const tab2Btn = document.getElementById("tab2Btn");

  // Elemen Tab 1
  const projectAmountEl = document.getElementById("projectAmount");
  const planCostingEl = document.getElementById("plan_costing");
  const actualCostingEl = document.getElementById("actual_costing");
  const marginEl = document.getElementById("margin");
  const tabelItemBody = document.getElementById("tabelItem");

  // Elemen Tab 2
  const realCalcBody = document.getElementById("realCalcBody");
  const realCalcForm = document.getElementById("realCalcForm");
  const calcKorelasiSelect = document.getElementById("calcKorelasi");

  // Lainnya
  const notificationEl = document.getElementById("notification");

  // ==================================================
  // HELPER FUNCTIONS
  // ==================================================

  // Fungsi untuk format angka ke Rupiah
  function formatNumber(value) {
    if (typeof value !== "number") {
      value = parseFloat(value) || 0;
    }
    return value.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // Fungsi untuk format ke Rupiah (finance)
  function finance(value) {
    return `Rp ${formatNumber(value)}`;
  }

  // Fungsi untuk menampilkan notifikasi
  function showNotification(message, isError = false) {
    notificationEl.textContent = message;
    notificationEl.classList.remove("hidden", "bg-green-500", "bg-red-500");

    if (isError) {
      notificationEl.classList.add("bg-red-500");
    } else {
      notificationEl.classList.add("bg-green-500");
    }

    setTimeout(() => {
      notificationEl.classList.add("hidden");
    }, 3000);
  }

  // ==================================================
  // LOGIC INTI (Kalkulasi & Render)
  // ==================================================

  /**
   * 1. MENGHITUNG TOTAL DARI TAB 2
   * Fungsi ini adalah "otak" dari aplikasi.
   * - Mengambil semua data dari `mockCalculationDetails` (Tab 2).
   * - Menjumlahkannya berdasarkan 'korelasi'.
   * - Meng-update data `mockProjectData` (Tab 1).
   * - Menghitung ulang total summary project.
   */
  function calculateAndUpdateActuals() {
    console.log("Running calculation...");

    let actualsMap = {}; // Cth: { "Ganti Kabel": 70000000, "Drop Team": 3750000 }
    let totalActualCosting = 0;

    // 1. Loop data Tab 2 & buat map total
    mockCalculationDetails.forEach((detail) => {
      if (!actualsMap[detail.korelasi]) {
        actualsMap[detail.korelasi] = 0;
      }
      actualsMap[detail.korelasi] += detail.harga;
    });

    // 2. Loop data Tab 1 & update nilainya pakai map
    mockProjectData.detail.items.forEach((item) => {
      const calculatedCost = actualsMap[item.product] || 0;
      item.actual_costing_val = calculatedCost;
    });

    // 3. Hitung ulang total summary
    const data = mockProjectData.detail;
    data.plan_costing = data.items.reduce(
      (acc, item) => acc + item.plan_costing_val,
      0
    );
    data.actual_cost = data.items.reduce(
      (acc, item) => acc + item.actual_costing_val,
      0
    );
    data.margin = data.project_value - data.actual_cost;
  }

  /**
   * 2. RENDER TAB 1 (Project Costing)
   * Fungsi ini mengambil data dari `mockProjectData` dan menampilkannya di UI.
   */
  async function loadDetailSales() {
    console.log("Rendering Tab 1...");
    try {
      const data = mockProjectData.detail;
      if (!data) throw new Error("Mock data tidak ditemukan");

      // Update header nilai-nilai project
      projectAmountEl.innerHTML = finance(data.project_value);
      planCostingEl.innerHTML = finance(data.plan_costing);
      actualCostingEl.innerHTML = finance(data.actual_cost);
      marginEl.innerHTML = finance(data.margin);

      // Ubah warna margin jika negatif
      if (data.margin < 0) {
        marginEl.classList.remove("text-green-600");
        marginEl.classList.add("text-red-600");
      } else {
        marginEl.classList.remove("text-red-600");
        marginEl.classList.add("text-green-600");
      }

      // Table Body
      tabelItemBody.innerHTML = "";

      if (data.items?.length) {
        const groups = {};
        data.items.forEach((item) => {
          if (!groups[item.sub_category]) groups[item.sub_category] = [];
          groups[item.sub_category].push(item);
        });

        let nomor = 1;

        Object.keys(groups).forEach((subCat) => {
          const trHeader = document.createElement("tr");
          trHeader.className = "bg-gray-200 font-semibold";
          trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase">${
            subCat || "-"
          }</td>`;
          tabelItemBody.appendChild(trHeader);

          groups[subCat].forEach((item) => {
            const tr = document.createElement("tr");
            tr.className = "border-b bg-gray-50";
            tr.dataset.itemId = item.id; // penting untuk update

            tr.innerHTML = `
                            <td class="px-3 py-2 align-top text-sm font-semibold text-center">${nomor++}</td>
                            <td class="px-3 py-2 align-top">
                                <div class="font-medium">${
                                  item.product || "-"
                                }</div>
                                <div class="text-xs text-gray-500">${
                                  item.description || ""
                                }</div>
                            </td>
                            <td class="px-3 py-2 text-right align-top">${
                              item.qty || 0
                            }</td>
                            <td class="px-3 py-2 text-center align-top">${
                              item.unit || ""
                            }</td>
                            <td class="px-3 py-2 text-right align-top">${formatNumber(
                              item.unit_price || 0
                            )}</td>
                            <td class="px-3 py-2 text-right align-top font-semibold">${formatNumber(
                              item.total || 0
                            )}</td>
                            
                            <!-- Kolom Plan Costing (Bisa Diedit) -->
                            <td class="px-3 py-2 text-center align-top">
                                <input class="plancosting text-right border rounded px-2 py-1 w-full" type="number" placeholder="0" value="${
                                  item.plan_costing_val || 0
                                }">
                            </td>
                            
                            <!-- Kolom Actual Costing (Read Only - Hasil Kalkulasi) -->
                            <td class="px-3 py-2 text-center align-top">
                                <input class="actualcost text-right border rounded px-2 py-1 w-full" type="text" placeholder="0" value="${formatNumber(
                                  item.actual_costing_val || 0
                                )}" readonly>
                            </td>
                            
                            <td class="px-3 py-2 text-center align-top">
                                <input type="date" class="payment_date border rounded px-2 py-1 w-full" value="${
                                  item.payment_date_val || ""
                                }">
                            </td>
                            <td class="px-3 py-2 text-center align-top">
                                <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                                    Update
                                </button>
                            </td>
                        `;
            tabelItemBody.appendChild(tr);
          });
        });
      } else {
        tabelItemBody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
      }
    } catch (err) {
      console.error("Gagal load detail:", err);
      showNotification(err.message || "Gagal memuat detail project", true);
    }
  }

  /**
   * 3. RENDER TAB 2 (Real Calculation)
   * Menampilkan data dari `mockCalculationDetails` ke tabel.
   */
  function loadRealCalculations() {
    console.log("Rendering Tab 2...");
    realCalcBody.innerHTML = "";

    if (mockCalculationDetails.length === 0) {
      realCalcBody.innerHTML = `<tr><td colspan="4" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>`;
      return;
    }

    // Urutkan berdasarkan tanggal terbaru
    const sortedDetails = [...mockCalculationDetails].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    );

    sortedDetails.forEach((detail) => {
      const tr = document.createElement("tr");
      tr.className = "border-b";
      tr.innerHTML = `
                <td class="px-3 py-2">${new Date(
                  detail.tanggal
                ).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}</td>
                <td class="px-3 py-2">${detail.product}</td>
                <td class="px-3 py-2 font-medium">${detail.korelasi}</td>
                <td class="px-3 py-2 text-right">${finance(detail.harga)}</td>
            `;
      realCalcBody.appendChild(tr);
    });
  }

  /**
   * 4. POPULATE KORELASI DROPDOWN
   * Mengisi dropdown di form Tab 2 dengan nama pekerjaan dari Tab 1.
   */
  function populateKorelasiDropdown() {
    calcKorelasiSelect.innerHTML =
      '<option value="">-- Pilih Pekerjaan --</option>'; // Reset

    mockProjectData.detail.items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.product;
      option.textContent = item.product;
      calcKorelasiSelect.appendChild(option);
    });
  }

  // ==================================================
  // EVENT LISTENERS
  // ==================================================

  // --- Tab Switching ---
  tab1Btn.addEventListener("click", () => {
    tab1.classList.remove("hidden");
    tab2.classList.add("hidden");
    tab1Btn.classList.add("border-blue-600", "text-blue-600");
    tab2Btn.classList.remove("border-blue-600", "text-blue-600");
    tab2Btn.classList.add("text-gray-500");

    // Refresh data Tab 1 saat diklik
    loadDetailSales();
  });

  tab2Btn.addEventListener("click", () => {
    tab2.classList.remove("hidden");
    tab1.classList.add("hidden");
    tab2Btn.classList.add("border-blue-600", "text-blue-600");
    tab1Btn.classList.remove("border-blue-600", "text-blue-600");
    tab1Btn.classList.add("text-gray-500");

    // Refresh data Tab 2 saat diklik
    loadRealCalculations();
  });

  // --- Handler Tombol Update (Tab 1) ---
  tabelItemBody.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("update-btn")) return;

    const tr = e.target.closest("tr");
    const itemId = tr.dataset.itemId;
    if (!itemId) return showNotification("Item ID tidak ditemukan", true);

    // Ambil input dari user
    const newPlanCosting = parseFloat(
      tr.querySelector(".plancosting")?.value || 0
    );
    const newPaymentDate = tr.querySelector(".payment_date")?.value || "";

    // Cari item di mock data dan update
    const itemToUpdate = mockProjectData.detail.items.find(
      (item) => item.id === itemId
    );
    if (!itemToUpdate)
      return showNotification("Data item tidak ditemukan", true);

    itemToUpdate.plan_costing_val = newPlanCosting;
    itemToUpdate.payment_date_val = newPaymentDate;

    // Hitung ulang total
    calculateAndUpdateActuals();
    // Render ulang Tab 1
    loadDetailSales();

    console.log("Updated Plan Costing:", itemToUpdate);
    showNotification("Plan Costing berhasil diupdate!");
  });

  // --- Handler Form Input (Tab 2) ---
  realCalcForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = e.target;
    const tanggal = form.calcTanggal.value;
    const product = form.calcProduct.value;
    const korelasi = form.calcKorelasi.value;
    const harga = parseFloat(form.calcHarga.value || 0);

    if (!tanggal || !product || !korelasi || !harga) {
      return showNotification("Semua field wajib diisi", true);
    }

    // Buat data baru
    const newData = {
      id: `detail-${new Date().getTime()}`, // ID unik
      tanggal,
      product,
      korelasi,
      harga,
    };

    // Tambahkan ke mock data
    mockCalculationDetails.push(newData);
    console.log("Added new detail:", newData);

    // Reset form
    form.reset();

    // --- (RE-KALKULASI & RE-RENDER) ---
    // 1. Hitung ulang semua total
    calculateAndUpdateActuals();
    // 2. Render ulang tabel Tab 2
    loadRealCalculations();

    showNotification("Data detail berhasil ditambahkan!");
  });

  // ==================================================
  // INISIALISASI SAAT HALAMAN DIBUKA
  // ==================================================
  console.log("Page loaded. Initializing demo...");

  // 1. Hitung total berdasarkan data awal
  calculateAndUpdateActuals();

  // 2. Tampilkan Tab 1 dengan data yang sudah dihitung (Ini adalah default)
  loadDetailSales();

  // 3. Siapkan dropdown di form Tab 2
  populateKorelasiDropdown();
});
// ==================================================
// MOCK DATA (Data JSON Sementara)
// ==================================================

// Data untuk Tab 1 (Detail Project & Item Pekerjaan)
let mockProjectData = {
  detail: {
    project_value: 38295000,
    plan_costing: 35000000,
    actual_cost: 0, // Akan dikalkulasi
    margin: 0, // Akan dikalkulasi
    items: [
      {
        id: "item-001",
        sub_category: "JASA",
        product: "Ganti Kabel",
        description: "Penggantian kabel fiber optik utama",
        qty: 1,
        unit: "set",
        unit_price: 30000000,
        total: 30000000,
        plan_costing_val: 30000000,
        actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
        payment_date_val: null,
        materials: [],
      },
      {
        id: "item-002",
        sub_category: "MOB DEMOB",
        product: "Drop Team",
        description: "Mobilisasi tim teknisi ke lokasi",
        qty: 2,
        unit: "Person",
        unit_price: 2500000,
        total: 5000000,
        plan_costing_val: 5000000,
        actual_costing_val: 0, // Akan dikalkulasi dari Tab 2
        payment_date_val: null,
        materials: [],
      },
    ],
  },
};

// Data untuk Tab 2 (Detail Pengeluaran Real)
let mockCalculationDetails = [
  {
    id: "detail-001",
    tanggal: "2025-09-01",
    product: "Kabel Ungu",
    korelasi: "Ganti Kabel",
    harga: 20000000,
  },
  {
    id: "detail-002",
    tanggal: "2025-09-12",
    product: "Kabel PINK",
    korelasi: "Ganti Kabel",
    harga: 50000000,
  },
  {
    id: "detail-003",
    tanggal: "2025-09-13",
    product: "Tiket Pesawat Agus",
    korelasi: "Drop Team",
    harga: 2000000,
  },
  {
    id: "detail-004",
    tanggal: "2025-09-14",
    product: "Tiket Pesawat Nandar",
    korelasi: "Drop Team",
    harga: 1750000,
  },
];

// ==================================================
// HELPER FUNCTIONS
// ==================================================

// Fungsi untuk format angka ke Rupiah
function formatNumber(value) {
  if (typeof value !== "number") {
    value = parseFloat(value) || 0;
  }
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Fungsi untuk format ke Rupiah (finance)
function finance(value) {
  return `Rp ${formatNumber(value)}`;
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, isError = false) {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.classList.remove("hidden", "bg-green-500", "bg-red-500");

  if (isError) {
    notif.classList.add("bg-red-500");
  } else {
    notif.classList.add("bg-green-500");
  }

  setTimeout(() => {
    notif.classList.add("hidden");
  }, 3000);
}

// ==================================================
// LOGIC INTI (Kalkulasi & Render)
// ==================================================

/**
 * 1. MENGHITUNG TOTAL DARI TAB 2
 * Fungsi ini adalah "otak" dari aplikasi.
 * - Mengambil semua data dari `mockCalculationDetails` (Tab 2).
 * - Menjumlahkannya berdasarkan 'korelasi'.
 * - Meng-update data `mockProjectData` (Tab 1).
 * - Menghitung ulang total summary project.
 */
function calculateAndUpdateActuals() {
  console.log("Running calculation...");

  let actualsMap = {}; // Cth: { "Ganti Kabel": 70000000, "Drop Team": 3750000 }
  let totalActualCosting = 0;

  // 1. Loop data Tab 2 & buat map total
  mockCalculationDetails.forEach((detail) => {
    if (!actualsMap[detail.korelasi]) {
      actualsMap[detail.korelasi] = 0;
    }
    actualsMap[detail.korelasi] += detail.harga;
  });

  // 2. Loop data Tab 1 & update nilainya pakai map
  mockProjectData.detail.items.forEach((item) => {
    const calculatedCost = actualsMap[item.product] || 0;
    item.actual_costing_val = calculatedCost;
  });

  // 3. Hitung ulang total summary
  const data = mockProjectData.detail;
  data.plan_costing = data.items.reduce(
    (acc, item) => acc + item.plan_costing_val,
    0
  );
  data.actual_cost = data.items.reduce(
    (acc, item) => acc + item.actual_costing_val,
    0
  );
  data.margin = data.project_value - data.actual_cost;
}

/**
 * 2. RENDER TAB 1 (Project Costing)
 * Fungsi ini mengambil data dari `mockProjectData` dan menampilkannya di UI.
 */
async function loadDetailSales() {
  console.log("Rendering Tab 1...");
  try {
    const data = mockProjectData.detail;
    if (!data) throw new Error("Mock data tidak ditemukan");

    // Update header nilai-nilai project
    document.getElementById("projectAmount").innerHTML = finance(
      data.project_value
    );
    document.getElementById("plan_costing").innerHTML = finance(
      data.plan_costing
    );
    document.getElementById("actual_costing").innerHTML = finance(
      data.actual_cost
    );
    document.getElementById("margin").innerHTML = finance(data.margin);

    // Ubah warna margin jika negatif
    const marginEl = document.getElementById("margin");
    if (data.margin < 0) {
      marginEl.classList.remove("text-green-600");
      marginEl.classList.add("text-red-600");
    } else {
      marginEl.classList.remove("text-red-600");
      marginEl.classList.add("text-green-600");
    }

    // Table Body
    const tbody = document.getElementById("tabelItem");
    tbody.innerHTML = "";

    if (data.items?.length) {
      const groups = {};
      data.items.forEach((item) => {
        if (!groups[item.sub_category]) groups[item.sub_category] = [];
        groups[item.sub_category].push(item);
      });

      let nomor = 1;

      Object.keys(groups).forEach((subCat) => {
        const trHeader = document.createElement("tr");
        trHeader.className = "bg-gray-200 font-semibold";
        trHeader.innerHTML = `<td colspan="10" class="px-3 py-2 uppercase">${
          subCat || "-"
        }</td>`;
        tbody.appendChild(trHeader);

        groups[subCat].forEach((item) => {
          const tr = document.createElement("tr");
          tr.className = "border-b bg-gray-50";
          tr.dataset.itemId = item.id; // penting untuk update

          tr.innerHTML = `
                        <td class="px-3 py-2 align-top text-sm font-semibold text-center">${nomor++}</td>
                        <td class="px-3 py-2 align-top">
                            <div class="font-medium">${
                              item.product || "-"
                            }</div>
                            <div class="text-xs text-gray-500">${
                              item.description || ""
                            }</div>
                        </td>
                        <td class="px-3 py-2 text-right align-top">${
                          item.qty || 0
                        }</td>
                        <td class="px-3 py-2 text-center align-top">${
                          item.unit || ""
                        }</td>
                        <td class="px-3 py-2 text-right align-top">${formatNumber(
                          item.unit_price || 0
                        )}</td>
                        <td class="px-3 py-2 text-right align-top font-semibold">${formatNumber(
                          item.total || 0
                        )}</td>
                        
                        <!-- Kolom Plan Costing (Bisa Diedit) -->
                        <td class="px-3 py-2 text-center align-top">
                            <input class="plancosting text-right border rounded px-2 py-1 w-full" type="number" placeholder="0" value="${
                              item.plan_costing_val || 0
                            }">
                        </td>
                        
                        <!-- Kolom Actual Costing (Read Only - Hasil Kalkulasi) -->
                        <td class="px-3 py-2 text-center align-top">
                            <input class="actualcost text-right border rounded px-2 py-1 w-full" type="text" placeholder="0" value="${formatNumber(
                              item.actual_costing_val || 0
                            )}" readonly>
                        </td>
                        
                        <td class="px-3 py-2 text-center align-top">
                            <input type="date" class="payment_date border rounded px-2 py-1 w-full" value="${
                              item.payment_date_val || ""
                            }">
                        </td>
                        <td class="px-3 py-2 text-center align-top">
                            <button class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded update-btn">
                                Update
                            </button>
                        </td>
                    `;
          tbody.appendChild(tr);

          // Note: Logic untuk 'materials' (sub-item) tidak saya sertakan agar fokus ke alur utama
        });
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 italic py-3">Tidak ada item</td></tr>`;
    }
  } catch (err) {
    console.error("Gagal load detail:", err);
    showNotification(err.message || "Gagal memuat detail project", true);
  }
}

/**
 * 3. RENDER TAB 2 (Real Calculation)
 * Menampilkan data dari `mockCalculationDetails` ke tabel.
 */
function loadRealCalculations() {
  console.log("Rendering Tab 2...");
  const tbody = document.getElementById("realCalcBody");
  tbody.innerHTML = "";

  if (mockCalculationDetails.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center italic text-gray-500 py-3">Belum ada data</td></tr>`;
    return;
  }

  // Urutkan berdasarkan tanggal terbaru
  const sortedDetails = [...mockCalculationDetails].sort(
    (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
  );

  sortedDetails.forEach((detail) => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
            <td class="px-3 py-2">${new Date(detail.tanggal).toLocaleDateString(
              "id-ID",
              { day: "2-digit", month: "long", year: "numeric" }
            )}</td>
            <td class="px-3 py-2">${detail.product}</td>
            <td class="px-3 py-2 font-medium">${detail.korelasi}</td>
            <td class="px-3 py-2 text-right">${finance(detail.harga)}</td>
        `;
    tbody.appendChild(tr);
  });
}

/**
 * 4. POPULATE KORELASI DROPDOWN
 * Mengisi dropdown di form Tab 2 dengan nama pekerjaan dari Tab 1.
 */
function populateKorelasiDropdown() {
  const select = document.getElementById("calcKorelasi");
  select.innerHTML = '<option value="">-- Pilih Pekerjaan --</option>'; // Reset

  mockProjectData.detail.items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.product;
    option.textContent = item.product;
    select.appendChild(option);
  });
}

// ==================================================
// EVENT LISTENERS
// ==================================================

// --- Tab Switching ---
const tab1 = document.getElementById("tab1");
const tab2 = document.getElementById("tab2");
const tab1Btn = document.getElementById("tab1Btn");
const tab2Btn = document.getElementById("tab2Btn");

tab1Btn.addEventListener("click", () => {
  tab1.classList.remove("hidden");
  tab2.classList.add("hidden");
  tab1Btn.classList.add("border-blue-600", "text-blue-600");
  tab2Btn.classList.remove("border-blue-600", "text-blue-600");
  tab2Btn.classList.add("text-gray-500");

  // Refresh data Tab 1 saat diklik
  loadDetailSales();
});

tab2Btn.addEventListener("click", () => {
  tab2.classList.remove("hidden");
  tab1.classList.add("hidden");
  tab2Btn.classList.add("border-blue-600", "text-blue-600");
  tab1Btn.classList.remove("border-blue-600", "text-blue-600");
  tab1Btn.classList.add("text-gray-500");

  // Refresh data Tab 2 saat diklik
  loadRealCalculations();
});

// --- Handler Tombol Update (Tab 1) ---
document.getElementById("tabelItem").addEventListener("click", async (e) => {
  if (!e.target.classList.contains("update-btn")) return;

  const tr = e.target.closest("tr");
  const itemId = tr.dataset.itemId;
  if (!itemId) return showNotification("Item ID tidak ditemukan", true);

  // Ambil input dari user
  const newPlanCosting = parseFloat(
    tr.querySelector(".plancosting")?.value || 0
  );
  const newPaymentDate = tr.querySelector(".payment_date")?.value || "";

  // Cari item di mock data dan update
  const itemToUpdate = mockProjectData.detail.items.find(
    (item) => item.id === itemId
  );
  if (!itemToUpdate) return showNotification("Data item tidak ditemukan", true);

  itemToUpdate.plan_costing_val = newPlanCostRosting;
  itemToUpdate.payment_date_val = newPaymentDate;

  // Hitung ulang total
  calculateAndUpdateActuals();
  // Render ulang Tab 1
  loadDetailSales();

  console.log("Updated Plan Costing:", itemToUpdate);
  showNotification("Plan Costing berhasil diupdate!");
});

// --- Handler Form Input (Tab 2) ---
document.getElementById("realCalcForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const form = e.target;
  const tanggal = form.calcTanggal.value;
  const product = form.calcProduct.value;
  const korelasi = form.calcKorelasi.value;
  const harga = parseFloat(form.calcHarga.value || 0);

  if (!tanggal || !product || !korelasi || !harga) {
    return showNotification("Semua field wajib diisi", true);
  }

  // Buat data baru
  const newData = {
    id: `detail-${new Date().getTime()}`, // ID unik
    tanggal,
    product,
    korelasi,
    harga,
  };

  // Tambahkan ke mock data
  mockCalculationDetails.push(newData);
  console.log("Added new detail:", newData);

  // Reset form
  form.reset();

  // --- (RE-KALKULASI & RE-RENDER) ---
  // 1. Hitung ulang semua total
  calculateAndUpdateActuals();
  // 2. Render ulang tabel Tab 2
  loadRealCalculations();

  showNotification("Data detail berhasil ditambahkan!");
});

// ==================================================
// INISIALISASI SAAT HALAMAN DIBUKA
// ==================================================
window.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded. Initializing demo...");

  // 1. Hitung total berdasarkan data awal
  calculateAndUpdateActuals();

  // 2. Tampilkan Tab 1 dengan data yang sudah dihitung
  loadDetailSales();

  // 3. Siapkan dropdown di form Tab 2
  populateKorelasiDropdown();
});
