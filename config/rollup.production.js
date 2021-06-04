import svelte from "rollup-plugin-svelte"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import {terser} from "rollup-plugin-terser"
import html from "@rollup/plugin-html"

import appInfo from "./app-info.js"
import template from "./html-template.js"

const branch = process.env.BRANCH || "v0.0.0"
const version = branch.split("/").pop()

export default {
    input: "./src/main.js",
    output: {
        file: `./output/app-${version}.js`,
        format: "iife",
    },
    plugins: [
        svelte(),
        resolve(),
        commonjs(),
        terser(),
        html({
            filename: "./output/index.html",
            title: appInfo.name,
            template,
        })
    ]
}
