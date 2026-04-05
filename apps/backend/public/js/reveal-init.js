(() => {
  function initGlobalRevealAnimations() {
    const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
    if (revealNodes.length === 0) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealNodes.forEach((node) => {
        node.classList.add("is-visible");
      });
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealNodes.forEach((node) => {
      revealObserver.observe(node);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalRevealAnimations, {
      once: true,
    });
  } else {
    initGlobalRevealAnimations();
  }
})();
