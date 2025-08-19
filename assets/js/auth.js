// === Konstanta API dan Token ===
const owner_id = 1;
const token =
  "e29c2e3db5f5299dc954eae580893689c35ecde79f40213365f56fb54850f9b1";
const otpUrl = "https://devdinasti.katib.cloud/login";
const loginUrl = "https://devdinasti.katib.cloud/otp/login/";
const profileUrl = "https://prod.katib.cloud/profile";
const companyUrl = "https://prod.katib.cloud/company";
const expiredTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 hari

// === Elemen DOM ===
const phoneInput = document.getElementById("phone");
const sendOtpButton = document.getElementById("send-otp");
const verifyOtpButton = document.getElementById("verify-otp");
const messageElement = document.getElementById("message");
const loadingOTP = document.getElementById("loadingOTP");
const otpSection = document.getElementById("otp-section");
const otpDigits = document.querySelectorAll(".otp-digit");

// === Variabel Global ===
let currentUser = null;

// === Validasi Input Nomor Telepon ===
phoneInput?.addEventListener("input", function () {
  const inputValue = this.value.trim();
  const isValid = /^\d+$/.test(inputValue);

  if (inputValue === "") {
    sendOtpButton.disabled = true;
    messageElement.textContent = "";
  } else if (!isValid) {
    sendOtpButton.disabled = true;
    messageElement.textContent =
      "Mohon masukkan hanya angka untuk nomor Whatsapp.";
    messageElement.style.color = "red";
  } else {
    sendOtpButton.disabled = false;
    messageElement.textContent = "";
  }
});

// === Fungsi untuk menangani input OTP ===
function handleOtpInput() {
  otpDigits.forEach((digit, index) => {
    digit.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "");
      if (this.value && index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
      }
    });

    digit.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !this.value && index > 0) {
        otpDigits[index - 1].focus();
      }
    });
  });
}

// === Kirim OTP ===
sendOtpButton?.addEventListener("click", async function () {
  const phoneNumber = phoneInput?.value.trim();
  if (!phoneNumber) {
    messageElement.textContent = "Nomor Whatsapp tidak boleh kosong";
    messageElement.style.color = "red";
    return;
  }

  showLoading();
  sendOtpButton.disabled = true;

  try {
    const response = await fetch(`${otpUrl}/${owner_id}/${phoneNumber}`, {
      method: "GET",
    });
    const result = await response.json();

    if (!response.ok) {
      messageElement.textContent = "Nomor Whatsapp tidak terdaftar!";
      messageElement.style.color = "red";
    } else if (result?.data) {
      currentUser = { phone: phoneNumber };
      messageElement.textContent = "OTP telah dikirim ke WhatsApp anda!";
      messageElement.style.color = "green";

      // Tampilkan bagian OTP
      otpSection.classList.remove("hidden");
      sendOtpButton.classList.add("hidden");
      verifyOtpButton.classList.remove("hidden");
      phoneInput.readOnly = true;

      // Fokus ke input OTP pertama
      otpDigits[0].focus();
    } else {
      messageElement.textContent = "Gagal mengirim OTP. Silahkan coba lagi.";
      messageElement.style.color = "orange";
    }
  } catch (error) {
    console.error("Error fetching OTP:", error);
    messageElement.textContent = "Gagal mengirim OTP. Silahkan coba lagi.";
    messageElement.style.color = "orange";
  } finally {
    hideLoading();
    sendOtpButton.disabled = false;
  }
});

// === Verifikasi OTP ===
verifyOtpButton?.addEventListener("click", async function () {
  const otp = Array.from(otpDigits)
    .map((d) => d.value)
    .join("");

  if (otp.length !== 6) {
    messageElement.textContent = "Harap masukkan 6 digit OTP";
    messageElement.style.color = "red";
    return;
  }

  showLoading();
  verifyOtpButton.disabled = true;

  try {
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: currentUser.phone,
        otp,
        owner_id: owner_id,
      }),
    });

    const result = await response.json();
    console.log("API Response:", result);

    if (response.ok && result.user_id) {
      // Simpan data user ke localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...result,
          expiredTime,
        })
      );

      // Redirect ke halaman utama
      window.location.href = "index.html";
    } else {
      messageElement.textContent =
        result.message || "OTP tidak valid. Silakan coba lagi.";
      messageElement.style.color = "red";
    }
  } catch (error) {
    console.error("Error validating OTP:", error);
    messageElement.textContent = "Terjadi kesalahan saat memvalidasi OTP.";
    messageElement.style.color = "red";
  } finally {
    hideLoading();
    verifyOtpButton.disabled = false;
  }
});

// === Utilitas ===
function showLoading() {
  if (loadingOTP) {
    loadingOTP.classList.remove("hidden");
  }
}

function hideLoading() {
  if (loadingOTP) {
    loadingOTP.classList.add("hidden");
  }
}

// Inisialisasi handler OTP saat halaman dimuat
handleOtpInput();
