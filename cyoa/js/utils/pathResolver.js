export function withBasePath(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") {
    return normalizedPath;
  }

  const { hostname, pathname } = window.location;

  if (!hostname.endsWith("github.io")) {
    return normalizedPath;
  }

  const segments = pathname.split("/").filter(Boolean);
  const projectBase = segments.length > 0 ? `/${segments[0]}` : "";

  return `${projectBase}${normalizedPath}`;
}
