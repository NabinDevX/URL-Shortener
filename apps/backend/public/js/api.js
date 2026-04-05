(() => {
  const apiKeyValue = document.getElementById("apiKeyValue");
  const apiKeyMessage = document.getElementById("apiKeyMessage");
  const copyApiKeyBtn = document.getElementById("copyApiKeyBtn");
  const regenerateApiKeyBtn = document.getElementById("regenerateApiKeyBtn");
  const apiKeyStatus = document.getElementById("apiKeyStatus");
  const apiRateUsage = document.getElementById("apiRateUsage");
  const apiKeyCreatedAt = document.getElementById("apiKeyCreatedAt");
  const apiKeyUpdatedAt = document.getElementById("apiKeyUpdatedAt");
  let copyResetTimer;

  function formatDate(value) {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString();
  }

  function setMessage(message, isError = false) {
    if (!apiKeyMessage) {
      return;
    }

    apiKeyMessage.textContent = message;
    apiKeyMessage.classList.toggle("text-error", isError);
    apiKeyMessage.classList.toggle(
      "text-primary",
      !isError && Boolean(message)
    );
    apiKeyMessage.classList.toggle("text-on-surface-variant", !message);
  }

  function setApiKeyValue(value) {
    if (!apiKeyValue) {
      return;
    }

    apiKeyValue.textContent = value || "No API key available";
  }

  function setText(element, value) {
    if (!element) {
      return;
    }

    element.textContent = value;
  }

  function setApiKeyStatus(apiKey, apiKeyExpiresAt) {
    if (!apiKey) {
      setText(apiKeyStatus, "Missing");
      return;
    }

    if (!apiKeyExpiresAt) {
      setText(apiKeyStatus, "Active");
      return;
    }

    const expiresAt = new Date(apiKeyExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      setText(apiKeyStatus, "Active");
      return;
    }

    setText(
      apiKeyStatus,
      expiresAt.getTime() < Date.now() ? "Expired" : "Active"
    );
  }

  function showCopySuccessState() {
    if (!copyApiKeyBtn) {
      return;
    }

    if (!copyApiKeyBtn.dataset.originalLabel) {
      copyApiKeyBtn.dataset.originalLabel =
        copyApiKeyBtn.textContent?.trim() || "Copy Key";
    }

    if (copyResetTimer) {
      clearTimeout(copyResetTimer);
    }

    copyApiKeyBtn.disabled = true;
    copyApiKeyBtn.classList.add(
      "opacity-80",
      "cursor-not-allowed",
      "inline-flex",
      "items-center",
      "gap-1.5"
    );
    copyApiKeyBtn.innerHTML =
      '<span class="material-symbols-outlined text-base">check</span><span>Copied</span>';

    copyResetTimer = setTimeout(() => {
      copyApiKeyBtn.disabled = false;
      copyApiKeyBtn.classList.remove(
        "opacity-80",
        "cursor-not-allowed",
        "inline-flex",
        "items-center",
        "gap-1.5"
      );
      copyApiKeyBtn.textContent =
        copyApiKeyBtn.dataset.originalLabel || "Copy Key";
    }, 1400);
  }

  async function loadApiAnalytics() {
    try {
      const [apiKeyResponse, rateLimitResponse] = await Promise.all([
        fetch("/api/v1/user/api-key", { credentials: "include" }),
        fetch("/api/v1/user/api-rate-limit", { credentials: "include" }),
      ]);

      const apiKeyPayload = await apiKeyResponse.json();
      const rateLimitPayload = await rateLimitResponse.json();

      if (!apiKeyResponse.ok) {
        throw new Error(
          apiKeyPayload?.message || "Failed to load API metadata"
        );
      }

      if (!rateLimitResponse.ok) {
        throw new Error(
          rateLimitPayload?.message || "Failed to load rate-limit data"
        );
      }

      setApiKeyValue(apiKeyPayload?.apiKey || "No API key available");
      setApiKeyStatus(apiKeyPayload?.apiKey, apiKeyPayload?.apiKeyExpiresAt);
      setText(apiKeyCreatedAt, formatDate(apiKeyPayload?.createdAt));
      setText(apiKeyUpdatedAt, formatDate(apiKeyPayload?.updatedAt));
      setText(
        apiRateUsage,
        `${rateLimitPayload?.used ?? 0}/${rateLimitPayload?.maxRequests ?? 0} used • resets in ${rateLimitPayload?.resetIn ?? 0}s`
      );
      setMessage("");
    } catch (error) {
      setApiKeyValue("Failed to load key");
      setText(apiKeyStatus, "Unknown");
      setText(apiRateUsage, "Unavailable");
      setText(apiKeyCreatedAt, "Unavailable");
      setText(apiKeyUpdatedAt, "Unavailable");
      setMessage(error.message || "Failed to load API analytics", true);
    }
  }

  if (copyApiKeyBtn) {
    copyApiKeyBtn.addEventListener("click", async () => {
      const value = apiKeyValue?.textContent?.trim();
      if (
        !value ||
        value === "Loading..." ||
        value.includes("Failed") ||
        value.includes("No API key")
      ) {
        setMessage("No valid API key to copy.", true);
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        setMessage("API key copied to clipboard.");
        showCopySuccessState();
      } catch {
        setMessage("Clipboard copy failed. Please copy manually.", true);
      }
    });
  }

  if (regenerateApiKeyBtn) {
    regenerateApiKeyBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Regenerate API key now? Existing integrations using the old key will stop working."
      );
      if (!confirmed) {
        return;
      }

      const originalLabel = regenerateApiKeyBtn.textContent;
      regenerateApiKeyBtn.disabled = true;
      regenerateApiKeyBtn.textContent = "Regenerating...";

      try {
        const response = await fetch("/api/v1/user/regenerate-api-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: "{}",
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to regenerate API key");
        }

        setApiKeyValue(payload?.apiKey || "No API key available");
        setMessage(payload?.message || "API key regenerated successfully.");
        await loadApiAnalytics();
      } catch (error) {
        setMessage(error.message || "Failed to regenerate API key", true);
      } finally {
        regenerateApiKeyBtn.disabled = false;
        regenerateApiKeyBtn.textContent = originalLabel;
      }
    });
  }

  loadApiAnalytics();
})();
