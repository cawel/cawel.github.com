export function createThemeController() {
  const THEMES = [
    { key: "yellow", className: null },
    { key: "minimalist", className: "theme-minimalist" },
    { key: "blue", className: "theme-blue" },
  ];

  const THEME_KEYS = new Set(THEMES.map((theme) => theme.key));
  const THEME_CLASSES = THEMES.map((theme) => theme.className).filter(Boolean);

  const persistedTheme = localStorage.getItem("cyoaTheme");
  let currentTheme = THEME_KEYS.has(persistedTheme) ? persistedTheme : "yellow";

  const applyTheme = (theme) => {
    const html = document.documentElement;
    const nextTheme = THEME_KEYS.has(theme) ? theme : "yellow";

    html.classList.remove(...THEME_CLASSES);

    const themeConfig = THEMES.find((item) => item.key === nextTheme);
    if (themeConfig && themeConfig.className) {
      html.classList.add(themeConfig.className);
    }

    currentTheme = nextTheme;
    localStorage.setItem("cyoaTheme", nextTheme);
    console.log(`[theme] Switched to: ${nextTheme}`);
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((theme) => theme.key === currentTheme);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextTheme = THEMES[(safeIndex + 1) % THEMES.length].key;
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
