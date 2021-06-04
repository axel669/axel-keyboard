const fs = require("fs").promises
const path = require("path")

const dirs = require("../dirs.js")

module.exports = async (_, name) => {
    const keyJSON = await fs.readFile(
        path.resolve(dirs.keys, `${name}.json`),
        "utf8"
    )
    return JSON.parse(keyJSON)
}
