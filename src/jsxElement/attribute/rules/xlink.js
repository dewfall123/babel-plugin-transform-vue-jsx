const REG = /^xlink([A-Z])/

function isXlink(name) {
  return REG.test(name)
}

function handleXlink(prop) {
  prop.key.name = prop.key.name.replace(REG, function(m, p1) {
    // eslint-disable-next-line prettier/prettier
    return `xlink:${p1.toLowerCase()}`
  })
}

module.exports = {
  isXlink,
  handleXlink,
}
