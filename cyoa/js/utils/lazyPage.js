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
 *   bind: (container: HTMLElement|{ innerHTML: string }, model?: any, params?: Record<string, string>) => Promise<(() => void)|null>
 * }}
 */
export function createLazyPage(moduleLoader, exportName) {
  let pagePromise = null;

  const getPage = async () => {
    if (!pagePromise) {
      pagePromise = moduleLoader().then((module) => {
        const page = module?.[exportName];
        if (!page || typeof page.render !== "function") {
          throw new Error(
            `Lazy page export '${exportName}' must provide a render function`,
          );
        }
        return page;
      });
    }

    return pagePromise;
  };

  return {
    load: async (params) => {
      const page = await getPage();
      if (typeof page.load === "function") {
        return page.load(params);
      }
      return params;
    },
    render: async (model, params) => {
      const page = await getPage();
      return page.render(model, params);
    },
    bind: async (container, model, params) => {
      const page = await getPage();
      if (typeof page.bind === "function") {
        return page.bind(container, model, params);
      }
      return null;
    },
  };
}
