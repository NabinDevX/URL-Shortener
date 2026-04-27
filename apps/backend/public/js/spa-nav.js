(() => {
  const SHELL_SELECTOR = "[data-shell]";

  function getShellType(doc = document) {
    const shell = doc.querySelector(SHELL_SELECTOR);
    return shell?.getAttribute("data-shell") || "";
  }

  function shouldHandleLinkClick(event, anchor) {
    if (!anchor) return false;
    if (event.defaultPrevented) return false;

    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return false;

    const target = (anchor.getAttribute("target") || "").toLowerCase();
    if (target && target !== "_self") return false;

    const href = anchor.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;

    if (href.startsWith("#")) return false;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;

    if (anchor.hasAttribute("download")) return false;

    return true;
  }

  async function loadScriptSequential(scripts, container) {
    for (const script of scripts) {
      const newScript = document.createElement("script");

      for (const { name, value } of Array.from(script.attributes)) {
        if (name === "src") continue;
        if (name === "nonce") continue;
        newScript.setAttribute(name, value);
      }

      if (script.src) {
        newScript.src = script.src;
        newScript.async = false;

        await new Promise((resolve, reject) => {
          newScript.addEventListener("load", resolve, { once: true });
          newScript.addEventListener(
            "error",
            () => reject(new Error(`Failed to load ${script.src}`)),
            { once: true }
          );
          (container || document.body).appendChild(newScript);
        });
      } else {
        newScript.text = script.textContent || "";
        (container || document.body).appendChild(newScript);
      }
    }
  }

  function extractScripts(node) {
    const scripts = Array.from(node.querySelectorAll("script"));
    scripts.forEach((s) => s.remove());
    return scripts;
  }

  function syncAppSidebarClasses(nextDoc) {
    const currentSidebar = document.getElementById("appSidebar");
    const nextSidebar = nextDoc.getElementById("appSidebar");
    if (!currentSidebar || !nextSidebar) {
      return;
    }

    const nextLinks = Array.from(
      nextSidebar.querySelectorAll("a.sidebar-link[href]")
    );
    const nextClassByHref = new Map(
      nextLinks.map((link) => [link.getAttribute("href"), link.className])
    );

    Array.from(currentSidebar.querySelectorAll("a.sidebar-link[href]")).forEach(
      (link) => {
        const href = link.getAttribute("href");
        if (!href) return;
        const nextClassName = nextClassByHref.get(href);
        if (typeof nextClassName === "string") {
          link.className = nextClassName;
        }
      }
    );
  }

  async function navigateTo(url, options = {}) {
    const { addToHistory = true } = options;
    const currentShell = getShellType(document);
    if (!currentShell) {
      window.location.href = url;
      return;
    }

    const controller = new AbortController();

    try {
      document.documentElement.setAttribute("aria-busy", "true");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-PJAX": "1",
        },
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        window.location.href = url;
        return;
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const nextShell = getShellType(doc);
      if (!nextShell || nextShell !== currentShell) {
        window.location.href = url;
        return;
      }

      const swapId = currentShell === "app" ? "appShellMain" : "publicMain";
      const incoming = doc.getElementById(swapId);
      const outgoing = document.getElementById(swapId);

      if (!incoming || !outgoing) {
        window.location.href = url;
        return;
      }

      const scripts = extractScripts(incoming);

      outgoing.innerHTML = incoming.innerHTML;

      if (currentShell === "app") {
        syncAppSidebarClasses(doc);
      }

      const nextTitle = doc.querySelector("title")?.textContent;
      if (nextTitle) {
        document.title = nextTitle;
      }

      if (addToHistory) {
        window.history.pushState({ url }, "", url);
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      await loadScriptSequential(scripts, document.body);

      if (typeof window.appRevealInit === "function") {
        window.appRevealInit();
      }

      window.dispatchEvent(
        new CustomEvent("app:navigate", { detail: { url } })
      );
    } finally {
      document.documentElement.removeAttribute("aria-busy");
    }
  }

  document.addEventListener("click", (event) => {
    if (getShellType(document) !== "app") {
      return;
    }

    const anchor = event.target?.closest?.("a[href]");
    if (!anchor) return;

    if (!shouldHandleLinkClick(event, anchor)) {
      return;
    }

    const url = anchor.href;
    if (url === window.location.href) {
      return;
    }

    event.preventDefault();
    void navigateTo(url, { addToHistory: true });
  });

  window.addEventListener("popstate", (event) => {
    if (getShellType(document) !== "app") {
      return;
    }

    const url = event.state?.url || window.location.href;
    void navigateTo(url, { addToHistory: false });
  });
})();
