import { normalizePageContract } from "./pageContract.js";

/**
 * Creates a lazy-loaded page contract wrapper.
 *
 * The module is loaded once and cached; calls then delegate to
 * `load`, `render`, and optional `bind` on the resolved page contract.
 *
 * @param {() => Promise<Record<string, any>>} moduleLoader
 * @param {string} exportName
 * @returns {{
 *   load: (params: Record<string, string>) => Promise<any>,
 *   render: (model: any, params?: Record<string, string>) => Promise<string>,
 *   update: (container: HTMLElement|{ innerHTML: string }, model: any, params?: Record<string, string>, previous?: { model?: any, params?: Record<string, string>, route?: string }) => Promise<boolean>,
 *   bind: (container: HTMLElement|{ innerHTML: string }, model?: any, params?: Record<string, string>) => Promise<(() => void)|null>
 * }}
 */
export function createLazyPage(moduleLoader, exportName) {
  let pagePromise = null;

  const getPage = async () => {
    if (!pagePromise) {
      pagePromise = moduleLoader().then((module) => {
        const page = module?.[exportName];
        try {
          return normalizePageContract(page);
        } catch {
          throw new Error(
            `Lazy page export '${exportName}' must provide a render function`,
          );
        }
      });
    }

    return pagePromise;
  };

  return {
    load: async (params) => {
      const page = await getPage();
      return page.load(params);
    },
    render: async (model, params) => {
      const page = await getPage();
      return page.render(model, params);
    },
    update: async (container, model, params, previous) => {
      const page = await getPage();
      if (typeof page.update === "function") {
        return page.update(container, model, params, previous);
      }
      return false;
    },
    bind: async (container, model, params) => {
      const page = await getPage();
      return page.bind(container, model, params);
    },
  };
}
