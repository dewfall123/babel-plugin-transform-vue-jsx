const REG = /^v-(.*)$/

function isDir(name) {
  return REG.test(name)
}

function getDirName(name) {
  return name.match(REG)[1]
}

module.exports = {
  isDir,
  getDirName,
}
