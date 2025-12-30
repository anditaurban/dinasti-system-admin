pagemodule = "Account Receivable";
subpagemodule = "";
renderHeader();
colSpanCount = 13;
setDataType("account_receivable");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  // Hitung sisa tagihan (Balance) = Nilai Kontrak - Nominal yang diterima
  // Jika nominal 0, maka balance = contract_amount
  const balanceAmount = item.contract_amount - item.nominal;

  // Hitung persentase sisa
  const receivedPercent = parseFloat(item.payment_percentage || 0);
  const balancePercent = (100 - receivedPercent).toFixed(1);

  return `
  <tr class="flex flex-col sm:table-row border-b border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition">
    
    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="text-xs text-gray-500">${item.tanggal_transaksi}</div>
        <div class="text-gray-900 font-medium break-all">${
          item.inv_number
        }</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-bold text-gray-900 line-clamp-2">${
          item.project_name
        }</div>
        <div class="text-xs text-gray-500">${item.pelanggan_nama}</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-medium text-gray-900">${finance(item.nominal)}</div>
        <div class="text-xs text-gray-500">${receivedPercent}% from Total</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="flex flex-col gap-1">
        <div class="font-medium text-gray-900">${finance(balanceAmount)}</div>
        <div class="text-xs text-gray-500">${balancePercent}% from Total</div>
      </div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
      <div class="text-gray-700 line-clamp-3">${item.keterangan}</div>
    </td>

    <td class="align-top px-4 py-3 border-r border-gray-200 sm:table-cell">
       <div class="flex flex-col">
        ${
          item.nama_akun !== "-"
            ? `<span class="font-semibold">${item.nama_akun} (${item.number_account})</span>`
            : "-"
        }
        <span class="text-xs text-gray-500">${
          item.owner_account !== "-" ? item.owner_account : ""
        }</span>
      </div>
    </td>

    <td class="align-middle px-4 py-3 border-r border-gray-200 text-center sm:table-cell">
      <span class="text-xs font-medium text-gray-600 block">
        ${item.aging_days.replace("days", "Days").replace("to", "<br>to")}
      </span>
    </td>

    <td class="align-middle px-4 py-3 text-center sm:table-cell">
      <span class="text-xs font-bold px-2 py-1 rounded ${
        item.receivable_status === "Received"
          ? "text-green-700 bg-green-100"
          : "text-gray-600 bg-gray-200"
      }">
        ${item.receivable_status.toUpperCase()}
      </span>
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
