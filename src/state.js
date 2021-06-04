import { writable } from "svelte/store"

const kb = writable(null)
const appTheme = writable(null)

export {
    kb,
    appTheme,
}
