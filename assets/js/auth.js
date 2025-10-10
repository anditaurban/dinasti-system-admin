// === Konstanta API dan Token ===
const owner_id = 1;
const token =
  "e29c2e3db5f5299dc954eae580893689c35ecde79f40213365f56fb54850f9b1";
const otpUrl = "https://dev.dinastielektrik.cloud/login";
const loginUrl = "https://dev.dinastielektrik.cloud/otp/login/";
const profileUrl = "https://prod.katib.cloud/profile";
const companyUrl = "https://prod.katib.cloud/company";
const expiredTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 hari

// === Elemen DOM ===
const phoneInput = document.getElementById("phone");
const sendOtpButton = document.getElementById("send-otp");
const messageElement = document.getElementById("message");
const loadingOTP = document.getElementById("loadingOTP");
const otpSection = document.getElementById("otp-section");
const otpDigits = document.querySelectorAll(".otp-digit");
const verificationStatus = document.getElementById("verification-status");
const otpContainer = document.getElementById("otp-container");

// === Variabel Global ===
let currentUser = null;
let autoVerifyTimeout = null;

// === Validasi Input Nomor Telepon ===
phoneInput?.addEventListener("input", function () {
  const inputValue = this.value.trim();
  const isValid = /^\d+$/.test(inputValue);

  if (inputValue === "") {
    sendOtpButton.disabled = true;
    messageElement.textContent = "";
  } else if (!isValid) {
    sendOtpButton.disabled = true;
    showMessage("Mohon masukkan hanya angka untuk nomor Whatsapp.", "red");
  } else if (inputValue.length < 10) {
    sendOtpButton.disabled = true;
    showMessage("Nomor Whatsapp terlalu pendek.", "red");
  } else {
    sendOtpButton.disabled = false;
    messageElement.textContent = "";
  }
});

otpDigits.forEach((digit, index) => {
  digit.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, ""); // hanya angka

    // Auto fokus ke kotak berikutnya
    if (this.value && index < otpDigits.length - 1) {
      otpDigits[index + 1].focus();
    }

    checkOtpCompletion();
  });

  // Backspace
  digit.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && !this.value && index > 0) {
      otpDigits[index - 1].focus();
    }
  });
});

// Handle paste di seluruh container
otpContainer.addEventListener("paste", function (e) {
  e.preventDefault();
  const pastedData = e.clipboardData
    .getData("text")
    .replace(/\D/g, "")
    .slice(0, 6);
  pastedData.split("").forEach((num, i) => {
    if (i < otpDigits.length) {
      otpDigits[i].value = num;
    }
  });

  // Fokus ke kotak terakhir
  const lastIndex = Math.min(pastedData.length - 1, otpDigits.length - 1);
  otpDigits[lastIndex].focus();

  checkOtpCompletion();
});

// Cek jika semua kotak terisi
function checkOtpCompletion() {
  const otp = Array.from(otpDigits)
    .map((d) => d.value)
    .join("");

  if (otp.length === otpDigits.length) {
    verificationStatus.classList.remove("hidden");

    if (autoVerifyTimeout) clearTimeout(autoVerifyTimeout);

    autoVerifyTimeout = setTimeout(() => {
      verifyOtp(); // panggil fungsi verifikasi OTP kamu
    }, 500);
  } else {
    verificationStatus.classList.add("hidden");
  }
}

function handlePasteOtp(pastedData) {
  const digits = pastedData.replace(/\D/g, "").split("").slice(0, 6);

  if (digits.length > 0) {
    digits.forEach((digit, index) => {
      if (index < otpDigits.length) {
        otpDigits[index].value = digit;
      }
    });

    // Fokus ke input terakhir yang terisi
    const lastFilledIndex = Math.min(digits.length - 1, otpDigits.length - 1);
    otpDigits[lastFilledIndex].focus();

    // Jalankan auto-verifikasi jika semua digit sudah terisi
    checkOtpCompletion();
  }
}

