/**
 * Shared JSDoc type contracts for page lifecycle, routing, and story data.
 *
 * These are documentation-first contracts used to improve readability
 * and editor IntelliSense in this vanilla JS codebase.
 */

/**
 * @typedef {Record<string, string>} RouteParams
 */

/**
 * @typedef {{ chapterNumber: number, text: string }} StoryChoice
 */

/**
 * @typedef {{
 *   title: string,
 *   content: string,
 *   choices?: StoryChoice[],
 *   choicesEndingText?: string,
 * }} StoryChapter
 */

/**
 * @typedef {{
 *   number: string|number,
 *   title: string,
 *   emoji: string,
 *   approxTime: string,
 *   keywords: string[],
 * }} StoryMetadata
 */

/**
 * @typedef {{
 *   load?: (params: RouteParams) => Promise<any>|any,
 *   render: (model: any, params?: RouteParams) => Promise<string>|string,
 *   bind?: (container: HTMLElement|{ innerHTML: string }, model?: any, params?: RouteParams) => Promise<(() => void)|null|undefined>|(() => void)|null|undefined,
 * }} PageContract
 */

/**
 * @typedef {PageContract} RouteHandler
 */

/**
 * @typedef {{
 *   params: RouteParams,
 *   route: string,
 * }} MatchedRoute
 */

/**
 * @typedef {{
 *   navigate: (path: string) => void,
 *   render: (container: HTMLElement|{ innerHTML: string }) => Promise<void>,
 *   getCurrentRoute: () => string,
 * }} RouterApi
 */

/**
 * @typedef {{
 *   status: "empty"|"success"|"error",
 *   message?: string,
 * }} ValidationResult
 */

export const TYPES_READY = true;
