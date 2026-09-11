import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
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

  it("ships every file the exports map points at", () => {
    // Self-reference resolves against the repo, where every built file exists
    // whether or not "files" would pack it, so the tests above stay green even
    // if an entry point stops being published.
    //
    // --ignore-scripts keeps `prepare` from rebuilding on top of the tree the
    // before hook just built, and keeps its output off the stdout being parsed.
    // npm 11 returns an array of packed packages, npm 12 an object keyed by
    // name. The publish workflow installs the latest npm, so both shapes reach
    // this test depending on which workflow runs it.
    const packOutput = JSON.parse(
      execSync("npm pack --dry-run --json --ignore-scripts", {
        encoding: "utf8",
      }),
    );
    const [packed] = Array.isArray(packOutput)
      ? packOutput
      : Object.values(packOutput);
    const shipped = new Set(packed.files.map((file: { path: string }) => file.path));

    const { exports: exportsMap } = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    );

    // Condition objects nest arbitrarily and arrays are fallback lists, so walk
    // the whole tree rather than assuming the current one-level shape.
    const collect = (node: unknown): string[] => {
      if (node === null) return [];
      if (typeof node === "string") return [node];
      if (Array.isArray(node)) return node.flatMap(collect);
      if (typeof node === "object") return Object.values(node).flatMap(collect);
      throw new Error(`unexpected exports target: ${JSON.stringify(node)}`);
    };

    assert.ok(Object.keys(exportsMap).length > 0, "the exports map is empty");

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (target === null) continue;
      // Subpath patterns expand at resolution time, so there is no one file.
      const files = collect(target).filter((file) => !file.includes("*"));
      assert.ok(files.length > 0, `"${subpath}" resolves to no concrete file`);

      for (const file of files) {
        const path = file.replace(/^\.\//, "");
        assert.ok(
          shipped.has(path),
          `${path} (from "${subpath}") is missing from the tarball`,
        );
      }
    }
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
