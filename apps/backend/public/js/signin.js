(() => {
  const root = document.getElementById("signin-root");
  if (!root) return;

  const googleClientId = (root.dataset.googleClientId || "").trim();
  const messageBox = document.getElementById("message");
  const signinMainSection = document.getElementById("signinMainSection");
  const signinOtpSection = document.getElementById("signinOtpSection");
  const signinResetPasswordSection = document.getElementById(
    "signinResetPasswordSection"
  );
  const signinForm = document.getElementById("signinForm");
  const signinBtn = document.getElementById("signinBtn");
  const googleSigninBtn = document.getElementById("googleSigninBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const otpBackToSigninBtn = document.getElementById("otpBackToSigninBtn");
  const passwordBackToOtpBtn = document.getElementById("passwordBackToOtpBtn");
  const resendResetOtpBtn = document.getElementById("resendResetOtpBtn");
  const verifyResetOtpBtn = document.getElementById("verifyResetOtpBtn");
  const confirmResetBtn = document.getElementById("confirmResetBtn");
  const resetOtpEmail = document.getElementById("resetOtpEmail");
  const resetOtpTimer = document.getElementById("resetOtpTimer");
  const resetOtpDigits = Array.from(
    document.querySelectorAll("[data-reset-otp-digit]")
  );
  const resetNewPasswordInput = document.getElementById("resetNewPassword");
  const resetConfirmPasswordInput = document.getElementById(
    "resetConfirmPassword"
  );
  const toggleResetNewPasswordVisibility = document.getElementById(
    "toggleResetNewPasswordVisibility"
  );
  const resetPasswordVisibilityIcon = document.getElementById(
    "resetPasswordVisibilityIcon"
  );
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  let googleCodeClient = null;
  let resetOtpTimerInterval = null;
  let resetOtpSecondsRemaining = 0;
  let verifiedResetOtp = "";
  let activeSectionView = "signin";
  const sectionHideTimers = new WeakMap();

  const sectionMap = {
    signin: signinMainSection,
    otp: signinOtpSection,
    password: signinResetPasswordSection,
  };

  function initializeSectionTransitions() {
    Object.values(sectionMap).forEach((section) => {
      if (!section) {
        return;
      }

      section.classList.add("transition-all", "duration-200", "ease-out");
    });
  }

  function getPostAuthRedirect() {
    const params = new URLSearchParams(window.location.search);
    const next = (params.get("next") || "").trim();
    if (next.startsWith("/")) {
      sessionStorage.removeItem("postAuthRedirect");
      return next;
    }

    const stored = (sessionStorage.getItem("postAuthRedirect") || "").trim();
    if (stored.startsWith("/")) {
      sessionStorage.removeItem("postAuthRedirect");
      return stored;
    }

    return "/dashboard";
  }

  function waitForGoogleOAuth(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();

      const check = () => {
        if (window.google?.accounts?.oauth2) {
          resolve(window.google.accounts.oauth2);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error("Google Sign-In is unavailable right now."));
          return;
        }

        window.setTimeout(check, 50);
      };

      check();
    });
  }

  function showMessage(text, type) {
    if (window.appToast) {
      if (type === "success") {
        window.appToast.success(text);
      } else {
        window.appToast.error(text);
      }

      if (messageBox) {
        messageBox.textContent = "";
        messageBox.className = "hidden";
      }
      return;
    }

    if (!messageBox) {
      return;
    }

    const baseClass = "mb-6 rounded-xl px-4 py-3 text-sm font-medium";
    const typeClass =
      type === "success"
        ? "bg-emerald-50 text-emerald-600 border border-emerald-600/20"
        : "bg-red-50 text-red-500 border border-red-500/20";

    messageBox.textContent = text;
    messageBox.className = `${baseClass} ${typeClass}`;
  }

  function setLoading(isLoading) {
    signinBtn.disabled = isLoading;
    googleSigninBtn.disabled = isLoading;
    if (resendResetOtpBtn) {
      resendResetOtpBtn.disabled = isLoading || resetOtpSecondsRemaining > 0;
    }
    if (confirmResetBtn) {
      confirmResetBtn.disabled = isLoading;
    }
    if (verifyResetOtpBtn) {
      verifyResetOtpBtn.disabled = isLoading;
    }
    signinBtn.textContent = isLoading ? "Signing In..." : "Sign In";
  }

  function setSectionView(view) {
    activeSectionView = view;

    Object.entries(sectionMap).forEach(([key, section]) => {
      if (!section) {
        return;
      }

      const existingTimer = sectionHideTimers.get(section);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
        sectionHideTimers.delete(section);
      }

      if (key === view) {
        section.classList.remove(
          "hidden",
          "opacity-0",
          "translate-y-1",
          "pointer-events-none"
        );
        section.classList.add("opacity-100", "translate-y-0");

        if (key !== "signin") {
          section.classList.add("flex", "flex-col", "justify-center");
        }
        return;
      }

      section.classList.remove("flex", "flex-col", "justify-center");

      section.classList.remove("opacity-100", "translate-y-0");
      section.classList.add(
        "opacity-0",
        "translate-y-1",
        "pointer-events-none"
      );

      const hideTimer = window.setTimeout(() => {
        if (section !== sectionMap[activeSectionView]) {
          section.classList.add("hidden");
        }
      }, 210);

      sectionHideTimers.set(section, hideTimer);
    });
  }

  function clearResetOtpTimer() {
    if (!resetOtpTimerInterval) {
      return;
    }

    window.clearInterval(resetOtpTimerInterval);
    resetOtpTimerInterval = null;
  }

  function formatTimer(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function updateResetTimerUi() {
    if (resetOtpTimer) {
      resetOtpTimer.textContent = formatTimer(resetOtpSecondsRemaining);
    }

    if (!resendResetOtpBtn) {
      return;
    }

    if (resetOtpSecondsRemaining > 0) {
      resendResetOtpBtn.disabled = true;
    } else {
      resendResetOtpBtn.disabled = false;
    }
  }

  function startResetOtpTimer(seconds = 60) {
    clearResetOtpTimer();
    resetOtpSecondsRemaining = seconds;
    updateResetTimerUi();

    resetOtpTimerInterval = window.setInterval(() => {
      resetOtpSecondsRemaining = Math.max(resetOtpSecondsRemaining - 1, 0);
      updateResetTimerUi();

      if (resetOtpSecondsRemaining === 0) {
        clearResetOtpTimer();
      }
    }, 1000);
  }

  function openResetOtpView(email) {
    if (resetOtpEmail) {
      resetOtpEmail.textContent = email;
    }

    setSectionView("otp");

    resetOtpDigits.forEach((input) => {
      input.value = "";
    });

    if (resetOtpDigits[0]) {
      try {
        resetOtpDigits[0].focus({ preventScroll: true });
      } catch {
        resetOtpDigits[0].focus();
      }
    }

    if (resetNewPasswordInput) {
      resetNewPasswordInput.value = "";
    }
    if (resetConfirmPasswordInput) {
      resetConfirmPasswordInput.value = "";
    }

    verifiedResetOtp = "";

    startResetOtpTimer(60);
  }

  function collectResetOtpDigits() {
    return resetOtpDigits.map((input) => input.value.trim()).join("");
  }

  function bindSegmentedOtpInputs(inputs) {
    inputs.forEach((input, index) => {
      input.addEventListener("input", (event) => {
        const target = event.target;
        const value = (target.value || "").replace(/\D/g, "").slice(0, 1);
        target.value = value;

        if (value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }

        if (event.key === "ArrowLeft" && index > 0) {
          event.preventDefault();
          inputs[index - 1].focus();
        }

        if (event.key === "ArrowRight" && index < inputs.length - 1) {
          event.preventDefault();
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("paste", (event) => {
        const pasted = (event.clipboardData?.getData("text") || "")
          .replace(/\D/g, "")
          .slice(0, inputs.length);

        if (!pasted) {
          return;
        }

        event.preventDefault();
        pasted.split("").forEach((char, idx) => {
          if (inputs[idx]) {
            inputs[idx].value = char;
          }
        });

        const focusIndex = Math.min(pasted.length, inputs.length - 1);
        inputs[focusIndex]?.focus();
      });
    });
  }

  async function requestForgotPasswordOtp() {
    const email = emailInput.value.trim();
    if (!email) {
      showMessage("Please enter your email first.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/v1/user/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to send OTP");
      }

      showMessage(
        data?.message || "OTP sent. Enter OTP and your new password.",
        "success"
      );
      openResetOtpView(email);
    } catch (error) {
      showMessage(error.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  }

  async function initGoogleSignin() {
    try {
      if (!googleClientId) {
        const errorMsg =
          "Google Sign-In is not configured. Please check backend environment: NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID must be set to a valid Google Client ID (e.g., xxx.apps.googleusercontent.com).";
        console.error(errorMsg);
        showMessage(
          "Google Sign-In is unavailable. Configuration missing.",
          "error"
        );
        return;
      }

      if (!googleClientId.endsWith(".apps.googleusercontent.com")) {
        const errorMsg = `Invalid Google Client ID format: "${googleClientId}". Must end with ".apps.googleusercontent.com".`;
        console.error(errorMsg);
        showMessage(
          "Google Sign-In configuration is invalid. Please contact support.",
          "error"
        );
        return;
      }

      const googleOauth2 = await waitForGoogleOAuth();

      googleCodeClient = googleOauth2.initCodeClient({
        client_id: googleClientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response) => {
          if (!response || !response.code) {
            const errorMsg = `Google OAuth callback failed: ${JSON.stringify(response)}`;
            console.error(errorMsg);
            showMessage("Google sign-in failed. Please try again.", "error");
            return;
          }

          try {
            setLoading(true);
            const signinResponse = await fetch("/api/v1/user/google/signin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                code: response.code,
                redirectUri: "postmessage",
              }),
            });

            const signinData = await signinResponse.json();
            if (!signinResponse.ok) {
              throw new Error(signinData?.message || "Google sign-in failed");
            }

            window.location.href = getPostAuthRedirect();
          } catch (error) {
            showMessage(
              error.message || "Google sign-in failed. Please try again.",
              "error"
            );
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (error) {
      const errorMsg = `Google Sign-In initialization failed: ${error?.message || "Unknown error"}`;
      console.error(errorMsg);
      showMessage(
        "Google Sign-In is unavailable right now. Please try again later.",
        "error"
      );
    }
  }

  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/v1/user/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Sign in failed");
      }

      window.location.href = getPostAuthRedirect();
    } catch (error) {
      showMessage(
        error.message || "Sign in failed. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  });

  googleSigninBtn.addEventListener("click", () => {
    if (!googleCodeClient) {
      showMessage(
        "Google Sign-In is still loading. Try again in a moment.",
        "error"
      );
      return;
    }
    googleCodeClient.requestCode();
  });

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      await requestForgotPasswordOtp();
    });
  }

  if (otpBackToSigninBtn) {
    otpBackToSigninBtn.addEventListener("click", () => {
      clearResetOtpTimer();
      verifiedResetOtp = "";
      setSectionView("signin");
    });
  }

  if (passwordBackToOtpBtn) {
    passwordBackToOtpBtn.addEventListener("click", () => {
      setSectionView("otp");
    });
  }

  if (resendResetOtpBtn) {
    resendResetOtpBtn.addEventListener("click", async () => {
      if (resetOtpSecondsRemaining > 0) {
        return;
      }
      await requestForgotPasswordOtp();
    });
  }

  if (verifyResetOtpBtn) {
    verifyResetOtpBtn.addEventListener("click", () => {
      const otp = collectResetOtpDigits();
      if (otp.length !== 6) {
        showMessage("Please enter a valid 6-digit OTP.", "error");
        return;
      }

      verifiedResetOtp = otp;
      setSectionView("password");
      if (resetNewPasswordInput) {
        try {
          resetNewPasswordInput.focus({ preventScroll: true });
        } catch {
          resetNewPasswordInput.focus();
        }
      }
    });
  }

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const otp = verifiedResetOtp || collectResetOtpDigits();
      const newPassword = resetNewPasswordInput?.value || "";
      const confirmPassword = resetConfirmPasswordInput?.value || "";

      if (!email) {
        showMessage("Please enter your email first.", "error");
        return;
      }

      if (otp.length !== 6) {
        showMessage("Please enter a valid 6-digit OTP.", "error");
        return;
      }

      if (newPassword.length < 6) {
        showMessage("New password must be at least 6 characters.", "error");
        return;
      }

      if (!confirmPassword) {
        showMessage("Please re-enter your new password.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage(
          "New password and re-entered password do not match.",
          "error"
        );
        return;
      }

      setLoading(true);
      const originalLabel = confirmResetBtn.textContent;
      confirmResetBtn.textContent = "Updating Password...";

      try {
        const response = await fetch(
          "/api/v1/user/forgot-password/change-password",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, otp, newPassword }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Password reset failed");
        }

        showMessage(
          data?.message ||
            "Password changed successfully. You can now sign in.",
          "success"
        );

        clearResetOtpTimer();
        setSectionView("signin");
        resetOtpDigits.forEach((input) => {
          input.value = "";
        });
        verifiedResetOtp = "";
        if (resetNewPasswordInput) {
          resetNewPasswordInput.value = "";
        }
        if (resetConfirmPasswordInput) {
          resetConfirmPasswordInput.value = "";
        }
      } catch (error) {
        showMessage(error.message || "Password reset failed", "error");
      } finally {
        confirmResetBtn.textContent = originalLabel;
        setLoading(false);
      }
    });
  }

  if (toggleResetNewPasswordVisibility && resetNewPasswordInput) {
    toggleResetNewPasswordVisibility.addEventListener("click", () => {
      const nextType =
        resetNewPasswordInput.type === "password" ? "text" : "password";
      resetNewPasswordInput.type = nextType;

      if (resetPasswordVisibilityIcon) {
        resetPasswordVisibilityIcon.textContent =
          nextType === "password" ? "visibility" : "visibility_off";
      }
    });
  }

  bindSegmentedOtpInputs(resetOtpDigits);
  initializeSectionTransitions();
  setSectionView("signin");

  initGoogleSignin();
})();
