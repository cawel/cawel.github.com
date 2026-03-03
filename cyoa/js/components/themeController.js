export function createThemeController() {
  const persistedTheme = localStorage.getItem("cyoaTheme");
  const allowedThemes = new Set(["yellow", "minimalist"]);
  let currentTheme = allowedThemes.has(persistedTheme)
    ? persistedTheme
    : "yellow";

  const applyTheme = (theme) => {
    const html = document.documentElement;
    if (theme === "minimalist") {
      html.classList.add("theme-minimalist");
    } else {
      html.classList.remove("theme-minimalist");
    }

    currentTheme = theme;
    localStorage.setItem("cyoaTheme", theme);
    console.log(`[theme] Switched to: ${theme}`);
  };

  const cycleTheme = () => {
    const nextTheme = currentTheme === "yellow" ? "minimalist" : "yellow";
    applyTheme(nextTheme);
  };

  const initialize = () => {
    applyTheme(currentTheme);
  };

  return {
    initialize,
    cycleTheme,
    applyTheme,
    getCurrentTheme: () => currentTheme,
  };
}
