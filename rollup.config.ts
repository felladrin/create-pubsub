import { defineConfig } from "rollup";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default defineConfig([
  {
    input: "src/main.ts",
    output: [
      {
        file: "main/index.js",
        format: "umd",
        name: "create-pubsub",
      },
      {
        file: "main/index.module.js",
        format: "es",
      },
    ],
    plugins: [typescript(), terser()],
  },
  {
    input: "src/main.ts",
    output: {
      file: "main/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
  {
    input: "src/react.ts",
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
        file: "react/index.module.js",
        format: "es",
      },
    ],
    external: ["react"],
    plugins: [typescript(), terser()],
  },
  {
    input: "src/react.ts",
    output: {
      file: "react/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
]);
