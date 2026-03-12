import { withBasePath } from "../utils/pathResolver.js";
import { getOrCreateCachedRequest } from "../utils/requestCache.js";

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
  return getOrCreateCachedRequest(
    tracksPromiseByFolder,
    key,
    async () => {
      const response = await fetch(getTracksManifestPath(folderPath));
      if (!response.ok) {
        return [];
      }

      const listedFiles = await response.json();
      return Array.isArray(listedFiles) ? listedFiles : [];
    },
    {
      onError: () => [],
    },
  );
}

export async function getMusicMetadataList(folderPath) {
  const key = normalizeFolderPath(folderPath);
  return getOrCreateCachedRequest(
    metadataPromiseByFolder,
    key,
    async () => {
      const response = await fetch(getMetadataManifestPath(folderPath));
      if (!response.ok) {
        return [];
      }

      const metadata = await response.json();
      return Array.isArray(metadata) ? metadata : [];
    },
    {
      onError: () => [],
    },
  );
}
