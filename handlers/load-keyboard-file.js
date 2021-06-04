const path = require("path")
const fs = require("fs").promises

const dirs = require("../dirs.js")

module.exports = async (_, name) => {
    const kbJSON = await fs.readFile(
        path.resolve(dirs.keyboards, name, "settings.json"),
        "utf8"
    )
    return {
        data: JSON.parse(kbJSON),
        css: path.resolve(dirs.keyboards, name, "style.css")
    }
}
