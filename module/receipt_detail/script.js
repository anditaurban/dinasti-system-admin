pagemodule = "Receipt";
subpagemodule = "Receipt Detail";
renderHeader();
loadReceiptDetail(window.detail_id);
renderCompanyInfo();
loadLogoWithAuth(user.logo_url);

async function loadReceiptDetail(receipt_id) {

  // 🔹 Tampilkan loading
  Swal.fire({
    title: "Loading...",
    text: "Sedang memuat detail data, mohon tunggu.",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const res = await fetch(`${baseUrl}/detail/sales_receipt/${receipt_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_TOKEN}` // ⬅️ tambahin ini
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const d = data.detail;

    // inject ke HTML
    document.getElementById("receiptNumber").textContent = d.receipt_number;
    document.getElementById("invoiceNumber").textContent = d.inv_number;
    document.getElementById("refNumber").textContent = d.ref;
    document.getElementById("pelangganNama").textContent = d.pelanggan_nama;
    document.getElementById("terbilang").textContent = d.terbilang;
    document.getElementById("keterangan").textContent = d.keterangan;
    document.getElementById("nominal").textContent =
      `Rp ${Number(d.nominal).toLocaleString("id-ID")}`;
    document.getElementById("tanggal").textContent = d.tanggal;


    // ✅ Tutup loading
    Swal.close();

  } catch (error) {
    console.error("Error load receipt:", error);
  }
}

async function printReceipt(pesanan_id) {
  try {
    const response = await fetch(`${baseUrl}/detail/sales_receipt/${pesanan_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();
    const detail = result?.detail;
    if (!detail) throw new Error("Data faktur tidak ditemukan");

    const swalResult = await Swal.fire({
      title: "Cetak Receipt",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Print Preview",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (swalResult.isConfirmed) {
      // Jika klik Print Preview
      window.open(`receipt_print.html?id=${pesanan_id}`, "_blank");
    }
    // Jika Cancel → Swal otomatis close, tidak perlu aksi tambahan

  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message || "Terjadi kesalahan saat memuat faktur.",
      icon: "error",
    });
  }
}
