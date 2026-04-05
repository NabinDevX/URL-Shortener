(() => {
  function initWelcomeNav() {
    const nav = document.querySelector("[data-welcome-nav]");
    const links = Array.from(document.querySelectorAll("[data-nav-link]"));

    if (!nav || links.length === 0) {
      return;
    }

    const sectionMap = links
      .map((link) => {
        const id = link.getAttribute("href");
        if (!id || id.charAt(0) !== "#") {
          return null;
        }

        const section = document.querySelector(id);
        return section
          ? {
              link,
              section,
              id: id.slice(1),
            }
          : null;
      })
      .filter(Boolean);

    if (sectionMap.length === 0) {
      return;
    }

    let currentId = "";

    function setActiveLink(targetId, syncHash) {
      if (!targetId || currentId === targetId) {
        return;
      }

      currentId = targetId;
      links.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${targetId}`;
        link.classList.toggle("text-primary", isActive);
        link.classList.toggle("border-primary", isActive);
        link.classList.toggle("text-on-surface-variant", !isActive);
        link.classList.toggle("border-transparent", !isActive);
      });

      if (syncHash) {
        history.replaceState(null, "", `#${targetId}`);
      }
    }

    function updateNavOnScroll() {
      const scrolled = window.scrollY > 12;
      nav.classList.toggle("bg-surface/95", scrolled);
      nav.classList.toggle("shadow-lg", scrolled);
      nav.classList.toggle("border-b", scrolled);
      nav.classList.toggle("border-outline-variant/30", scrolled);
      nav.classList.toggle("bg-surface/70", !scrolled);
    }

    function scrollToSection(section) {
      const navHeight = nav.offsetHeight;
      const top =
        section.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }

    function updateActiveFromScroll() {
      const navHeight = nav.offsetHeight;
      const probeY = window.scrollY + navHeight + 40;
      let active = sectionMap[0];

      for (let i = 0; i < sectionMap.length; i += 1) {
        if (sectionMap[i].section.offsetTop <= probeY) {
          active = sectionMap[i];
        }
      }

      setActiveLink(active.id, true);
    }

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || hash.charAt(0) !== "#") {
          return;
        }

        const section = document.querySelector(hash);
        if (!section) {
          return;
        }

        event.preventDefault();
        setActiveLink(hash.slice(1), true);
        scrollToSection(section);
      });
    });

    let ticking = false;

    function onScroll() {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(() => {
        updateNavOnScroll();
        updateActiveFromScroll();
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateNavOnScroll();
    updateActiveFromScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWelcomeNav, {
      once: true,
    });
  } else {
    initWelcomeNav();
  }
})();
