import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

// Resolving by package name goes through the "exports" map, the same way a
// consumer does. A deep path into main/ would bypass it and pass either way.
const require = createRequire(import.meta.url);

// The declaration files are produced by the build this suite runs, so they are
// absent while tsc typechecks this file. A string-typed specifier keeps
// TypeScript from trying to resolve them.
const importPackage = (specifier: string) => import(specifier);

describe("smoke test - built output", () => {
  before(() => {
    execSync("npm run build", { stdio: "inherit" });
  });

  it("main entry - require", () => {
    const { createPubSub } = require("create-pubsub");
    const [publish, subscribe, get] = createPubSub(42);
    let received: number | undefined;
    subscribe((data: number) => {
      received = data;
    });
    publish(100);
    assert.equal(received, 100);
    assert.equal(get(), 100);
  });

  it("main entry - import", async () => {
    const mod = await importPackage("create-pubsub");
    const [publish, subscribe, get] = mod.createPubSub(42);
    let received: number | undefined;
    subscribe((data: number) => {
      received = data;
    });
    publish(100);
    assert.equal(received, 100);
    assert.equal(get(), 100);
  });

  it("react entry - require", () => {
    const { usePubSub } = require("create-pubsub/react");
    assert.equal(typeof usePubSub, "function");
  });

  it("react entry - import", async () => {
    const mod = await importPackage("create-pubsub/react");
    assert.equal(typeof mod.usePubSub, "function");
  });

  it("immer entry - require", () => {
    const { createImmerPubSub } = require("create-pubsub/immer");
    const [publish, subscribe, get] = createImmerPubSub({ count: 0 });
    let received: any;
    subscribe((data: any) => {
      received = data;
    });
    publish((draft: any) => {
      draft.count = 5;
    });
    assert.equal(received.count, 5);
    assert.equal(get().count, 5);
  });

  it("immer entry - import", async () => {
    const mod = await importPackage("create-pubsub/immer");
    const [publish, subscribe, get] = mod.createImmerPubSub({ count: 0 });
    let received: any;
    subscribe((data: any) => {
      received = data;
    });
    publish((draft: any) => {
      draft.count = 5;
    });
    assert.equal(received.count, 5);
    assert.equal(get().count, 5);
  });
});
