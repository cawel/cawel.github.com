import { withBasePath } from "../utils/pathResolver.js";

const tracksPromiseByFolder = new Map();
const metadataPromiseByFolder = new Map();

function normalizeFolderPath(folderPath) {
  return String(folderPath || "").replace(/^\/+|\/+$/g, "");
}

export function getMusicBaseFolder(folderPath) {
  const normalizedFolderPath = normalizeFolderPath(folderPath);
  return withBasePath(`/${normalizedFolderPath}/`);
}

function getTracksManifestPath(folderPath) {
  const normalizedFolderPath = normalizeFolderPath(folderPath);
  return withBasePath(`/${normalizedFolderPath}/tracks.json`);
}

function getMetadataManifestPath(folderPath) {
  const normalizedFolderPath = normalizeFolderPath(folderPath);
  return withBasePath(`/${normalizedFolderPath}/metadata.json`);
}

export async function getMusicTracksList(folderPath) {
  const key = normalizeFolderPath(folderPath);
  if (!tracksPromiseByFolder.has(key)) {
    const request = fetch(getTracksManifestPath(folderPath))
      .then(async (response) => {
        if (!response.ok) return [];
        const listedFiles = await response.json();
        return Array.isArray(listedFiles) ? listedFiles : [];
      })
      .catch(() => []);

    tracksPromiseByFolder.set(key, request);
  }

  return tracksPromiseByFolder.get(key);
}

export async function getMusicMetadataList(folderPath) {
  const key = normalizeFolderPath(folderPath);
  if (!metadataPromiseByFolder.has(key)) {
    const request = fetch(getMetadataManifestPath(folderPath))
      .then(async (response) => {
        if (!response.ok) return [];
        const metadata = await response.json();
        return Array.isArray(metadata) ? metadata : [];
      })
      .catch(() => []);

    metadataPromiseByFolder.set(key, request);
  }

  return metadataPromiseByFolder.get(key);
}
