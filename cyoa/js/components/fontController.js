const CHAPTER_FONT_CANDIDATES = [
  { name: "Merriweather", stack: "'Merriweather', Georgia, serif" },
  { name: "Garamond", stack: "Garamond, 'Times New Roman', serif" },
  { name: "Palatino", stack: "'Palatino Linotype', Palatino, serif" },
  { name: "Courier New", stack: "'Courier New', Courier, monospace" },
  { name: "Vollkorn", stack: "Vollkorn, Georgia, serif" },
];

export function createFontController() {
  let chapterFontIndex = 0;
  let fontButton = null;

  const normalizeFontIndex = (index) => {
    const parsedIndex = Number.parseInt(index, 10);
    if (Number.isNaN(parsedIndex)) return chapterFontIndex;

    const length = CHAPTER_FONT_CANDIDATES.length;
    if (length === 0) return 0;
    return ((parsedIndex % length) + length) % length;
  };

  const getPrimaryFontName = (stack) => {
    const [firstPart = ""] = stack.split(",");
    return firstPart.trim().replace(/^['"]|['"]$/g, "");
  };

  const applyChapterFont = () => {
    const font = CHAPTER_FONT_CANDIDATES[chapterFontIndex];
    document.documentElement.style.setProperty(
      "--chapter-content-font",
      font.stack,
    );
    console.log(
      `[font] Chapter content font: ${font.name} (${chapterFontIndex + 1}/${CHAPTER_FONT_CANDIDATES.length})`,
    );
  };

  const cycleChapterFont = () => {
    chapterFontIndex = (chapterFontIndex + 1) % CHAPTER_FONT_CANDIDATES.length;
    applyChapterFont();
  };

  const applyFontByIndex = (index) => {
    chapterFontIndex = normalizeFontIndex(index);
    applyChapterFont();
  };

  const getAvailableFonts = () => {
    return CHAPTER_FONT_CANDIDATES.map((font, index) => ({
      index,
      label: getPrimaryFontName(font.stack),
    }));
  };

  const onFontButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    cycleChapterFont();
  };

  const setControl = (button) => {
    fontButton = button;
    if (!fontButton) return;

    fontButton.addEventListener("click", onFontButtonClick);
  };

  const initialize = () => {
    applyChapterFont();
  };

  return {
    initialize,
    setControl,
    cycleChapterFont,
    applyFontByIndex,
    getAvailableFonts,
    getCurrentFontIndex: () => chapterFontIndex,
  };
}
