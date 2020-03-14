const handleJsxElement = require('./jsxElement')
const inject = require('./inject')
const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx').default

// these methods need to be imported
global.imports = new Set()

module.exports = () => {
  return {
    inherits: pluginSyntaxJsx,
    visitor: {
      JSXNamespacedName(path) {
        throw path.buildCodeFrameError(
          'Namespaced tags/attributes are not supported. JSX is not XML.\n' +
            'For attributes like xlink:href, use xlinkHref instead.',
        )
      },
      JSXElement: handleJsxElement,
      Program: {
        exit(path) {
          // auto inject h
          inject(path)
        },
      },
    },
  }
}
