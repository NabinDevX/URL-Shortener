(() => {
  const storageKey = "theme-preference";
  const themeSlider = document.querySelector("[data-theme-slider]");
  const themePresetButtons = Array.from(
    document.querySelectorAll("[data-theme-preset]")
  );
  const themeIcon = document.querySelector("[data-theme-icon]");
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const themeOrder = ["dark", "system", "light"];
  const updateAccountForm = document.getElementById("updateAccountForm");
  const accountNameInput = document.getElementById("accountName");
  const accountEmailInput = document.getElementById("accountEmail");
  const updateAccountBtn = document.getElementById("updateAccountBtn");
  const updateAccountMessage = document.getElementById("updateAccountMessage");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const oldPasswordInput = document.getElementById("oldPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const changePasswordMessage = document.getElementById(
    "changePasswordMessage"
  );

  function setMessage(element, message, isError) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.toggle("text-error", Boolean(isError));
    element.classList.toggle("text-primary", !isError && Boolean(message));
    element.classList.toggle("text-on-surface-variant", !message);
  }

  function getStoredPreference() {
    const savedTheme = localStorage.getItem(storageKey);
    if (
      savedTheme === "dark" ||
      savedTheme === "light" ||
      savedTheme === "system"
    ) {
      return savedTheme;
    }

    return "system";
  }

  function resolveTheme(preference) {
    if (preference === "dark" || preference === "light") {
      return preference;
    }

    return mediaQuery.matches ? "dark" : "light";
  }

  function getPreferenceFromSlider() {
    if (!themeSlider) {
      return "system";
    }

    const index = Number(themeSlider.value);
    return themeOrder[index] || "system";
  }

  function setSliderFromPreference(preference) {
    if (!themeSlider) {
      return;
    }

    const index = themeOrder.indexOf(preference);
    themeSlider.value = String(index === -1 ? 1 : index);
  }

  function updatePresetButtons(preference) {
    if (!themePresetButtons.length) {
      return;
    }

    themePresetButtons.forEach((button) => {
      const isActive = button.getAttribute("data-theme-preset") === preference;
      button.classList.toggle("bg-primary", isActive);
      button.classList.toggle("text-on-primary", isActive);
      button.classList.toggle("text-on-surface-variant", !isActive);
    });
  }

  function updateThemeIcon(preference, resolvedTheme) {
    if (!themeIcon) {
      return;
    }

    if (preference === "dark") {
      themeIcon.textContent = "dark_mode";
      return;
    }

    if (preference === "light") {
      themeIcon.textContent = "light_mode";
      return;
    }

    themeIcon.textContent =
      resolvedTheme === "dark" ? "brightness_3" : "brightness_high";
  }

  function applyThemePreference(preference, persistPreference) {
    const theme = resolveTheme(preference);
    const root = document.documentElement;

    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.style.backgroundColor = theme === "dark" ? "#0c1324" : "#f7f9fb";

    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);

    setSliderFromPreference(preference);
    updatePresetButtons(preference);

    updateThemeIcon(preference, theme);

    if (persistPreference) {
      localStorage.setItem(storageKey, preference);
    }
  }

  applyThemePreference(getStoredPreference(), false);

  if (themeSlider) {
    themeSlider.addEventListener("input", () => {
      const preference = getPreferenceFromSlider();
      applyThemePreference(preference, true);
    });
  }

  if (themePresetButtons.length) {
    themePresetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const preference = button.getAttribute("data-theme-preset") || "system";
        applyThemePreference(preference, true);
      });
    });
  }

  mediaQuery.addEventListener("change", () => {
    if (getStoredPreference() !== "system") {
      return;
    }

    applyThemePreference("system", false);
  });

  async function preloadCurrentUser() {
    if (!accountNameInput && !accountEmailInput) {
      return;
    }

    try {
      const response = await fetch("/api/v1/user/current-user", {
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const user = payload?.user || payload?.data?.user || payload?.data;

      if (!user) {
        return;
      }

      if (accountNameInput) {
        accountNameInput.value = user.name || "";
      }

      if (accountEmailInput) {
        accountEmailInput.value = user.email || "";
      }
    } catch {
      // Ignore profile preload failures and let user type manually.
    }
  }

  if (updateAccountForm) {
    updateAccountForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(updateAccountMessage, "", false);

      const payload = {};
      const name = accountNameInput?.value?.trim();
      const email = accountEmailInput?.value?.trim();

      if (name) {
        payload.name = name;
      }

      if (email) {
        payload.email = email;
      }

      if (!payload.name && !payload.email) {
        setMessage(
          updateAccountMessage,
          "Enter a name or email to update.",
          true
        );
        return;
      }

      if (updateAccountBtn) {
        updateAccountBtn.disabled = true;
      }

      try {
        const response = await fetch("/api/v1/user/update-account", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Failed to update account");
        }

        const updatedUser = result?.user || result?.data?.user || result?.data;
        if (updatedUser?.name && accountNameInput) {
          accountNameInput.value = updatedUser.name;
        }
        if (updatedUser?.email && accountEmailInput) {
          accountEmailInput.value = updatedUser.email;
        }

        setMessage(
          updateAccountMessage,
          result?.message || "Account updated successfully.",
          false
        );
      } catch (error) {
        setMessage(
          updateAccountMessage,
          error.message || "Failed to update account",
          true
        );
      } finally {
        if (updateAccountBtn) {
          updateAccountBtn.disabled = false;
        }
      }
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(changePasswordMessage, "", false);

      const oldPassword = oldPasswordInput?.value || "";
      const newPassword = newPasswordInput?.value || "";
      const confirmNewPassword = confirmNewPasswordInput?.value || "";

      if (!oldPassword || !newPassword) {
        setMessage(
          changePasswordMessage,
          "Current and new password are required.",
          true
        );
        return;
      }

      if (newPassword.length < 6) {
        setMessage(
          changePasswordMessage,
          "New password must be at least 6 characters.",
          true
        );
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setMessage(
          changePasswordMessage,
          "New password and confirm password do not match.",
          true
        );
        return;
      }

      if (changePasswordBtn) {
        changePasswordBtn.disabled = true;
      }

      try {
        const response = await fetch("/api/v1/user/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ oldPassword, newPassword }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Failed to change password");
        }

        changePasswordForm.reset();
        setMessage(
          changePasswordMessage,
          result?.message || "Password updated successfully.",
          false
        );
      } catch (error) {
        setMessage(
          changePasswordMessage,
          error.message || "Failed to change password",
          true
        );
      } finally {
        if (changePasswordBtn) {
          changePasswordBtn.disabled = false;
        }
      }
    });
  }

  preloadCurrentUser();

  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  if (!deleteAccountBtn) {
    return;
  }

  deleteAccountBtn.addEventListener("click", async () => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );
    if (!shouldDelete) {
      return;
    }

    const password = window.prompt(
      "Enter your password to confirm account deletion:"
    );
    if (!password) {
      return;
    }

    deleteAccountBtn.disabled = true;
    const originalText = deleteAccountBtn.textContent;
    deleteAccountBtn.textContent = "Deleting...";

    try {
      const response = await fetch("/api/v1/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete account");
      }

      window.location.href = "/";
    } catch (error) {
      window.alert(error.message || "Failed to delete account");
      deleteAccountBtn.disabled = false;
      deleteAccountBtn.textContent = originalText;
    }
  });
})();
