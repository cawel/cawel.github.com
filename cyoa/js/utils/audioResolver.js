import { withBasePath } from "./pathResolver.js";

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
    const normalizedFolderPath = folderPath.replace(/^\/+|\/+$/g, "");
    const baseFolder = withBasePath(`/${normalizedFolderPath}/`);
    const manifestPath = withBasePath(`/${normalizedFolderPath}/tracks.json`);

    const response = await fetch(manifestPath);
    if (!response.ok) return [];

    const listedFiles = await response.json();
    if (!Array.isArray(listedFiles)) return [];

    const mp3Files = listedFiles
      .filter((href) => href && /\.mp3($|\?)/i.test(href))
      .map((href) => normalizeMp3Href(baseFolder, href))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return Array.from(new Set(mp3Files));
  } catch {
    return [];
  }
}

export async function findFirstMp3InFolder(folderPath) {
  const files = await findMp3FilesInFolder(folderPath);
  return files[0] || null;
}
