pagemodule = "detail_project";

async function tambahItem() {
  const tbody = document.getElementById("tabelItem");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="border px-3 py-2">
        <input type="text" class="w-full border rounded px-2 itemProduct" placeholder="product">
    </td>
    <td class="border px-3 py-2">
        <select class="w-full border rounded px-2 itemSubcategory">
            <option value="">Loading...</option>
        </select>
    </td>
    <td class="border px-3 py-2">
        <input type="text" class="w-full border rounded px-2 itemDesc" placeholder="Deskripsi">
    </td>
    <td class="border px-3 py-2 w-[10%]">
        <input type="text" class="w-full border rounded px-2 itemUnit" placeholder="pcs/lusin">
    </td>
    <td class="border px-3 py-2 w-[12%]">
        <input type="number" class="w-full border rounded px-2 itemQty text-right" value="1" oninput="recalculateTotal()">
    </td>
    <td class="border px-3 py-2 w-[17%]">
        <input type="text" class="w-full border rounded px-2 itemHarga text-right" value="0" oninput="recalculateTotal()">
    </td>
    <td class="border px-3 py-2 text-right w-[12%] itemTotal">0</td>
    <td class="border px-3 py-2 text-center w-[10%]">
        <button onclick="hapusItem(this)" class="text-red-500 hover:underline">Hapus</button>
    </td>
  `;

  tbody.appendChild(tr);

  setupRupiahFormattingForElement(tr.querySelector(".itemHarga"));

  const subcategorySelect = tr.querySelector(".itemSubcategory");
  await loadSubcategories(subcategorySelect);
}
