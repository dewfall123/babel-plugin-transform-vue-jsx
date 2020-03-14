const t = require('@babel/types')
const buildElementCall = require('./element')

module.exports = {
  exit(path, file) {
    // need inject h
    global.imports.add('h')
    // turn tag into h call
    const callExpr = buildElementCall(path.get('openingElement'), path)
    path.replaceWith(t.inherits(callExpr, path.node))
  },
}
