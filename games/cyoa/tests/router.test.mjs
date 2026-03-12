import test from "node:test";
import assert from "node:assert/strict";

import { createRouter } from "../js/router.js";
import { withDomEnvironment } from "./testHelpers.mjs";

test("router: executes load -> render -> bind and calls cleanup on route change", async () => {
  await withDomEnvironment(
    async () => {
      const calls = [];
      let cleanupCount = 0;
      const container = { innerHTML: "" };

      const router = createRouter({
        "/": {
          load: async () => ({ page: "home" }),
          render: async (model) => `<main>${model.page}</main>`,
          bind: async () => {
            calls.push("bind-home");
            return () => {
              cleanupCount += 1;
            };
          },
        },
        "/story/:storyId": {
          load: async (params) => {
            calls.push(`load-${params.storyId}`);
            return { id: params.storyId };
          },
          render: async (model) => {
            calls.push(`render-${model.id}`);
            return `<main>story-${model.id}</main>`;
          },
          bind: async () => {
            calls.push("bind-story");
            return () => {
              cleanupCount += 1;
            };
          },
        },
      });

      window.location.hash = "#/story/42";
      await router.render(container);

      assert.equal(container.innerHTML, "<main>story-42</main>");
      assert.deepEqual(calls, ["load-42", "render-42", "bind-story"]);
      assert.equal(cleanupCount, 0);

      window.location.hash = "#/";
      await router.render(container);

      assert.equal(container.innerHTML, "<main>home</main>");
      assert.equal(cleanupCount, 1);
    },
    { includeWindow: true },
  );
});

test("router: renders error page when route handler has no render function", async () => {
  await withDomEnvironment(
    async () => {
      const container = { innerHTML: "" };
      const router = createRouter({
        "/broken": {
          load: async () => ({ ok: true }),
        },
      });

      window.location.hash = "#/broken";
      await router.render(container);
      assert.match(container.innerHTML, /Error rendering page/);
      assert.match(
        container.innerHTML,
        /lifecycle object with a render function/,
      );
    },
    { includeWindow: true },
  );
});

test("router: renders 404 page for unmatched routes", async () => {
  await withDomEnvironment(
    async () => {
      const container = { innerHTML: "" };
      const router = createRouter({
        "/": {
          render: async () => "<main>ok</main>",
        },
      });

      window.location.hash = "#/missing";
      await router.render(container);

      assert.match(container.innerHTML, /Page not found/);
    },
    { includeWindow: true },
  );
});

test("router: renders load error page when lifecycle throws", async () => {
  await withDomEnvironment(
    async () => {
      const container = { innerHTML: "" };
      const router = createRouter({
        "/boom": {
          load: async () => {
            throw new Error("boom");
          },
          render: async () => "<main>never</main>",
        },
      });

      window.location.hash = "#/boom";
      await router.render(container);

      assert.match(container.innerHTML, /Error rendering page/);
      assert.match(container.innerHTML, /boom/);
    },
    { includeWindow: true },
  );
});

test("router: uses update hook for same route transitions", async () => {
  await withDomEnvironment(
    async () => {
      let renderCount = 0;
      let bindCount = 0;
      let updateCount = 0;

      const container = { innerHTML: "" };
      const storyContainer = {
        _html: "",
        set innerHTML(value) {
          this._html = String(value);
          container.innerHTML = `<main><div class="story-container">${this._html}</div></main>`;
        },
        get innerHTML() {
          return this._html;
        },
      };
      container.querySelector = (selector) => {
        if (selector === ".story-container") {
          return storyContainer;
        }
        return null;
      };

      const router = createRouter({
        "/story/:storyId/:chapterId": {
          load: async (params) => ({
            title: `Story ${params.storyId}`,
            chapter: params.chapterId,
          }),
          render: async (model) => {
            renderCount += 1;
            return `<main><div class="story-container"><h2>${model.title}</h2><p>${model.chapter}</p></div></main>`;
          },
          update: async (root, model) => {
            updateCount += 1;
            const storyContainer = root.querySelector(".story-container");
            if (!storyContainer) {
              return false;
            }
            storyContainer.innerHTML = `<h2>${model.title}</h2><p>${model.chapter}</p>`;
            return true;
          },
          bind: async () => {
            bindCount += 1;
            return null;
          },
        },
      });

      window.location.hash = "#/story/9/1";
      await router.render(container);

      window.location.hash = "#/story/9/2";
      await router.render(container);

      assert.equal(renderCount, 1);
      assert.equal(bindCount, 1);
      assert.equal(updateCount, 1);
      assert.match(container.innerHTML, /<p>2<\/p>/);
    },
    { includeWindow: true },
  );
});

test("router: falls back to render when update hook returns false", async () => {
  await withDomEnvironment(
    async () => {
      let renderCount = 0;
      let bindCount = 0;
      let updateCount = 0;

      const container = {
        innerHTML: "",
        querySelector() {
          return null;
        },
      };

      const router = createRouter({
        "/story/:storyId/:chapterId": {
          load: async (params) => ({
            title: `Story ${params.storyId}`,
            chapter: params.chapterId,
          }),
          render: async (model) => {
            renderCount += 1;
            return `<main><h2>${model.title}</h2><p>${model.chapter}</p></main>`;
          },
          update: async () => {
            updateCount += 1;
            return false;
          },
          bind: async () => {
            bindCount += 1;
            return null;
          },
        },
      });

      window.location.hash = "#/story/9/1";
      await router.render(container);

      window.location.hash = "#/story/9/2";
      await router.render(container);

      assert.equal(updateCount, 1);
      assert.equal(renderCount, 2);
      assert.equal(bindCount, 2);
      assert.match(container.innerHTML, /<p>2<\/p>/);
    },
    { includeWindow: true },
  );
});
