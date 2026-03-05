import test from "node:test";
import assert from "node:assert/strict";

import { createRouter } from "../js/router.js";

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function withDomEnvironment(run) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;

  globalThis.window = {
    location: {
      hash: "",
    },
  };

  globalThis.document = {
    createElement() {
      let value = "";
      return {
        set textContent(next) {
          value = next;
        },
        get innerHTML() {
          return escapeHtml(value);
        },
      };
    },
  };

  try {
    await run();
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
}

test("router executes load -> render -> bind and calls cleanup on route change", async () => {
  await withDomEnvironment(async () => {
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
  });
});

test("router renders error page when route handler has no render function", async () => {
  await withDomEnvironment(async () => {
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
  });
});

test("router renders 404 page for unmatched routes", async () => {
  await withDomEnvironment(async () => {
    const container = { innerHTML: "" };
    const router = createRouter({
      "/": {
        render: async () => "<main>ok</main>",
      },
    });

    window.location.hash = "#/missing";
    await router.render(container);

    assert.match(container.innerHTML, /Page not found/);
  });
});

test("router renders load error page when lifecycle throws", async () => {
  await withDomEnvironment(async () => {
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
  });
});
