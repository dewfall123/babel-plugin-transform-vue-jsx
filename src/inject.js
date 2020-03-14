const t = require('@babel/types')
const IMPORT_SOURCE = 'vue'
/**
 * inject these methods need to be imported
 * @param {*} path
 */
const inject = path => {
  if (!global.imports.size) {
    return
  }
  const importNodes = path
    .get('body')
    .filter(p => p.isImportDeclaration())
    .map(p => p.node)
  const vueImportNodes = importNodes.filter(
    p => p.source.value === IMPORT_SOURCE,
  )
  for (const importName of global.imports) {
    const has = vueImportNodes.some(p =>
      p.specifiers.some(
        s =>
          t.isImportSpecifier(s) &&
          s.imported.name === importName &&
          s.local.name === importName,
      ),
    )
    if (!has) {
      const vueImportSpecifier = t.importSpecifier(
        t.identifier(importName),
        t.identifier(importName),
      )
      if (vueImportNodes.length > 0) {
        vueImportNodes[0].specifiers.push(vueImportSpecifier)
      } else {
        path.unshiftContainer(
          'body',
          t.importDeclaration(
            [vueImportSpecifier],
            t.stringLiteral(IMPORT_SOURCE),
          ),
        )
      }
    }
  }
}

module.exports = inject
