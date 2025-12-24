pagemodule = "Account Receivable";
subpagemodule = "";
renderHeader();
colSpanCount = 13;
setDataType("account_receivable");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
    <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">  
     <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
        <span class="font-medium sm:hidden">Name</span>  
        <div class="font-semibold text-center">${item.tanggal_transaksi}</div>
        <div class="text-gray-600 text-center">${item.po_number}</div>
      </td>

    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
    <div class="font-semibold">${item.project_name}</div>
        <div class="text-gray-500">${item.pelanggan_nama}</div>
    </td>
  
    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      <div class="flex flex-col">
        <div class="font-semibol">${finance(item.contract_amount)}</div>
      </div>
    </td>


  
    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      <div class="font-semibold">${finance(item.nominal)}</div>
        <div class="text-gray-500">${item.payment_percentage}</div>
    </td>

    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      <div class="">${item.keterangan}</div>
    </td>
   
  
    <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      ${item.nama_akun} (${item.number_account})- ${item.owner_account}
    </td>
  
    <td class="align-top px-6 py-4 text-sm text-gray-700 text-right border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      ${item.aging_days}
    </td>
     <td class="align-top px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      <div class="font-semibold">${item.receivable_status}</div>
    </td>

  </tr>`;
};

async function confirmPayment(receipt_id, status_value) {
  const { isConfirmed } = await Swal.fire({
    title: "Konfirmasi Pembayaran",
    text: "Apakah Anda yakin ingin mengonfirmasi pembayaran ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Konfirmasi",
    cancelButtonText: "Batal",
  });

  if (!isConfirmed) return;

  try {
    const response = await fetch(
      `${baseUrl}/update/sales_receipt_status/${receipt_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ status_id: status_value, user_id: user_id }),
      }
    );

    const result = await response.json();

    // sesuai struktur response kamu
    if (result?.response === "200") {
      Swal.fire({
        title: "Berhasil!",
        text: result.message || "Status berhasil diperbarui.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      // refresh data tabel/list
      fetchAndUpdateData();
    } else {
      throw new Error(result.message || "Gagal memperbarui status");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}
