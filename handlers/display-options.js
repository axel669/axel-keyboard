const fs = require("fs").promises

const dirs = require("../src/old/dirs.js")

module.exports = async () => {
    return await Promise.all([
        fs.readdir(dirs.keyboards),
        fs.readdir(dirs.themes),
    ])
}
