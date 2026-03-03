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
    const response = await fetch(folderPath);
    if (!response.ok) return [];

    const listingHtml = await response.text();
    const parsed = new DOMParser().parseFromString(listingHtml, "text/html");
    const links = Array.from(parsed.querySelectorAll("a[href]"));
    const mp3Files = links
      .map((link) => link.getAttribute("href"))
      .filter((href) => href && /\.mp3($|\?)/i.test(href))
      .map((href) => normalizeMp3Href(folderPath, href))
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

export async function chooseAudioSource(folderPath, candidates = []) {
  const discovered = await findFirstMp3InFolder(folderPath);
  if (discovered) return discovered;

  const foundCandidate = await candidates.reduce((promise, url) => {
    return promise.then((found) => {
      if (found) return found;
      return fetch(url, { method: "HEAD" })
        .then((res) => (res.ok ? url : null))
        .catch(() => null);
    });
  }, Promise.resolve(null));

  return foundCandidate || candidates[0] || null;
}
