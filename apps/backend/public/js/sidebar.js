(() => {
  const signoutLink = document.getElementById("sidebarSignoutLink");
  if (!signoutLink) {
    return;
  }

  signoutLink.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await fetch("/api/v1/user/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: "{}",
      });
    } catch {
      // Best-effort signout; continue redirect either way.
    } finally {
      window.location.href = "/";
    }
  });
})();
