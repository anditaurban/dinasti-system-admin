(function initSettingModule() {
  console.log("⚙️ Setting module initialized");

  // Section switching
  const settingButtons = document.querySelectorAll(".setting-btn");
  const settingSections = document.querySelectorAll(".setting-section");

  if (settingButtons.length === 0) {
    console.warn("❌ Tidak ada .setting-btn ditemukan di setting/data.html");
  }

  settingButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetSection = this.getAttribute("data-section");
      console.log("🔘 Klik tombol:", targetSection);

      // toggle tombol aktif
      settingButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // sembunyikan semua section
      settingSections.forEach((section) => {
        section.classList.add("hidden");
        section.classList.remove("active");
      });

      // tampilkan target section
      const targetElement = document.getElementById(`section-${targetSection}`);
      if (targetElement) {
        targetElement.classList.remove("hidden");
        setTimeout(() => targetElement.classList.add("active"), 10);
        console.log("📂 Section aktif:", targetElement.id);
      } else {
        console.warn(`❌ Section ${targetSection} tidak ditemukan`);
      }
    });
  });
})();
