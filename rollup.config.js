import path from "path";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import alias from "@rollup/plugin-alias";

export default {
  input: {
    index: "src/index.ts",
  },

  output: [
    {
      dir: "./dist",
      format: "cjs",
      entryFileNames: "[name].cjs.js",
      preserveModules: true,
    },
    {
      dir: "./dist",
      format: "esm",
      entryFileNames: "[name].esm.js",
      preserveModules: true,
    },
  ],
  plugins: [
    alias({
      entries: [{ find: "~/", replacement: path.resolve(__dirname, "./src/") }],
    }),
    json(),
    typescript(),
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      presets: ["@babel/preset-env"],
    }),
  ],
};
