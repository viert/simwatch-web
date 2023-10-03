import svelte from "rollup-plugin-svelte";
import dev from "rollup-plugin-dev";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import css from "rollup-plugin-css-only";
import replace from "@rollup/plugin-replace";
import dotenv from "dotenv";

const production = !process.env.ROLLUP_WATCH;

dotenv.config({ path: production ? ".env" : ".env.development" });

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn(
        "npm",
        ["run", "start", "--", "--dev"],
        {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        }
      );

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

export default {
  input: "src/main.ts",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js",
  },
  plugins: [
    replace({
      "process.env.MAPTILER_KEY": JSON.stringify(process.env.MAPTILER_KEY),
      "process.env.MAPTILER_STYLE": JSON.stringify(process.env.MAPTILER_STYLE),
      "process.env.MAPBOX_ACCESS_TOKEN": JSON.stringify(
        process.env.MAPBOX_ACCESS_TOKEN
      ),
      "process.env.BACKEND_HTTP_BASEURI": JSON.stringify(
        process.env.BACKEND_HTTP_BASEURI
      ),
    }),
    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: "bundle.css" }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production &&
      dev({
        dirs: ["public"],
        spa: "public/index.html",
        host: "127.0.0.1",
        port: 8000,
        proxy: [{ from: "/api", to: "http://127.0.0.1:3000/api" }],
      }),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
