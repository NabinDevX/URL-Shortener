(() => {
  const root = document.getElementById("signup-root");
  if (!root) return;

  const googleClientId = (root.dataset.googleClientId || "").trim();
  const signupForm = document.getElementById("signupForm");
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const signupBtn = document.getElementById("signupBtn");
  const googleSignupBtn = document.getElementById("googleSignupBtn");
  const messageBox = document.getElementById("message");
  const otpHiddenInput = document.getElementById("otp");
  const signupOtpModal = document.getElementById("signupOtpModal");
  const closeSignupOtpModalBtn = document.getElementById(
    "closeSignupOtpModalBtn"
  );
  const signupOtpEmail = document.getElementById("signupOtpEmail");
  const signupOtpTimer = document.getElementById("signupOtpTimer");
  const resendSignupOtpBtn = document.getElementById("resendSignupOtpBtn");
  const verifySignupOtpBtn = document.getElementById("verifySignupOtpBtn");
  const signupOtpDigits = Array.from(
    document.querySelectorAll("[data-signup-otp-digit]")
  );

  let googleCodeClient = null;
  let otpSent = false;
  let otpTimerInterval = null;
  let otpSecondsRemaining = 0;

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
          reject(new Error("Google Sign-Up is unavailable right now."));
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
    sendOtpBtn.disabled = isLoading;
    if (signupBtn) {
      signupBtn.disabled = isLoading;
    }
    googleSignupBtn.disabled = isLoading;
    if (resendSignupOtpBtn) {
      resendSignupOtpBtn.disabled = isLoading || otpSecondsRemaining > 0;
    }
    if (verifySignupOtpBtn) {
      verifySignupOtpBtn.disabled = isLoading;
    }
  }

  function getFormData() {
    return {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      otp: (otpHiddenInput?.value || "").trim(),
    };
  }

  function clearOtpTimer() {
    if (!otpTimerInterval) {
      return;
    }

    window.clearInterval(otpTimerInterval);
    otpTimerInterval = null;
  }

  function formatOtpTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function updateSignupTimerUi() {
    if (signupOtpTimer) {
      signupOtpTimer.textContent = formatOtpTime(otpSecondsRemaining);
    }

    if (!resendSignupOtpBtn) {
      return;
    }

    if (otpSecondsRemaining > 0) {
      resendSignupOtpBtn.disabled = true;
      resendSignupOtpBtn.textContent = `Resend in ${otpSecondsRemaining}s`;
    } else {
      resendSignupOtpBtn.disabled = false;
      resendSignupOtpBtn.textContent = "Resend OTP";
    }
  }

  function startSignupOtpTimer(seconds = 60) {
    clearOtpTimer();
    otpSecondsRemaining = seconds;
    updateSignupTimerUi();

    otpTimerInterval = window.setInterval(() => {
      otpSecondsRemaining = Math.max(otpSecondsRemaining - 1, 0);
      updateSignupTimerUi();

      if (otpSecondsRemaining === 0) {
        clearOtpTimer();
      }
    }, 1000);
  }

  function openSignupOtpModal(email) {
    if (signupOtpEmail) {
      signupOtpEmail.textContent = email;
    }

    if (signupOtpModal) {
      signupOtpModal.classList.remove("hidden");
      signupOtpModal.classList.add("flex");
    }

    signupOtpDigits.forEach((input) => {
      input.value = "";
    });

    if (otpHiddenInput) {
      otpHiddenInput.value = "";
    }

    if (signupOtpDigits[0]) {
      signupOtpDigits[0].focus();
    }

    startSignupOtpTimer(60);
  }

  function closeSignupOtpModal() {
    if (signupOtpModal) {
      signupOtpModal.classList.remove("flex");
      signupOtpModal.classList.add("hidden");
    }
  }

  function collectSignupOtpDigits() {
    return signupOtpDigits.map((input) => input.value.trim()).join("");
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

  async function requestSignupOtp(isResend = false) {
    const { name, email } = getFormData();
    if (!name || !email) {
      showMessage(
        "Please fill in your name and email before requesting OTP.",
        "error"
      );
      return;
    }

    setLoading(true);
    sendOtpBtn.textContent = isResend ? "Resending..." : "Sending...";

    try {
      const response = await fetch("/api/v1/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to send OTP");
      }

      otpSent = true;
      if (signupBtn) {
        signupBtn.style.display = "flex";
      }
      sendOtpBtn.textContent = "Resend OTP";
      showMessage(
        data?.message || "OTP sent successfully. Please verify to continue.",
        "success"
      );
      openSignupOtpModal(email);
    } catch (error) {
      showMessage(
        error.message || "Failed to send OTP. Please try again.",
        "error"
      );
      sendOtpBtn.textContent = otpSent ? "Resend OTP" : "Send OTP";
    } finally {
      setLoading(false);
    }
  }

  async function initGoogleSignup() {
    try {
      if (!googleClientId) {
        const errorMsg =
          "Google Sign-Up is not configured. Please check backend environment: NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID must be set to a valid Google Client ID (e.g., xxx.apps.googleusercontent.com).";
        console.error(errorMsg);
        showMessage(
          "Google Sign-Up is unavailable. Configuration missing.",
          "error"
        );
        return;
      }

      if (!googleClientId.endsWith(".apps.googleusercontent.com")) {
        const errorMsg = `Invalid Google Client ID format: "${googleClientId}". Must end with ".apps.googleusercontent.com".`;
        console.error(errorMsg);
        showMessage(
          "Google Sign-Up configuration is invalid. Please contact support.",
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
            showMessage("Google sign-up failed. Please try again.", "error");
            return;
          }

          try {
            setLoading(true);
            const signupResponse = await fetch("/api/v1/user/google/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                code: response.code,
                redirectUri: "postmessage",
              }),
            });

            const signupData = await signupResponse.json();
            if (!signupResponse.ok) {
              throw new Error(signupData?.message || "Google sign-up failed");
            }

            window.location.href = getPostAuthRedirect();
          } catch (error) {
            showMessage(
              error.message || "Google sign-up failed. Please try again.",
              "error"
            );
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (error) {
      const errorMsg = `Google Sign-Up initialization failed: ${error?.message || "Unknown error"}`;
      console.error(errorMsg);
      showMessage(
        "Google Sign-Up is unavailable right now. Please try again later.",
        "error"
      );
    }
  }

  sendOtpBtn.addEventListener("click", async () => {
    await requestSignupOtp(otpSent);
  });

  if (resendSignupOtpBtn) {
    resendSignupOtpBtn.addEventListener("click", async () => {
      if (otpSecondsRemaining > 0) {
        return;
      }
      await requestSignupOtp(true);
    });
  }

  if (closeSignupOtpModalBtn) {
    closeSignupOtpModalBtn.addEventListener("click", () => {
      closeSignupOtpModal();
    });
  }

  if (verifySignupOtpBtn) {
    verifySignupOtpBtn.addEventListener("click", () => {
      const otp = collectSignupOtpDigits();
      if (otpHiddenInput) {
        otpHiddenInput.value = otp;
      }
      signupForm.requestSubmit();
    });
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!otpSent) {
      showMessage("Please request OTP before signing up.", "error");
      return;
    }

    const computedOtp = collectSignupOtpDigits();
    if (otpHiddenInput) {
      otpHiddenInput.value = computedOtp;
    }

    const { name, email, password, otp } = getFormData();
    if (!otp || otp.length !== 6) {
      showMessage("Please enter a valid 6-digit OTP.", "error");
      return;
    }

    setLoading(true);
    signupBtn.textContent = "Creating Account...";

    try {
      const response = await fetch("/api/v1/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Signup failed");
      }

      clearOtpTimer();
      closeSignupOtpModal();
      showMessage("Account created successfully! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = getPostAuthRedirect();
      }, 1200);
    } catch (error) {
      showMessage(error.message || "Signup failed. Please try again.", "error");
      signupBtn.textContent = "Verify OTP & Sign Up";
    } finally {
      setLoading(false);
    }
  });

  googleSignupBtn.addEventListener("click", () => {
    if (!googleCodeClient) {
      showMessage(
        "Google Sign-Up is still loading. Try again in a moment.",
        "error"
      );
      return;
    }
    googleCodeClient.requestCode();
  });

  bindSegmentedOtpInputs(signupOtpDigits);

  initGoogleSignup();
})();
