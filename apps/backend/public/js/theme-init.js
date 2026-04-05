(() => {
  const savedTheme = localStorage.getItem("theme-preference");
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const themePreference =
    savedTheme === "dark" || savedTheme === "light" || savedTheme === "system"
      ? savedTheme
      : "system";
  const resolvedTheme =
    themePreference === "dark" || themePreference === "light"
      ? themePreference
      : isDark
        ? "dark"
        : "light";

  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolvedTheme);
  root.style.backgroundColor = resolvedTheme === "dark" ? "#0c1324" : "#f7f9fb";

  const syncBodyTheme = () => {
    if (!document.body) {
      return;
    }

    document.body.classList.remove("dark", "light");
    document.body.classList.add(resolvedTheme);
  };

  syncBodyTheme();
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", syncBodyTheme, {
      once: true,
    });
  }
})();
