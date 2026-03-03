export async function findFirstMp3InFolder(folderPath) {
  try {
    const response = await fetch(folderPath);
    if (!response.ok) return null;

    const listingHtml = await response.text();
    const parsed = new DOMParser().parseFromString(listingHtml, "text/html");
    const links = Array.from(parsed.querySelectorAll("a[href]"));
    const mp3Href = links
      .map((link) => link.getAttribute("href"))
      .find((href) => href && /\.mp3($|\?)/i.test(href));

    if (!mp3Href) return null;
    if (/^https?:\/\//i.test(mp3Href)) return mp3Href;
    if (mp3Href.startsWith("/")) return mp3Href;

    const normalizedFolder = folderPath.endsWith("/")
      ? folderPath
      : `${folderPath}/`;
    return `${normalizedFolder}${mp3Href.replace(/^\.\/?/, "")}`;
  } catch {
    return null;
  }
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
