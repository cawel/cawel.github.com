import test from "node:test";
import assert from "node:assert/strict";

import { createLazyPage } from "../js/utils/lazyPage.js";

test("lazy: createLazyPage caches module load and delegates lifecycle", async () => {
  let loadCount = 0;
  const calls = [];

  const lazyPage = createLazyPage(async () => {
    loadCount += 1;
    return {
      demoPage: {
        load: async (params) => {
          calls.push(["load", params]);
          return { id: params.storyId };
        },
        render: async (model, params) => {
          calls.push(["render", model, params]);
          return `<main>${model.id}</main>`;
        },
        bind: async (container) => {
          calls.push(["bind", container]);
          return () => calls.push(["cleanup"]);
        },
      },
    };
  }, "demoPage");

  const params = { storyId: "42" };
  const model = await lazyPage.load(params);
  const html = await lazyPage.render(model, params);
  const cleanup = await lazyPage.bind({ innerHTML: html }, model, params);

  assert.equal(loadCount, 1);
  assert.equal(html, "<main>42</main>");
  assert.equal(typeof cleanup, "function");
  assert.equal(calls[0][0], "load");
  assert.equal(calls[1][0], "render");
  assert.equal(calls[2][0], "bind");

  await lazyPage.render(model, params);
  assert.equal(loadCount, 1);
});

test("lazy: createLazyPage falls back when optional load/bind are missing", async () => {
  const lazyPage = createLazyPage(async () => ({
    simplePage: {
      render: async (model) => `<main>${model.storyId}</main>`,
    },
  }), "simplePage");

  const params = { storyId: "7" };
  const model = await lazyPage.load(params);
  const html = await lazyPage.render(model, params);
  const cleanup = await lazyPage.bind({ innerHTML: html }, model, params);

  assert.deepEqual(model, params);
  assert.equal(html, "<main>7</main>");
  assert.equal(cleanup, null);
});

test("lazy: createLazyPage throws when export has no render", async () => {
  const lazyPage = createLazyPage(async () => ({ broken: {} }), "broken");

  await assert.rejects(
    () => lazyPage.render({}, {}),
    /must provide a render function/,
  );
});
