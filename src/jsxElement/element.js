const t = require('@babel/types')
const esutils = require('esutils')
const buildOpeningElementAttributes = require('./attribute')
const { isDir, getDirName } = require('./attribute/rules/directives')

function buildElementCall(path, jsxPath) {
  path.parent.children = t.react.buildChildren(path.parent)
  const tagExpr = convertJSXIdentifier(path.node.name, path.node)
  const args = []

  let tagName
  if (t.isIdentifier(tagExpr)) {
    tagName = tagExpr.name
  } else if (t.isLiteral(tagExpr)) {
    tagName = tagExpr.value
  }

  if (t.react.isCompatTag(tagName)) {
    args.push(t.stringLiteral(tagName))
  } else {
    args.push(tagExpr)
  }

  let attribs = path.node.attributes
  const dirs = findDirectives(attribs)
  if (attribs.length) {
    attribs = buildOpeningElementAttributes(attribs, path)
    args.push(attribs)
  }

  const hExpr = t.callExpression(t.identifier('h'), args)
  if (jsxPath.node.children.length) {
    hExpr.arguments.push(t.arrayExpression(jsxPath.node.children))
    if (hExpr.arguments.length >= 3) {
      hExpr._prettyCall = true
    }
  }

  if (dirs.length) {
    // inject
    global.imports.add('withDirectives')
    global.imports.add('resolveDirective')

    // eg: withDirectives(h('p', props.text), [[resolveDirective('testdir')]])
    const withDirectivesArgs = dirs.map(dir => {
      const resolveDirectiveCallExpr = t.callExpression(
        t.identifier('resolveDirective'),
        [t.stringLiteral(dir.name)],
      )
      // directive value argument modifiers
      return t.arrayExpression([resolveDirectiveCallExpr, dir.value])
    })
    const argsExpr = t.arrayExpression(withDirectivesArgs)
    return t.callExpression(t.identifier('withDirectives'), [hExpr, argsExpr])
  }
  return hExpr
}

function convertJSXIdentifier(node, parent) {
  if (t.isJSXIdentifier(node)) {
    if (node.name === 'this' && t.isReferenced(node, parent)) {
      return t.thisExpression()
    } else if (esutils.keyword.isIdentifierNameES6(node.name)) {
      node.type = 'Identifier'
    } else {
      return t.stringLiteral(node.name)
    }
  } else if (t.isJSXMemberExpression(node)) {
    return t.memberExpression(
      convertJSXIdentifier(node.object, node),
      convertJSXIdentifier(node.property, node),
    )
  }
  return node
}

function findDirectives(attribs) {
  const dirs = []
  for (let i = 0; i < attribs.length; i++) {
    // TODO problem: spread attribute and directive exit at the same time
    if (t.isJSXSpreadAttribute(attribs[i])) {
      continue
    }
    const name = attribs[i].name.name
    if (isDir(name)) {
      dirs.push({
        index: i,
        name: getDirName(name),
        value: attribs[i].value.expression,
      })
    }
  }
  dirs.forEach(dir => {
    attribs.splice(dir.index, 1)
  })
  return dirs
}

module.exports = buildElementCall
