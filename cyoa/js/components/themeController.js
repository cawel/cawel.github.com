export function createThemeController() {
  const STORAGE_KEY = "cyoaTheme";
  const THEMES = [
    { key: "yellow", className: null },
    { key: "minimalist", className: "theme-minimalist" },
    { key: "blue", className: "theme-blue" },
    { key: "ember", className: "theme-ember" },
  ];

  const THEME_KEYS = new Set(THEMES.map((theme) => theme.key));
  const THEME_CLASSES = THEMES.map((theme) => theme.className).filter(Boolean);

  const readThemeFromStorage = () => {
    return localStorage.getItem(STORAGE_KEY);
  };

  const saveThemeToStorage = (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
  };

  const persistedTheme = readThemeFromStorage();
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
    saveThemeToStorage(nextTheme);
    console.log(`[theme] Switched to: ${nextTheme}`);
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(
      (theme) => theme.key === currentTheme,
    );
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
