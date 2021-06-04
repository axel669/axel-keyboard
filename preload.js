const {ipcRenderer, contextBridge} = require("electron")
const path = require("path")
const fs = require("fs").promises

const dispatchKeys = (source) => {
    const evt = new CustomEvent(
        `${source.type}-global`,
        {detail: source}
    )
    window.dispatchEvent(evt)
}
ipcRenderer.on(
    "keydown",
    (_, evt) => dispatchKeys(evt)
)
ipcRenderer.on(
    "keyup",
    (_, evt) => dispatchKeys(evt)
)
ipcRenderer.on(
    "toggle-visible",
    () => window.dispatchEvent(
        new CustomEvent("toggle-visible")
    )
)

const urlInfo = new URL(location)
const args = Object.fromEntries(
    Array.from(
        urlInfo.searchParams.keys(),
        (key) => {
            const list = urlInfo.searchParams.getAll(key)
            const value = (list.length === 1) ? list[0] : list
            return [key, value]
        }
    )
)
const dirs = {
    keys: args.keys,
    keyboards: args.keyboards,
    themes: args.themes,
}

contextBridge.exposeInMainWorld(
    "bridge",
    {
        resolve: (...args) => path.resolve(...args),
        loadDisplayOptions: async () => {
            return await Promise.all([
                fs.readdir(dirs.keyboards),
                fs.readdir(dirs.themes),
            ])
        },
        loadKeyboardFile: async (name) => {
            const kbJSON = await fs.readFile(
                path.resolve(dirs.keyboards, name, "settings.json"),
                "utf8"
            )
            return {
                data: JSON.parse(kbJSON),
                css: path.resolve(dirs.keyboards, name, "style.css")
            }
        },
        loadKeyFile: async (name) => {
            const keyJSON = await fs.readFile(
                path.resolve(dirs.keys, `${name}.json`),
                "utf8"
            )
            return JSON.parse(keyJSON)
        },
        resizeWindow: async (width, height) => {
            ipcRenderer.invoke("resize-window", width, height)
        }
    }
)
contextBridge.exposeInMainWorld("args", args)
contextBridge.exposeInMainWorld("dirs", dirs)
