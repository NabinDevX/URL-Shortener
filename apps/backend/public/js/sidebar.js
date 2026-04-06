(() => {
  const sidebar = document.getElementById("appSidebar");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const sidebarBackdrop = document.getElementById("sidebarMobileBackdrop");
  const signoutLink = document.getElementById("sidebarSignoutLink");

  const mobileQuery = window.matchMedia("(max-width: 1023px)");

  const setExpandedState = (isExpanded) => {
    if (!sidebar) {
      return;
    }

    sidebar.classList.toggle("sidebar-mobile-expanded", isExpanded);

    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute(
        "aria-expanded",
        isExpanded ? "true" : "false"
      );
    }

    document.body.classList.toggle(
      "overflow-hidden",
      isExpanded && mobileQuery.matches
    );
  };

  const closeSidebarOnMobile = () => {
    if (mobileQuery.matches) {
      setExpandedState(false);
    }
  };

  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener("click", () => {
      const isExpanded = sidebar.classList.contains("sidebar-mobile-expanded");
      setExpandedState(!isExpanded);
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", closeSidebarOnMobile);
  }

  if (sidebar) {
    sidebar.querySelectorAll("a[href]").forEach((navLink) => {
      navLink.addEventListener("click", closeSidebarOnMobile);
    });
  }

  mobileQuery.addEventListener("change", (event) => {
    if (!event.matches) {
      setExpandedState(false);
      document.body.classList.remove("overflow-hidden");
    }
  });

  if (!signoutLink) {
    return;
  }

  signoutLink.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await fetch("/api/v1/user/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: "{}",
      });
    } catch {
      // Best-effort signout; continue redirect either way.
    } finally {
      window.location.href = "/";
    }
  });
})();
