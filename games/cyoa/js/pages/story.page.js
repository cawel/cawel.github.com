/**
 * Story page - displays a story with chapters and choices
 */

import {
  clearStoryPageDataCache,
  getParsedStoryCacheKeys,
  getParsedStoryCacheSize,
  loadStoryPageModel,
} from "../services/storyPageDataService.js";
import { createPage } from "../utils/pageContract.js";
import {
  renderStoryChapterBody,
  renderStoryChapter,
  renderStoryErrorState,
  renderStoryMissingChapterState,
} from "./story.template.js";

/** @typedef {import("../types.js").StoryChapter} StoryChapter */
/** @typedef {import("../types.js").PageContract} PageContract */

/**
 * @typedef {object} StoryPageModel
 * @property {string} storyId
 * @property {number} chapterNumber
 * @property {StoryChapter|null} chapter
 * @property {string[]|null} chapterImagePaths
 * @property {string|null} error
 */

/**
 * @param {{ storyId: string, chapterId?: string }} params
 * @returns {Promise<StoryPageModel>}
 */
export async function loadStoryPageData(params) {
  return loadStoryPageModel(params);
}

/**
 * @param {StoryPageModel} model
 * @returns {Promise<string>}
 */
export async function renderStoryPage(model) {
  if (model.error) {
    return renderStoryErrorState(model.error);
  }

  if (!model.chapter) {
    return renderStoryMissingChapterState();
  }

  return renderStoryChapter(
    model.storyId,
    model.chapter,
    model.chapterImagePaths,
  );
}

function getIllustrationFigure(image) {
  return image?.closest?.(".chapter-illustration") || null;
}

function getFallbackSources(figure) {
  return (figure?.dataset?.fallbackSources || "")
    .split("|")
    .map((source) => source.trim())
    .filter(Boolean);
}

function setFallbackSources(figure, sources) {
  if (!figure) {
    return;
  }

  figure.dataset.fallbackSources = sources.join("|");
}

function markIllustrationLoaded(image) {
  const figure = getIllustrationFigure(image);
  if (!figure) {
    return;
  }

  figure.classList.add("chapter-illustration-loaded");
  figure.removeAttribute("hidden");
}

function tryLoadIllustrationFallback(image) {
  const figure = getIllustrationFigure(image);
  if (!figure) {
    return;
  }

  const remainingSources = getFallbackSources(figure);
  if (remainingSources.length === 0) {
    figure.setAttribute("hidden", "hidden");
    return;
  }

  const nextSource = remainingSources.shift();
  setFallbackSources(figure, remainingSources);
  image.src = nextSource;
}

function hydrateIllustrations(root) {
  const images = root?.querySelectorAll?.(".chapter-illustration-image");
  if (!images) {
    return;
  }

  images.forEach((image) => {
    if (!image.complete) {
      return;
    }

    if (image.naturalWidth > 0) {
      markIllustrationLoaded(image);
      return;
    }

    tryLoadIllustrationFallback(image);
  });
}

/**
 * @param {HTMLElement|{ addEventListener?: Function, removeEventListener?: Function, querySelector?: (selector: string) => Element|null }} container
 * @returns {Promise<(() => void)|null>}
 */
export async function bindStoryPage(container) {
  if (!container?.addEventListener || !container?.removeEventListener) {
    return null;
  }

  const onImageLoad = (event) => {
    const target = event?.target;
    if (!target?.classList?.contains("chapter-illustration-image")) {
      return;
    }
    markIllustrationLoaded(target);
  };

  const onImageError = (event) => {
    const target = event?.target;
    if (!target?.classList?.contains("chapter-illustration-image")) {
      return;
    }
    tryLoadIllustrationFallback(target);
  };

  container.addEventListener("load", onImageLoad, true);
  container.addEventListener("error", onImageError, true);
  hydrateIllustrations(container);

  return () => {
    container.removeEventListener("load", onImageLoad, true);
    container.removeEventListener("error", onImageError, true);
  };
}

/**
 * @param {HTMLElement|{ querySelector?: (selector: string) => Element|null }} container
 * @param {StoryPageModel} model
 * @returns {Promise<boolean>}
 */
export async function updateStoryPage(container, model) {
  if (model.error || !model.chapter) {
    return false;
  }

  const storyContainer = container?.querySelector?.(".story-container");
  if (!storyContainer) {
    return false;
  }

  storyContainer.innerHTML = renderStoryChapterBody(
    model.storyId,
    model.chapter,
    model.chapterImagePaths,
  );
  hydrateIllustrations(storyContainer);
  
  // Scroll to top, accounting for header height
  const header = document.querySelector("header");
  const headerHeight = header && !header.classList.contains("header-collapsed") 
    ? header.offsetHeight 
    : 0;
  
  // Use requestAnimationFrame to ensure scroll happens after DOM updates
  requestAnimationFrame(() => {
    window.scrollTo({ top: -headerHeight, behavior: "instant" });
  });
  
  return true;
}

/** @type {PageContract} */
export const storyPage = createPage({
  load: loadStoryPageData,
  render: renderStoryPage,
  update: updateStoryPage,
  bind: bindStoryPage,
});

export const __storyPageTestHooks = {
  clearParsedStoryCache: clearStoryPageDataCache,
  getParsedStoryCacheKeys,
  getParsedStoryCacheSize,
};
