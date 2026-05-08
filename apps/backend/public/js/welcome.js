(() => {
  const PENDING_SUBSCRIPTION_KEY = "pendingSubscriptionPlan";
  const PENDING_REDIRECT_KEY = "postAuthRedirect";

  function notifyError(message) {
    if (window.appToast) {
      window.appToast.error(message);
      return;
    }
    window.alert(message);
  }

  function getRazorpayKeyId() {
    const section = document.querySelector("[data-razorpay-key-id]");
    return (section?.getAttribute("data-razorpay-key-id") || "").trim();
  }

  function getSafeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const next = (params.get("next") || "").trim();
    if (!next.startsWith("/")) {
      return "/dashboard";
    }
    return next;
  }

  function detectDownloadPlatform() {
    const capacitor = window.Capacitor;

    if (capacitor && typeof capacitor.getPlatform === "function") {
      try {
        const platform = capacitor.getPlatform();
        return {
          platform: platform === "android" ? "android" : "web",
          isNative:
            typeof capacitor.isNativePlatform === "function"
              ? capacitor.isNativePlatform()
              : false,
        };
      } catch {
        // Fall back to browser detection below.
      }
    }

    const userAgent = navigator.userAgent.toLowerCase();

    if (/android/.test(userAgent)) {
      return { platform: "android", isNative: false };
    }

    return { platform: "web", isNative: false };
  }

  function getDownloadTarget(platform) {
    if (platform === "android") {
      return { href: "/apk/urltinier.apk", label: "APK" };
    }

    return { href: "/extension/urltinier.zip", label: "Extension" };
  }

  function initDownloadCta() {
    const container = document.querySelector("[data-download-app-cta]");

    if (!container) {
      return;
    }

    const { platform, isNative } = detectDownloadPlatform();

    if (isNative) {
      container.hidden = true;
      container.innerHTML = "";
      return;
    }

    const target = getDownloadTarget(platform);
    container.hidden = false;
    container.innerHTML = `
      <a class="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary sm:w-auto" href="${target.href}" download>
        Download ${target.label}
      </a>
    `;
  }

  async function ensureRazorpayScriptLoaded() {
    if (window.Razorpay) {
      return;
    }

    await new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load Razorpay SDK")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.head.appendChild(script);
    });
  }

  async function checkCurrentUser() {
    try {
      const currentUserResponse = await fetch("/api/v1/user/current-user", {
        method: "GET",
        credentials: "include",
      });

      if (!currentUserResponse.ok) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async function refreshToken() {
    try {
      const refreshResponse = await fetch("/api/v1/user/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });

      return refreshResponse.ok;
    } catch {
      return false;
    }
  }

  async function isAuthenticated() {
    const isCurrentUserValid = await checkCurrentUser();
    if (isCurrentUserValid) {
      return true;
    }

    const refreshed = await refreshToken();
    if (!refreshed) {
      return false;
    }

    return checkCurrentUser();
  }

  async function beginProCheckout(planId) {
    const razorpayKeyId = getRazorpayKeyId();
    if (!razorpayKeyId) {
      notifyError("Razorpay key is missing on this page.");
      return;
    }

    await ensureRazorpayScriptLoaded();

    const createResponse = await fetch("/api/v1/subscription/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ planId }),
    });

    const createData = await createResponse.json().catch(() => ({}));
    if (createResponse.status === 401 || createResponse.status === 403) {
      sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, planId);
      sessionStorage.setItem(PENDING_REDIRECT_KEY, "/");
      const encodedNext = encodeURIComponent("/");
      window.location.href = `/signin?next=${encodedNext}`;
      return;
    }

    if (!createResponse.ok) {
      throw new Error(createData?.message || "Failed to create subscription");
    }

    const checkout = new window.Razorpay({
      key: razorpayKeyId,
      amount: Number(createData.amount) * 100,
      currency: createData.currency || "INR",
      name: "URLTinier",
      description: "URLTinier Pro Subscription",
      order_id: createData.orderId,
      prefill: {
        name: createData.firstName || "",
        email: createData.email || "",
        contact: createData.contact || "",
      },
      notes: {
        subscriptionId: createData.subscriptionId,
        planId: createData.planId,
      },
      handler: () => {
        sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
        sessionStorage.removeItem(PENDING_REDIRECT_KEY);
        window.location.href = "/dashboard";
      },
      modal: {
        ondismiss: () => {
          sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
        },
      },
      theme: {
        color: "#4f46e5",
      },
    });

    checkout.open();
  }

  async function handleProUpgrade(planId) {
    const authed = await isAuthenticated();
    if (!authed) {
      sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, planId);
      sessionStorage.setItem(PENDING_REDIRECT_KEY, "/");
      const encodedNext = encodeURIComponent("/");
      window.location.href = `/signin?next=${encodedNext}`;
      return;
    }

    try {
      await beginProCheckout(planId);
    } catch (error) {
      notifyError(error.message || "Unable to start payment gateway");
    }
  }

  async function processPendingSubscriptionIfAny() {
    const pendingPlan = sessionStorage.getItem(PENDING_SUBSCRIPTION_KEY);
    if (!pendingPlan) {
      return false;
    }

    const authed = await isAuthenticated();
    if (!authed) {
      return false;
    }

    try {
      await beginProCheckout(pendingPlan);
      return true;
    } catch (error) {
      sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
      notifyError(error.message || "Unable to start payment gateway");
      return false;
    }
  }

  async function redirectIfAuthenticated() {
    const pendingCheckoutHandled = await processPendingSubscriptionIfAny();
    if (pendingCheckoutHandled) {
      return true;
    }

    const targetPath = getSafeNextPath();
    if (targetPath !== "/dashboard") {
      return false;
    }

    const authed = await isAuthenticated();
    if (authed) {
      window.location.replace("/dashboard");
      return true;
    }

    return false;
  }

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

    const proButton = document.getElementById("upgradeToProBtn");
    if (proButton) {
      proButton.addEventListener("click", () => {
        const planId = proButton.getAttribute("data-plan-id") || "pro_50";
        handleProUpgrade(planId);
      });
    }
  }

  async function initializeWelcome() {
    const redirected = await redirectIfAuthenticated();
    if (!redirected) {
      initDownloadCta();
      initWelcomeNav();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWelcome, {
      once: true,
    });
  } else {
    initializeWelcome();
  }
})();
