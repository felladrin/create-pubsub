import { defineConfig } from "rollup";
import { fileURLToPath } from "node:url";
import terser from "@rollup/plugin-terser";
import esbuild from "rollup-plugin-esbuild";

export default defineConfig([
  {
    input: "src/main/index.ts",
    output: [
      {
        file: "main/index.js",
        format: "umd",
        name: "create-pubsub",
      },
      {
        file: "main/index.mjs",
        format: "es",
      },
    ],
    plugins: [esbuild(), terser()],
  },
  {
    input: "src/react/index.ts",
    output: [
      {
        file: "react/index.js",
        format: "umd",
        name: "create-pubsub-react",
        globals: {
          react: "React",
        },
      },
      {
        file: "react/index.mjs",
        format: "es",
      },
    ],
    external: ["react", "../main", "../immer"],
    plugins: [esbuild(), terser()],
  },
  {
    input: "src/immer/index.ts",
    output: [
      {
        file: "immer/index.js",
        format: "umd",
        name: "create-pubsub-immer",
        globals: {
          immer: "immer",
          [fileURLToPath(new URL("src/main", import.meta.url))]:
            "create-pubsub",
        },
      },
      {
        file: "immer/index.mjs",
        format: "es",
      },
    ],
    external: ["immer", "../main"],
    plugins: [esbuild(), terser()],
  },
]);
