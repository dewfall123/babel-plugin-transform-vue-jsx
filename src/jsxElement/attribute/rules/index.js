const { isXlink, handleXlink } = require('./xlink')

function checkRules(prop) {
  const name = prop.key.value || prop.key.name
  if (isXlink(name)) {
    handleXlink(prop)
  }
  return prop
}

module.exports = checkRules
