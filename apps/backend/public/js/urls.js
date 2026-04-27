(() => {
  const urlForm = document.getElementById("urlForm");
  const submitBtn = document.getElementById("submitBtn");
  const retryUrlsBtn = document.getElementById("retryUrlsBtn");
  const urlsDashboardBtn = document.getElementById("urlsDashboardBtn");
  const messageDiv = document.getElementById("message");
  const resultSection = document.getElementById("resultSection");
  const shortUrlInput = document.getElementById("shortUrlInput");
  const shortIdDisplay = document.getElementById("shortIdDisplay");
  const originalUrlDisplay = document.getElementById("originalUrlDisplay");
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const urlsList = document.getElementById("urlsList");
  const noUrls = document.getElementById("noUrls");
  const errorText = document.getElementById("error-text");
  const qrPreviewCanvas = document.getElementById("qrPreviewCanvas");
  const qrPreviewIcon = document.getElementById("qrPreviewIcon");
  const qrActionBtn = document.getElementById("qrActionBtn");

  let selectedQrShortId = "";
  let selectedQrUrl = "";
  let qrGeneratedForSelection = false;

  if (urlsDashboardBtn) {
    urlsDashboardBtn.addEventListener("click", () => {
      window.location.href = "/dashboard";
    });
  }

  if (retryUrlsBtn) {
    retryUrlsBtn.addEventListener("click", () => {
      loadUrls();
    });
  }

  function showMessage(text, type) {
    if (!messageDiv) return;

    const classes = {
      success:
        "rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary",
      error:
        "rounded-xl border border-error/30 bg-error-container px-3 py-2 text-sm text-error",
      info: "rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant",
    };

    messageDiv.textContent = text;
    messageDiv.className = classes[type] || classes.info;

    setTimeout(() => {
      messageDiv.className =
        "rounded-xl px-3 py-2 text-sm text-on-surface-variant";
      messageDiv.textContent = "";
    }, 5000);
  }

  function getPayload(result) {
    if (result && typeof result === "object" && "data" in result) {
      return result.data;
    }
    return result;
  }

  function getErrorMessage(result, fallback) {
    if (!result || typeof result !== "object") {
      return fallback;
    }

    return (
      result.message ||
      result.error?.message ||
      result.error?.json?.message ||
      fallback
    );
  }

  function getBaseUrl() {
    return window.location.origin;
  }

  function getShortUrl(shortId) {
    return `${getBaseUrl()}/${shortId}`;
  }

  function updateQrButton() {
    if (!qrActionBtn) return;

    const hasSelection = Boolean(selectedQrShortId && selectedQrUrl);
    qrActionBtn.disabled = !hasSelection;

    if (!hasSelection) {
      qrActionBtn.innerHTML =
        'Generate QR Code <span class="material-symbols-outlined text-base">qr_code_2</span>';
      return;
    }

    if (qrGeneratedForSelection) {
      qrActionBtn.innerHTML =
        'Download QR Code <span class="material-symbols-outlined text-base">download</span>';
      return;
    }

    qrActionBtn.innerHTML =
      'Generate QR Code <span class="material-symbols-outlined text-base">qr_code_2</span>';
  }

  function resetQrPreview() {
    if (qrPreviewCanvas) {
      const iconNode = qrPreviewIcon;
      qrPreviewCanvas.innerHTML = "";

      if (iconNode) {
        qrPreviewCanvas.appendChild(iconNode);
        iconNode.style.display = "block";
      }
    }

    selectedQrShortId = "";
    selectedQrUrl = "";
    qrGeneratedForSelection = false;
    updateQrButton();
  }

  function markSelectedQrItem() {
    if (!urlsList) return;

    urlsList.querySelectorAll("[data-qr-card]").forEach((item) => {
      const card = item;
      const isActive = card.dataset.shortId === selectedQrShortId;
      card.classList.toggle("border-tertiary", isActive);
      card.classList.toggle("ring-1", isActive);
      card.classList.toggle("ring-tertiary/50", isActive);
    });

    urlsList.querySelectorAll('[data-action="select"]').forEach((button) => {
      const isActive = button.dataset.shortId === selectedQrShortId;
      const isDeleted = button.dataset.isDeleted === "true";
      if (isDeleted) return;

      if (isActive) {
        button.classList.remove("bg-surface-container-high", "text-on-surface");
        button.classList.add("bg-tertiary", "text-on-tertiary");
        button.innerHTML =
          '<span class="material-symbols-outlined text-base">check_circle</span>Selected';
      } else {
        button.classList.remove("bg-tertiary", "text-on-tertiary");
        button.classList.add("bg-surface-container-high", "text-on-surface");
        button.innerHTML =
          '<span class="material-symbols-outlined text-base">qr_code_2</span>Use for QR';
      }
    });
  }

  function selectUrlForQr(shortId, shortUrl, isDeleted, isAlreadyGenerated) {
    if (!shortId || !shortUrl || isDeleted) {
      showMessage("Please select an active short URL.", "info");
      return;
    }

    selectedQrShortId = shortId;
    selectedQrUrl = shortUrl;
    qrGeneratedForSelection = Boolean(isAlreadyGenerated);
    updateQrButton();
    markSelectedQrItem();

    // Show QR immediately when a URL is selected.
    renderQrCode(shortUrl);
  }

  function renderQrCode(url) {
    if (!qrPreviewCanvas) {
      return false;
    }

    if (typeof window.QRCode !== "function") {
      showMessage("QR library is not loaded yet. Please try again.", "error");
      return false;
    }

    const iconNode = qrPreviewIcon;
    qrPreviewCanvas.innerHTML = "";

    const mount = document.createElement("div");
    mount.className = "flex h-full w-full items-center justify-center";
    qrPreviewCanvas.appendChild(mount);

    // Create a scannable QR inside the preview container.
    new window.QRCode(mount, {
      text: url,
      width: 192,
      height: 192,
      // Keep QR colors fixed (light background) regardless of app theme.
      colorDark: "#111827",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H,
    });

    if (iconNode) {
      qrPreviewCanvas.appendChild(iconNode);
      iconNode.style.display = "none";
    }

    return true;
  }

  async function persistQrGenerated(shortId, qrCodeUrl) {
    const response = await fetch(`/api/v1/url/update/${encodeURIComponent(shortId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        shortId,
        qrCode: qrCodeUrl,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(getErrorMessage(result, "Failed to save QR status"));
    }

    return getPayload(result);
  }

  function downloadQrCode() {
    if (!qrPreviewCanvas || !selectedQrShortId) {
      showMessage("Generate QR Code first.", "info");
      return;
    }

    const canvas = qrPreviewCanvas.querySelector("canvas");
    const image = qrPreviewCanvas.querySelector("img");
    let source = "";

    if (canvas) {
      source = canvas.toDataURL("image/png");
    } else if (image && image.src) {
      source = image.src;
    }

    if (!source) {
      showMessage("Generate QR Code first.", "info");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = source;
    anchor.download = `${selectedQrShortId}-qr.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function displayResult(data) {
    if (
      !data ||
      !resultSection ||
      !shortUrlInput ||
      !shortIdDisplay ||
      !originalUrlDisplay
    ) {
      return;
    }

    const fullUrl = data.fullShortUrl || getShortUrl(data.shortId);

    shortUrlInput.value = fullUrl;
    shortIdDisplay.textContent = data.shortId;
    originalUrlDisplay.textContent = data.redirectUrl;

    resultSection.style.display = "block";
    resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function copyShortUrl() {
    if (!shortUrlInput) return;

    shortUrlInput.select();
    navigator.clipboard
      .writeText(shortUrlInput.value)
      .then(() => {
        const copyBtn = document.getElementById("copyShortUrlBtn");
        if (!copyBtn) return;

        copyBtn.classList.add("bg-primary", "text-on-primary");
        const icon = copyBtn.querySelector(".material-symbols-outlined");
        const labelNode = copyBtn.childNodes[copyBtn.childNodes.length - 1];

        if (icon) {
          icon.textContent = "check";
        }
        if (labelNode && labelNode.nodeType === Node.TEXT_NODE) {
          labelNode.textContent = " Copied";
        }

        setTimeout(() => {
          copyBtn.classList.remove("bg-primary", "text-on-primary");
          const resetIcon = copyBtn.querySelector(".material-symbols-outlined");
          if (resetIcon) {
            resetIcon.textContent = "content_copy";
          }
          if (labelNode && labelNode.nodeType === Node.TEXT_NODE) {
            labelNode.textContent = " Copy";
          }
        }, 1500);
      })
      .catch(() => {
        document.execCommand("copy");
      });
  }

  function updateStats(urls) {
    const totalUrls = urls.length;
    const activeUrls = urls.filter((url) => !url.isDeleted).length;
    const totalClicks = urls.reduce((sum, url) => {
      return (
        sum +
        (url.totalClicks || (url.visitHistory ? url.visitHistory.length : 0))
      );
    }, 0);

    const summary = document.getElementById("urlsSummary");
    if (!summary) return;

    summary.textContent = `${activeUrls}/${totalUrls} active links with ${totalClicks} total clicks`;
  }

  function createUrlItem(url) {
    const shortUrl = getShortUrl(url.shortId);
    const clicks =
      url.totalClicks || (url.visitHistory ? url.visitHistory.length : 0);
    const createdDate = new Date(url.createdAt).toLocaleDateString();
    const lastVisit =
      url.visitHistory && url.visitHistory.length > 0
        ? new Date(
            url.visitHistory[url.visitHistory.length - 1].timestamp
          ).toLocaleDateString()
        : "Never";
    const isDeleted = url.isDeleted;
    const statusLabel = isDeleted ? "Archived" : "Active";
    const statusClass = isDeleted
      ? "bg-error-container text-error"
      : "bg-primary/15 text-primary";
    const shortLinkClass = isDeleted
      ? "text-on-surface-variant line-through"
      : "text-primary hover:underline";

    const div = document.createElement("div");
    div.className =
      "rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 transition-all";
    div.dataset.qrCard = "true";
    div.dataset.shortId = url.shortId;

    div.innerHTML = `
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0 space-y-2">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}">${statusLabel}</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="${shortUrl}" target="_blank" class="min-w-0 truncate text-sm font-bold ${shortLinkClass}" title="${shortUrl}">${shortUrl}</a>
            <button class="btn-small btn-action-copy inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest" data-action="copy" data-short-url="${shortUrl}" title="Copy short URL">
              <span class="material-symbols-outlined text-base">content_copy</span>
            </button>
          </div>
          <div class="truncate text-sm text-on-surface-variant" title="${url.redirectUrl}">${url.redirectUrl}</div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50" data-action="select" data-short-id="${url.shortId}" data-short-url="${shortUrl}" data-is-deleted="${isDeleted}" data-qr-generated="${Boolean(url.qrGenerated)}" ${isDeleted ? "disabled" : ""}>
            <span class="material-symbols-outlined text-base">qr_code_2</span>
            Use for QR
          </button>
          <button class="btn-small ${
            isDeleted
              ? "btn-action-restore inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary/15 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              : "btn-action-delete inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-error-container px-4 text-sm font-bold text-error transition-colors hover:opacity-90"
          }" data-action="toggle" data-short-id="${url.shortId}" data-is-deleted="${isDeleted}">
            <span class="material-symbols-outlined text-base">${
              isDeleted ? "restore_from_trash" : "delete"
            }</span>
            ${isDeleted ? "Restore" : "Archive"}
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl bg-surface-container-low p-3">
          <p class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant"><span class="material-symbols-outlined text-sm">bar_chart</span>Clicks</p>
          <p class="mt-1 text-sm font-semibold text-on-surface">${clicks}</p>
        </div>
        <div class="rounded-xl bg-surface-container-low p-3">
          <p class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant"><span class="material-symbols-outlined text-sm">calendar_month</span>Created</p>
          <p class="mt-1 text-sm font-semibold text-on-surface">${createdDate}</p>
        </div>
        <div class="rounded-xl bg-surface-container-low p-3">
          <p class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant"><span class="material-symbols-outlined text-sm">schedule</span>Last Visit</p>
          <p class="mt-1 text-sm font-semibold text-on-surface">${lastVisit}</p>
        </div>
        <div class="rounded-xl bg-surface-container-low p-3">
          <p class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant"><span class="material-symbols-outlined text-sm">fingerprint</span>Short ID</p>
          <p class="mt-1 text-sm font-semibold text-on-surface">${url.shortId}</p>
        </div>
      </div>
    `;

    return div;
  }

  function displayUrls(urls) {
    if (!urlsList) return;

    urlsList.innerHTML = "";
    urls.forEach((url) => {
      urlsList.appendChild(createUrlItem(url));
    });

    urlsList.querySelectorAll('[data-action="copy"]').forEach((button) => {
      button.addEventListener("click", () => {
        navigator.clipboard
          .writeText(button.dataset.shortUrl || "")
          .then(() => {
            button.classList.add("bg-primary", "text-on-primary");
            const icon = button.querySelector(".material-symbols-outlined");
            if (icon) {
              icon.textContent = "check";
            }

            setTimeout(() => {
              button.classList.remove("bg-primary", "text-on-primary");
              const resetIcon = button.querySelector(
                ".material-symbols-outlined"
              );
              if (resetIcon) {
                resetIcon.textContent = "content_copy";
              }
            }, 1500);
          })
          .catch(() => {
            alert("Failed to copy URL");
          });
      });
    });

    urlsList.querySelectorAll('[data-action="toggle"]').forEach((button) => {
      button.addEventListener("click", async () => {
        const shortId = button.dataset.shortId || "";
        const isDeleted = button.dataset.isDeleted === "true";
        await toggleDeleteUrl(shortId, isDeleted);
      });
    });

    urlsList.querySelectorAll('[data-action="select"]').forEach((button) => {
      button.addEventListener("click", () => {
        const shortId = button.dataset.shortId || "";
        const shortUrl = button.dataset.shortUrl || "";
        const isDeleted = button.dataset.isDeleted === "true";
        const isAlreadyGenerated = button.dataset.qrGenerated === "true";
        selectUrlForQr(shortId, shortUrl, isDeleted, isAlreadyGenerated);
      });
    });

    urlsList.querySelectorAll("[data-qr-card]").forEach((card) => {
      card.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        // Ignore clicks on explicit action controls and links.
        if (target.closest("button") || target.closest("a")) {
          return;
        }

        const shortId = card.dataset.shortId || "";
        if (!shortId) return;

        const selectButton = card.querySelector('[data-action="select"]');
        if (!selectButton || !(selectButton instanceof HTMLButtonElement)) {
          return;
        }

        const shortUrl = selectButton.dataset.shortUrl || "";
        const isDeleted = selectButton.dataset.isDeleted === "true";
        const isAlreadyGenerated = selectButton.dataset.qrGenerated === "true";
        selectUrlForQr(shortId, shortUrl, isDeleted, isAlreadyGenerated);
      });
    });

    markSelectedQrItem();
  }

  async function loadUrls() {
    if (!loading || !error || !urlsList || !noUrls || !errorText) return;

    loading.style.display = "block";
    error.style.display = "none";
    urlsList.innerHTML = "";
    noUrls.style.display = "none";

    try {
      const response = await fetch("/api/v1/url/user/all?includeDeleted=true", {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/signin";
          return;
        }
        throw new Error(getErrorMessage(result, "Failed to fetch URLs"));
      }

      if (result.success === false) {
        throw new Error(getErrorMessage(result, "Failed to load URLs"));
      }

      const payload = getPayload(result) || {};
      const urls = Array.isArray(payload.urls) ? payload.urls : [];

      loading.style.display = "none";

      if (urls.length === 0) {
        resetQrPreview();
        noUrls.style.display = "block";
      } else {
        const selectedUrl = urls.find(
          (url) => url.shortId === selectedQrShortId && !url.isDeleted
        );
        if (!selectedUrl) {
          resetQrPreview();
        } else {
          selectedQrUrl = getShortUrl(selectedUrl.shortId);
          qrGeneratedForSelection = Boolean(selectedUrl.qrGenerated);
          updateQrButton();
          renderQrCode(selectedQrUrl);
        }
        displayUrls(urls);
        updateStats(urls);
      }
    } catch (err) {
      console.error("Error loading URLs:", err);
      loading.style.display = "none";
      error.style.display = "block";
      errorText.textContent = err.message || "Failed to load URLs";
    }
  }

  async function toggleDeleteUrl(shortId, isDeleted) {
    const action = isDeleted ? "restore" : "archive";
    const confirmMsg = isDeleted
      ? "Are you sure you want to restore this URL?"
      : "Are you sure you want to archive this URL?";

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/url/${shortId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(
          isDeleted
            ? "URL restored successfully."
            : "URL archived successfully.",
          "success"
        );
        loadUrls();
      } else {
        showMessage(
          getErrorMessage(result, `Failed to ${action} URL`),
          "error"
        );
      }
    } catch (requestError) {
      console.error("Error:", requestError);
      showMessage(`Network error. Failed to ${action} URL.`, "error");
    }
  }

  if (urlForm) {
    urlForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!submitBtn) return;

      const btnText = submitBtn.querySelector(".btn-text");
      const originalText = btnText ? btnText.textContent : "Generate Short URL";

      const formData = {
        url: document.getElementById("url").value.trim(),
      };

      const customId = document.getElementById("customShortId").value.trim();
      const idLength = document.getElementById("idLength").value;

      if (customId) {
        formData.customShortId = customId;
      } else if (idLength) {
        formData.idLength = parseInt(idLength, 10);
      }

      submitBtn.disabled = true;
      if (btnText) {
        btnText.textContent = "Creating...";
      }

      try {
        const response = await fetch("/api/v1/url/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        const payload = getPayload(data);

        if (response.ok) {
          showMessage("Short URL created successfully.", "success");
          displayResult(payload);
          urlForm.reset();
          const idLengthInput = document.getElementById("idLength");
          if (idLengthInput) {
            idLengthInput.value = "8";
          }
          setTimeout(() => {
            loadUrls();
          }, 800);
        } else {
          showMessage(
            getErrorMessage(data, "Failed to create short URL"),
            "error"
          );
        }
      } catch (requestError) {
        console.error("Error:", requestError);
        showMessage("Network error. Please try again.", "error");
      } finally {
        submitBtn.disabled = false;
        if (btnText) {
          btnText.textContent = originalText;
        }
      }
    });
  }

  const copyShortUrlBtn = document.getElementById("copyShortUrlBtn");
  if (copyShortUrlBtn) {
    copyShortUrlBtn.addEventListener("click", copyShortUrl);
  }

  if (qrActionBtn) {
    qrActionBtn.addEventListener("click", async () => {
      if (!selectedQrShortId || !selectedQrUrl) {
        showMessage("Select a short URL from the list first.", "info");
        return;
      }

      if (qrGeneratedForSelection) {
        downloadQrCode();
        return;
      }

      const rendered = renderQrCode(selectedQrUrl);
      if (!rendered) {
        return;
      }

      try {
        await persistQrGenerated(selectedQrShortId, selectedQrUrl);
        qrGeneratedForSelection = true;
        updateQrButton();
        showMessage("QR generated and saved successfully.", "success");
      } catch (requestError) {
        console.error("QR save error:", requestError);
        showMessage(requestError.message || "Failed to save QR status.", "error");
      }
    });
  }

  window.showMessage = showMessage;
  window.displayResult = displayResult;
  window.copyShortUrl = copyShortUrl;
  window.loadUrls = loadUrls;

  resetQrPreview();
  updateQrButton();

  loadUrls();
})();
