import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
describe("smoke test - built output", () => {
  before(() => {
    execSync("npm run build", { stdio: "inherit" });
  });

  it("main entry - CJS require", () => {
    const { createPubSub } = require("../../main/index.js");
    const [publish, subscribe, get] = createPubSub(42);
    let received: number | undefined;
    subscribe((data: number) => {
      received = data;
    });
    publish(100);
    assert.equal(received, 100);
    assert.equal(get(), 100);
  });

  it("main entry - ESM import", async () => {
    // @ts-expect-error -- built .mjs has no inline declarations
    const mod = await import("../../main/index.mjs");
    const [publish, subscribe, get] = mod.createPubSub(42);
    let received: number | undefined;
    subscribe((data: number) => {
      received = data;
    });
    publish(100);
    assert.equal(received, 100);
    assert.equal(get(), 100);
  });

  it("react entry - CJS require", () => {
    const { usePubSub } = require("../../react/index.js");
    assert.equal(typeof usePubSub, "function");
  });

  it("react entry - ESM import", async () => {
    // @ts-expect-error -- built .mjs has no inline declarations
    const mod = await import("../../react/index.mjs");
    assert.equal(typeof mod.usePubSub, "function");
  });

  it("immer entry - CJS require", () => {
    const { createImmerPubSub } = require("../../immer/index.js");
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

  it("immer entry - ESM import", async () => {
    // @ts-expect-error -- built .mjs has no inline declarations
    const mod = await import("../../immer/index.mjs");
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
