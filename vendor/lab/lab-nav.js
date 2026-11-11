// Arseniy's Lab — closes the header menu (<details class="lab-nav">) on outside
// click and on Escape. The menu works without this file; it only adds polish.
(() => {
  const close = (except) => {
    for (const d of document.querySelectorAll("details.lab-nav[open]")) {
      if (d !== except) d.removeAttribute("open");
    }
  };
  document.addEventListener("click", (e) => {
    close(e.target.closest && e.target.closest("details.lab-nav"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = document.querySelector("details.lab-nav[open]");
    if (open) {
      open.removeAttribute("open");
      open.querySelector("summary")?.focus();
    }
  });
})();