// === Fungsi untuk menangani input OTP ===
function handleOtpInput() {
  otpDigits.forEach((digit, index) => {
    // Input normal
    digit.addEventListener("input", function (e) {
      this.value = this.value.replace(/\D/g, ""); // hanya angka

      // Auto focus next
      if (this.value && index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
      }

      checkOtpCompletion();
    });

    // Backspace
    digit.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !this.value && index > 0) {
        otpDigits[index - 1].focus();
      }
    });
  });

  // Handle paste pada seluruh container
  otpContainer.addEventListener("paste", function (e) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    handlePasteOtp(pastedData);
  });
}


// === Handle paste OTP ===
function handlePasteOtp(pastedData) {
  const digits = pastedData.replace(/\D/g, "").split("").slice(0, 6);

  if (digits.length === 6) {
    digits.forEach((digit, index) => {
      if (index < otpDigits.length) {
        otpDigits[index].value = digit;
      }
    });

    // Focus on the last digit
    otpDigits[5].focus();

    // Check for auto verification
    checkOtpCompletion();
  }
}

// === Check if OTP is complete for auto verification ===
function checkOtpCompletion() {
  const otp = Array.from(otpDigits)
    .map((d) => d.value)
    .join("");

  if (otp.length === 6) {
    // Show verification status
    verificationStatus.classList.remove("hidden");

    // Clear any previous timeout
    if (autoVerifyTimeout) {
      clearTimeout(autoVerifyTimeout);
    }

    // Set timeout for auto verification (1 second delay for UX)
    autoVerifyTimeout = setTimeout(() => {
      verifyOtp();
    }, 1000);
  } else {
    verificationStatus.classList.add("hidden");
  }
}

// === Kirim OTP ===
sendOtpButton?.addEventListener("click", async function () {
  const phoneNumber = phoneInput?.value.trim();

  if (!phoneNumber) {
    showMessage("Nomor Whatsapp tidak boleh kosong", "red");
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
      showMessage("Nomor Whatsapp tidak terdaftar!", "red");
    } else if (result?.data) {
      currentUser = { phone: phoneNumber };
      showMessage("OTP telah dikirim ke WhatsApp anda!", "green");

      // Tampilkan bagian OTP
      otpSection.classList.remove("hidden");
      sendOtpButton.classList.add("hidden");
      phoneInput.readOnly = true;

      // Fokus ke input OTP pertama
      otpDigits[0].focus();
    } else {
      showMessage("Gagal mengirim OTP. Silahkan coba lagi.", "orange");
    }
  } catch (error) {
    console.error("Error fetching OTP:", error);
    showMessage("Gagal mengirim OTP. Silahkan coba lagi.", "orange");
  } finally {
    hideLoading();
    sendOtpButton.disabled = false;
  }
});

// === Verifikasi OTP ===
async function verifyOtp() {
  const otp = Array.from(otpDigits)
    .map((d) => d.value)
    .join("");

  if (otp.length !== 6) {
    showMessage("Harap masukkan 6 digit OTP", "red");
    verificationStatus.classList.add("hidden");
    return;
  }

  verificationStatus.classList.remove("hidden");
  disableOtpInputs(true);

  try {
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      showMessage(
        result.message || "OTP tidak valid. Silakan coba lagi.",
        "red"
      );
      verificationStatus.classList.add("hidden");
      resetOtpFields();
    }
  } catch (error) {
    console.error("Error validating OTP:", error);
    showMessage("Terjadi kesalahan saat memvalidasi OTP.", "red");
    verificationStatus.classList.add("hidden");
  } finally {
    disableOtpInputs(false);
  }
}

// === Reset OTP fields ===
function resetOtpFields() {
  otpDigits.forEach((digit) => {
    digit.value = "";
  });
  otpDigits[0].focus();
}

// === Enable/disable OTP inputs ===
function disableOtpInputs(disabled) {
  otpDigits.forEach((digit) => {
    digit.disabled = disabled;
  });
}

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

function showMessage(message, color) {
  messageElement.textContent = message;
  messageElement.style.color = color;
}

// Inisialisasi handler OTP saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  handleOtpInput();

  // Disable send OTP button initially
  sendOtpButton.disabled = true;
});
