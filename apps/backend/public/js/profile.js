(() => {
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const memberSinceEl = document.getElementById("memberSince");
  const backToDashboardBtn = document.getElementById("backToDashboardBtn");
  const profileSettingsBtn = document.getElementById("profileSettingsBtn");
  const signoutBtn = document.getElementById("profileSignoutBtn");
  const changePhotoBtn = document.getElementById("changePhotoBtn");

  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener("click", () => {
      window.location.href = "/dashboard";
    });
  }

  if (profileSettingsBtn) {
    profileSettingsBtn.addEventListener("click", () => {
      window.location.href = "/settings#account-settings";
    });
  }

  if (changePhotoBtn) {
    changePhotoBtn.addEventListener("click", () => {
      alert("Profile photo update is not implemented yet.");
    });
  }

  if (signoutBtn) {
    signoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/v1/user/signout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: "{}",
        });
        window.location.href = "/";
      } catch (error) {
        console.error("Logout failed:", error);
        window.location.href = "/profile";
      }
    });
  }

  async function loadUserProfile() {
    try {
      const response = await fetch("/api/v1/user/current-user", {
        credentials: "include",
      });

      if (!response.ok) {
        window.location.href = "/signin";
        return;
      }

      const payload = await response.json();
      const user = payload?.user || payload?.data?.user || payload?.data;

      if (!user) {
        throw new Error("Invalid profile payload");
      }

      if (userNameEl) {
        userNameEl.textContent = user.name || "N/A";
      }

      if (userEmailEl) {
        userEmailEl.textContent = user.email || "N/A";
      }

      if (memberSinceEl) {
        memberSinceEl.textContent = user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "N/A";
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      window.location.href = "/signin";
    }
  }

  loadUserProfile();
})();
