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

    const fullUrl =
      data.fullShortUrl || `https://urltinier.app/${data.shortId}`;

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
    const shortUrl = `https://urltinier.app/${url.shortId}`;
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
      "rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4";

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

        <div>
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
        noUrls.style.display = "block";
      } else {
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

  window.showMessage = showMessage;
  window.displayResult = displayResult;
  window.copyShortUrl = copyShortUrl;
  window.loadUrls = loadUrls;

  loadUrls();
})();
