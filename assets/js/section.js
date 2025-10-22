// =============================
// 🔹 LOGOUT HANDLER
// =============================
document.getElementById("logout")?.addEventListener("click", function () {
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

// =============================
// 🔹 HEADER & BREADCRUMB
// =============================
function renderHeader() {
  const title = subpagemodule ? subpagemodule : pagemodule;
  document.getElementById("pageTitle").textContent = title.toUpperCase();

  const breadcrumb = document.getElementById("breadcrumb");
  let html = `
    <span>Home</span>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
    <span>${pagemodule}</span>
  `;

  if (subpagemodule) {
    html += `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span>${subpagemodule}</span>
    `;
  }

  breadcrumb.innerHTML = html;
}

// =============================
// 🔹 SIDEBAR HANDLER
// =============================
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");
const desktopToggle = document.getElementById("desktopToggle");
const toggleIcon = document.getElementById("toggleIcon");

function collapseSidebar() {
  document
    .querySelectorAll("#sidebar .menu-text")
    .forEach((el) => el.classList.add("hidden"));
  sidebar.classList.add("w-16");
  sidebar.classList.remove("w-64");
  mainContent.classList.add("md:ml-16");
  mainContent.classList.remove("md:ml-64");

  // Panah ke kanan
  if (toggleIcon) toggleIcon.style.transform = "rotate(180deg)";
}

function expandSidebar() {
  document
    .querySelectorAll("#sidebar .menu-text")
    .forEach((el) => el.classList.remove("hidden"));
  sidebar.classList.remove("w-16");
  sidebar.classList.add("w-64");
  mainContent.classList.remove("md:ml-16");
  mainContent.classList.add("md:ml-64");

  // Panah ke kiri
  if (toggleIcon) toggleIcon.style.transform = "rotate(0deg)";
}

// 🔁 Default tampil (sidebar terbuka)
expandSidebar();

// 🔘 Tombol toggle desktop
desktopToggle?.addEventListener("click", () => {
  if (window.innerWidth < 768) {
    // Mobile mode
    sidebar.classList.toggle("hidden");
  } else {
    // Desktop mode
    if (sidebar.classList.contains("w-64")) collapseSidebar();
    else expandSidebar();
  }
});

// =============================
// 🔹 DARK MODE TOGGLE
// =============================
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

document
  .getElementById("toggleTheme")
  ?.addEventListener("click", toggleDarkMode);
document
  .getElementById("mobileToggleTheme")
  ?.addEventListener("click", toggleDarkMode);

// =============================
// 🔹 HEADER DROPDOWN (USER & NOTIF)
// =============================
const userToggle = document.getElementById("userDropdownToggle");
const userDropdown = document.getElementById("userDropdown");
const notifToggle = document.getElementById("notificationToggle");
const notifDropdown = document.getElementById("notificationDropdown");

userToggle?.addEventListener("click", () =>
  userDropdown?.classList.toggle("hidden")
);
notifToggle?.addEventListener("click", () =>
  notifDropdown?.classList.toggle("hidden")
);

document.addEventListener("click", (e) => {
  if (!userToggle?.contains(e.target) && !userDropdown?.contains(e.target)) {
    userDropdown?.classList.add("hidden");
  }
  if (!notifToggle?.contains(e.target) && !notifDropdown?.contains(e.target)) {
    notifDropdown?.classList.add("hidden");
  }
});

// =============================
// 🔹 MOBILE MENU
// =============================
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
