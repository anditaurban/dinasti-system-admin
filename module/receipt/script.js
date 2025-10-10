pagemodule = "Receipt";
subpagemodule = "";
renderHeader();
colSpanCount = 9;
setDataType("sales_receipt");
fetchAndUpdateData();

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
  
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Tanggal</span>
      ${item.tanggal_transaksi}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">No. Receipt</span>
      ${item.receipt_number}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Project</span>  
      ${item.project_name}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Pelanggan</span>
      ${item.pelanggan_nama}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Akun</span>
      ${item.nama_akun}
    </td>
  
    <td class="px-6 py-4 text-right text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Jumlah</span>
      ${finance(item.nominal)}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Keterangan</span>
      ${item.keterangan}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <div class="flex flex-col">
        <span class="font-medium sm:hidden">Status</span>
        <span>${item.status || "Pending"}</span>
        <span class="text-xs text-gray-500">Approved By : ${item.pic_name || "-"}</span>
      </div>
    </td>
    
    <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
      <button onclick="event.stopPropagation(); loadModuleContent('receipt_detail', '${item.receipt_id}', '${item.receipt_number}');"
        class="block w-full text-left px-4 py-2 hover:bg-gray-100">
        👁️ View Detail
      </button>
    </div>
  </tr>`;
};