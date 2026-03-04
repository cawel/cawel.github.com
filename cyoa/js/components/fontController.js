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
  };
}
