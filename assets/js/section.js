document.getElementById("logout").addEventListener("click", function () {
  Swal.fire({
    title: "Yakin ingin logout?",
    text: "Anda harus login kembali untuk mengakses aplikasi.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e3342f",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Logout",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      sessionStorage.clear();
      localStorage.clear();
      Swal.fire({
        icon: "success",
        title: "Berhasil logout!",
        showConfirmButton: false,
        timer: 1200,
      }).then(() => {
        window.location.href = "login.html";
      });
    }
  });
});

// if (owner_id || user_id || level || username) {
//     const welcomeMessageSpan = document.getElementById('nameUser');
//     welcomeMessageSpan.textContent = `Hi, ${username} 👋`;
// }

expandSidebar();

function collapseSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  document
    .querySelectorAll("#sidebar .menu-text")
    .forEach((el) => el.classList.add("hidden"));
  sidebar.classList.add("w-16");
  sidebar.classList.remove("w-64");
  mainContent.classList.add("md:ml-16");
  mainContent.classList.remove("md:ml-64");
}

function expandSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  document
    .querySelectorAll("#sidebar .menu-text")
    .forEach((el) => el.classList.remove("hidden"));
  sidebar.classList.remove("w-16");
  sidebar.classList.add("w-64");
  mainContent.classList.remove("md:ml-16");
  mainContent.classList.add("md:ml-64");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("bg-gray-900");

  document
    .querySelectorAll(
      "header, main, aside, footer, #mainCard, #userDisplay, #dynamicModule"
    )
    .forEach((el) => {
      el?.classList.toggle("bg-white");
      el?.classList.toggle("bg-gray-800");
      el?.classList.toggle("text-gray-900");
      el?.classList.toggle("text-white");
    });

  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", mode);
}

const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");
const desktopToggle = document.getElementById("desktopToggle");
desktopToggle?.addEventListener("click", () => {
  if (window.innerWidth < 768) {
    sidebar.classList.toggle("hidden");
  } else {
    sidebar.classList.contains("w-16") ? expandSidebar() : collapseSidebar();
  }
});

document
  .getElementById("toggleTheme")
  ?.addEventListener("click", toggleDarkMode);
document
  .getElementById("mobileToggleTheme")
  ?.addEventListener("click", toggleDarkMode);

// Dropdown header
const userToggle = document.getElementById("userDropdownToggle");
const userDropdown = document.getElementById("userDropdown");
const notifToggle = document.getElementById("notificationToggle");
const notifDropdown = document.getElementById("notificationDropdown");

userToggle?.addEventListener("click", () => {
  userDropdown?.classList.toggle("hidden");
});

notifToggle?.addEventListener("click", () => {
  notifDropdown?.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!userToggle?.contains(e.target) && !userDropdown?.contains(e.target)) {
    userDropdown?.classList.add("hidden");
  }
  if (!notifToggle?.contains(e.target) && !notifDropdown?.contains(e.target)) {
    notifDropdown?.classList.add("hidden");
  }
});

// Mobile menu dropdown
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const mobileMenuDropdown = document.getElementById("mobileMenuDropdown");

mobileMenuToggle?.addEventListener("click", () => {
  mobileMenuDropdown?.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (
    !mobileMenuToggle?.contains(e.target) &&
    !mobileMenuDropdown?.contains(e.target)
  ) {
    mobileMenuDropdown?.classList.add("hidden");
  }
});

// async function loadBadge() {
//   const badgeConfigs = [
//     { id: 'salesQtyBadge', endpoint: 'counting/sales_pending' },
//     { id: 'receiptQtyBadge', endpoint: 'counting/sales_receipt_unvalid' },
//     { id: 'packedQtyBadge', endpoint: 'counting/sales_package_unpack' },
//     { id: 'shipmentQtyBadge', endpoint: 'counting/sales_package_unshipped' },
//   ];

//   for (const config of badgeConfigs) {
//     try {
//       const response = await fetch(`${baseUrl}/${config.endpoint}/100`, {
//         headers: {
//           'Authorization': `Bearer ${API_TOKEN}`
//         }
//       });

//       const data = await response.json();
//       const total = data?.countData?.total || 0;

//       const badge = document.getElementById(config.id);
//       if (badge) {
//         badge.textContent = total;
//         badge.style.display = total > 0 ? 'inline-block' : 'none';
//       }
//     } catch (error) {
//       console.error(`Gagal memuat data untuk ${config.id}:`, error);
//     }
//   }
// }

// setInterval(loadBadge, 1000);
