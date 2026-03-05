import {
  getMusicBaseFolder,
  getMusicMetadataList,
  getMusicTracksList,
} from "../services/musicRepository.js";

function stripMp3Extension(fileName) {
  return fileName.replace(/\.mp3($|\?)/i, "");
}

function titleCase(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function deriveTitleFromFileName(fileName) {
  const baseName = stripMp3Extension(fileName || "");
  const hyphenTokens = baseName.split("-");
  const numberTokenIndex = hyphenTokens.findIndex((token) =>
    /^\d+$/.test(token),
  );
  const endIndex =
    numberTokenIndex >= 0 ? numberTokenIndex : hyphenTokens.length;
  const scopedTokens = hyphenTokens.slice(1, endIndex);
  const titleSource = scopedTokens.length ? scopedTokens.join(" ") : baseName;
  const normalized = titleSource.replace(/[_-]+/g, " ").trim();
  return normalized ? titleCase(normalized) : "Untitled Track";
}

function normalizeMp3Href(folderPath, href) {
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("/")) return href;

  const normalizedFolder = folderPath.endsWith("/")
    ? folderPath
    : `${folderPath}/`;
  return `${normalizedFolder}${href.replace(/^\.\/?/, "")}`;
}

export async function findMp3FilesInFolder(folderPath) {
  try {
    const tracks = await findMusicTracksInFolder(folderPath);
    return tracks.map((track) => track.src);
  } catch {
    return [];
  }
}

export async function findMusicTracksInFolder(folderPath) {
  try {
    const baseFolder = getMusicBaseFolder(folderPath);
    const listedFiles = await getMusicTracksList(folderPath);
    if (!Array.isArray(listedFiles)) return [];

    const metadata = await getMusicMetadataList(folderPath);
    const metadataByFile = new Map(
      metadata
        .filter((item) => item && typeof item.file === "string")
        .map((item) => [
          item.file,
          typeof item.title === "string" && item.title.trim()
            ? item.title.trim()
            : deriveTitleFromFileName(item.file),
        ]),
    );

    const tracks = listedFiles
      .filter((href) => href && /\.mp3($|\?)/i.test(href))
      .map((file) => {
        const src = normalizeMp3Href(baseFolder, file);
        if (!src) return null;

        return {
          file,
          src,
          title: metadataByFile.get(file) || deriveTitleFromFileName(file),
        };
      })
      .filter(Boolean);

    const uniqueBySrc = new Map();
    tracks.forEach((track) => {
      if (!uniqueBySrc.has(track.src)) {
        uniqueBySrc.set(track.src, track);
      }
    });

    return Array.from(uniqueBySrc.values());
  } catch {
    return [];
  }
}

export async function findFirstMp3InFolder(folderPath) {
  const files = await findMp3FilesInFolder(folderPath);
  return files[0] || null;
}
