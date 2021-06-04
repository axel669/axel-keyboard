const {app, BrowserWindow, ipcMain, globalShortcut} = require("electron")
const path = require("path")
const iohook = require("iohook")
const fs = require("fs").promises

const documentPath = app.getPath("documents")
const folderName = "axel-keyboard"
const keys = path.resolve(documentPath, folderName, "keys")
const keyboards = path.resolve(documentPath, folderName, "keyboards")
const themes = path.resolve(documentPath, folderName, "themes")

const shutdown = () => {
    iohook.stop()
    app.quit()
}

app.whenReady().then(
    async () => {
        const window = new BrowserWindow({
            width: 480,
            height: 320,
            resizable: false,
            icon: path.resolve(__dirname, "output", "megaman-rounded.png"),
            webPreferences: {
                backgroundThrottling: false,
                contextIsolation: true,
                preload: path.resolve(__dirname, "preload.js"),
            }
        })

        ipcMain.handle(
            "resize-window",
            (_, width, height) => {
                window.setContentSize(width, height)
            }
        )

        window.removeMenu()
        window.loadFile(
            "./output/index.html",
            {
                query: {
                    keys,
                    keyboards,
                    themes,
                }
            }
        )
        window.on(
            "close",
            () => shutdown()
        )
        // window.openDevTools()
        // window.maximize()

        iohook.on(
            "keydown",
            evt => {
                if (window.isDestroyed() === false) {
                    window.webContents.send("keydown", evt)
                }
            }
        )
        iohook.on(
            "keyup",
            evt => {
                if (window.isDestroyed() === false) {
                    window.webContents.send("keyup", evt)
                }
            }
        )
        iohook.start()

        globalShortcut.register(
            "CommandOrControl+Shift+Alt+V",
            () => window.webContents.send("toggle-visible")
        )

        // const second = new BrowserWindow({
        //     width: 200,
        //     height: 200,
        //     frame: false,
        //     alwaysOnTop: true,
        //     transparent: true,
        //     webPreferences: {
        //         contextIsolation: false,
        //         nodeIntegration: true,
        //     }
        // })
        // second.loadFile("./overlay/index.html")
    }
)
