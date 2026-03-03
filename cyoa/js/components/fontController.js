const CHAPTER_FONT_CANDIDATES = [
  { name: "Merriweather", stack: "'Merriweather', Georgia, serif" },
  { name: "Crimson Text", stack: "'Crimson Text', 'Times New Roman', serif" },
  { name: "Garamond", stack: "Garamond, 'Times New Roman', serif" },
  { name: "Palatino", stack: "'Palatino Linotype', Palatino, serif" },
  { name: "Book Antiqua", stack: "'Book Antiqua', Palatino, serif" },
  { name: "Baskerville", stack: "Baskerville, Georgia, serif" },
  { name: "Goudy Old Style", stack: "'Goudy Old Style', Garamond, serif" },
  { name: "Cambria", stack: "Cambria, Georgia, serif" },
  { name: "Georgia", stack: "Georgia, serif" },
  { name: "Times New Roman", stack: "'Times New Roman', serif" },
  { name: "Perpetua", stack: "Perpetua, Georgia, serif" },
  { name: "Hoefler Text", stack: "'Hoefler Text', Garamond, serif" },
  { name: "Didot", stack: "Didot, 'Times New Roman', serif" },
  { name: "Bodoni MT", stack: "'Bodoni MT', Didot, serif" },
  { name: "Cochin", stack: "Cochin, Georgia, serif" },
  { name: "Lucida Bright", stack: "'Lucida Bright', Georgia, serif" },
  { name: "Bookman", stack: "Bookman, Georgia, serif" },
  { name: "Constantia", stack: "Constantia, Georgia, serif" },
  {
    name: "Cormorant Garamond",
    stack: "'Cormorant Garamond', Garamond, serif",
  },
  { name: "Cinzel", stack: "Cinzel, 'Times New Roman', serif" },
  {
    name: "Iowan Old Style",
    stack: "'Iowan Old Style', 'Palatino Linotype', serif",
  },
  {
    name: "American Typewriter",
    stack: "'American Typewriter', Georgia, serif",
  },
  { name: "Alegreya", stack: "Alegreya, 'Times New Roman', serif" },
  {
    name: "Libre Baskerville",
    stack: "'Libre Baskerville', Baskerville, serif",
  },
  {
    name: "Sorts Mill Goudy",
    stack: "'Sorts Mill Goudy', 'Goudy Old Style', serif",
  },
  { name: "Cardo", stack: "Cardo, 'Times New Roman', serif" },
  { name: "EB Garamond", stack: "'EB Garamond', Garamond, serif" },
  { name: "Lora", stack: "Lora, Georgia, serif" },
  { name: "IM Fell English", stack: "'IM Fell English', Garamond, serif" },
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
