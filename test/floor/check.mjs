// Runs against an installed tarball rather than the repo, so it exercises the
// published "exports" map the way a consumer does. Kept free of devDependencies
// so it can run on Node versions too old to build this package.
//
// Every entry point is executed, not just loaded: esbuild targets es2020, so a
// syntax violation would already fail to parse, but a too-new runtime builtin
// reaching the output is only caught by running the code.
import { createRequire } from "node:module";
import { strict as assert } from "node:assert";

const require = createRequire(import.meta.url);

const { createPubSub } = require("create-pubsub");
const [publish, subscribe, get] = createPubSub(0);
subscribe(() => {});
publish(7);
assert.equal(get(), 7, "require() of the main entry point");

const { createImmerPubSub } = require("create-pubsub/immer");
const [publishDraft, subscribeDraft, getDraft] = createImmerPubSub({ count: 0 });
subscribeDraft(() => {});
publishDraft((draft) => {
  draft.count = 5;
});
assert.equal(getDraft().count, 5, "require() of the immer entry point");

// usePubSub passes `get` as the server snapshot, so the hook renders without a
// DOM and can be executed here.
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { usePubSub } = require("create-pubsub/react");
const counter = createPubSub(7);
const Display = () => createElement("div", null, `Count: ${usePubSub(counter)[0]}`);
assert.match(
  renderToStaticMarkup(createElement(Display)),
  /Count: 7/,
  "require() of the react entry point",
);

assert.equal(typeof (await import("create-pubsub")).createPubSub, "function");
assert.equal(typeof (await import("create-pubsub/react")).usePubSub, "function");
assert.equal(
  typeof (await import("create-pubsub/immer")).createImmerPubSub,
  "function",
);

console.log(`require() and import both work on ${process.version}`);
