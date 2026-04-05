(() => {
  const root = document.getElementById("signup-root");
  if (!root) return;

  const googleClientId = (root.dataset.googleClientId || "").trim();
  const signupForm = document.getElementById("signupForm");
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const signupBtn = document.getElementById("signupBtn");
  const otpSection = document.getElementById("otpSection");
  const googleSignupBtn = document.getElementById("googleSignupBtn");
  const messageBox = document.getElementById("message");

  let googleCodeClient = null;
  let otpSent = false;

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
    signupBtn.disabled = isLoading;
    googleSignupBtn.disabled = isLoading;
  }

  function getFormData() {
    return {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      otp: document.getElementById("otp").value.trim(),
    };
  }

  async function initGoogleSignup() {
    try {
      if (
        !googleClientId ||
        !googleClientId.endsWith(".apps.googleusercontent.com")
      ) {
        throw new Error(
          "Google client ID is missing. Check backend env GOOGLE_CLIENT_ID."
        );
      }

      const googleOauth2 = await waitForGoogleOAuth();

      googleCodeClient = googleOauth2.initCodeClient({
        client_id: googleClientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response) => {
          if (!response || !response.code) {
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

            window.location.href = "/dashboard";
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
      showMessage(
        error.message || "Google Sign-Up is unavailable right now.",
        "error"
      );
    }
  }

  sendOtpBtn.addEventListener("click", async () => {
    const { name, email } = getFormData();
    if (!name || !email) {
      showMessage(
        "Please fill in your name and email before requesting OTP.",
        "error"
      );
      return;
    }

    setLoading(true);
    sendOtpBtn.textContent = otpSent ? "Resending..." : "Sending...";

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
      otpSection.classList.remove("hidden");
      signupBtn.style.display = "flex";
      sendOtpBtn.textContent = "Resend OTP";
      showMessage(
        data?.message || "OTP sent successfully. Please verify to continue.",
        "success"
      );
    } catch (error) {
      showMessage(
        error.message || "Failed to send OTP. Please try again.",
        "error"
      );
      sendOtpBtn.textContent = otpSent ? "Resend OTP" : "Send OTP";
    } finally {
      setLoading(false);
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!otpSent) {
      showMessage("Please request OTP before signing up.", "error");
      return;
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

      showMessage("Account created successfully! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/dashboard";
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

  initGoogleSignup();
})();
