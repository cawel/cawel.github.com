export function createThemeController() {
  let currentTheme = localStorage.getItem("cyoaTheme") || "yellow";

  const applyTheme = (theme) => {
    const html = document.documentElement;
    if (theme === "minimalistic") {
      html.classList.add("theme-minimalistic");
    } else {
      html.classList.remove("theme-minimalistic");
    }

    currentTheme = theme;
    localStorage.setItem("cyoaTheme", theme);
    console.log(`[theme] Switched to: ${theme}`);
  };

  const cycleTheme = () => {
    const nextTheme = currentTheme === "yellow" ? "minimalistic" : "yellow";
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
