import { defineConfig } from "rollup";
import terser from "@rollup/plugin-terser";
import esbuild from "rollup-plugin-esbuild";

export default defineConfig([
  {
    input: "src/main/index.ts",
    output: [{ file: "main/index.js", format: "es" }],
    plugins: [esbuild(), terser()],
  },
  {
    input: "src/react/index.ts",
    output: [{ file: "react/index.js", format: "es" }],
    external: ["react"],
    plugins: [esbuild(), terser()],
  },
  {
    input: "src/immer/index.ts",
    output: [{ file: "immer/index.js", format: "es" }],
    external: ["immer"],
    plugins: [esbuild(), terser()],
  },
]);
