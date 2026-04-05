(() => {
  const root = document.getElementById("signin-root");
  if (!root) return;

  const googleClientId = (root.dataset.googleClientId || "").trim();
  const messageBox = document.getElementById("message");
  const signinForm = document.getElementById("signinForm");
  const signinBtn = document.getElementById("signinBtn");
  const googleSigninBtn = document.getElementById("googleSigninBtn");

  let googleCodeClient = null;

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
    signinBtn.textContent = isLoading ? "Signing In..." : "Sign In";
  }

  async function initGoogleSignin() {
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

            window.location.href = "/dashboard";
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
      showMessage(
        error.message || "Google Sign-In is unavailable right now.",
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
          email: document.getElementById("email").value,
          password: document.getElementById("password").value,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Sign in failed");
      }

      window.location.href = "/dashboard";
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

  initGoogleSignin();
})();
