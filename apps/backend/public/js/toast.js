(() => {
  function configureToastr() {
    if (!window.toastr) {
      return;
    }

    window.toastr.options = {
      closeButton: true,
      progressBar: false,
      newestOnTop: false,
      positionClass: "toast-bottom-right",
      timeOut: 3200,
      extendedTimeOut: 900,
      preventDuplicates: true,
      showDuration: 180,
      hideDuration: 150,
      showMethod: "show",
      hideMethod: "fadeOut",
    };
  }

  function injectStyles() {
    const styleId = "urltinier-toast-theme";
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #toast-container {
        pointer-events: none;
      }

      #toast-container > .toast {
        --toast-accent: #60a5fa;
        width: min(360px, calc(100vw - 24px));
        border-radius: 12px;
        box-shadow: 0 12px 28px rgba(2, 8, 23, 0.24);
        background-image: none !important;
        opacity: 1;
        pointer-events: auto;
        padding: 14px 14px 14px 16px;
        color: #e2e8f0;
        background-color: #111b34;
        border: 1px solid var(--toast-accent);
        position: relative;
        animation: toast-rise 180ms ease-out;
      }

      @keyframes toast-rise {
        from {
          transform: translateY(16px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      body.light #toast-container > .toast,
      html.light #toast-container > .toast {
        color: #0f172a;
        background-color: #eef2ff;
        border: 1px solid var(--toast-accent);
      }

      #toast-container > .toast-success {
        --toast-accent: #22c55e;
      }

      #toast-container > .toast-error {
        --toast-accent: #f87171;
      }

      #toast-container > .toast-info {
        --toast-accent: #60a5fa;
      }

      #toast-container > .toast-warning {
        --toast-accent: #f59e0b;
      }

      body.light #toast-container > .toast-success,
      html.light #toast-container > .toast-success {
        --toast-accent: #16a34a;
      }

      body.light #toast-container > .toast-error,
      html.light #toast-container > .toast-error {
        --toast-accent: #dc2626;
      }

      body.light #toast-container > .toast-info,
      html.light #toast-container > .toast-info {
        --toast-accent: #2563eb;
      }

      body.light #toast-container > .toast-warning,
      html.light #toast-container > .toast-warning {
        --toast-accent: #d97706;
      }

      #toast-container > .toast-success .toast-message,
      #toast-container > .toast-error .toast-message,
      #toast-container > .toast-info .toast-message,
      #toast-container > .toast-warning .toast-message {
        color: var(--toast-accent);
      }

      .toast-title {
        color: inherit;
      }

      .toast-message {
        color: inherit;
        font-size: 13px;
        line-height: 1.35;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 32px;
        min-height: 18px;
        margin-right: 18px;
      }

      .toast-message:hover {
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
        max-height: 140px;
      }

      #toast-container > .toast::before {
        content: "i";
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: transparent;
        border: 2px solid var(--toast-accent);
        color: var(--toast-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        font-size: 11px;
        line-height: 1;
        font-weight: 800;
      }

      #toast-container > .toast-error::before {
        content: "!";
      }

      #toast-container > .toast-success::before {
        content: "✓";
      }

      #toast-container > .toast-warning::before {
        content: "!";
      }

      #toast-container > .toast-info::before {
        content: "i";
      }

      .toast-close-button {
        color: inherit;
        opacity: 0.85;
        text-shadow: none;
        font-size: 22px;
        line-height: 1;
      }

      .toast-progress {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
  }

  function fallback(type, message) {
    const prefix = type ? `[${String(type).toUpperCase()}]` : "[INFO]";
    // Fallback keeps UX acceptable if CDN is blocked.
    console.log(`${prefix} ${message}`);
  }

  function show(type, message, title) {
    const text = String(message || "").trim();
    if (!text) {
      return;
    }

    if (window.toastr && typeof window.toastr[type] === "function") {
      const toastRef = window.toastr[type](text, title);

      if (toastRef && typeof toastRef.attr === "function") {
        toastRef.attr("title", text);
      }

      if (toastRef && typeof toastRef.find === "function") {
        const toastMessage = toastRef.find(".toast-message");
        if (toastMessage && typeof toastMessage.attr === "function") {
          toastMessage.attr("title", text);
        }
      }

      return;
    }

    fallback(type, text);
  }

  configureToastr();
  injectStyles();

  window.appToast = {
    success: (message, title) => show("success", message, title),
    error: (message, title) => show("error", message, title),
    info: (message, title) => show("info", message, title),
    warning: (message, title) => show("warning", message, title),
    show,
  };
})();
