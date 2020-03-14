const t = require('@babel/types')
const checkRules = require('./rules')
/**
 * The logic for this is quite terse. It's because we need to
 * support spread elements. We loop over all attributes,
 * breaking on spreads, we then push a new object containing
 * all prior attributes to an array for later processing.
 */

function buildOpeningElementAttributes(attribs, path) {
  let _props = []
  const objs = []

  function pushProps() {
    if (!_props.length) return
    objs.push(t.objectExpression(_props))
    _props = []
  }

  while (attribs.length) {
    const prop = attribs.shift()
    if (t.isJSXSpreadAttribute(prop)) {
      pushProps()
      prop.argument._isSpread = true
      objs.push(prop.argument)
    } else {
      const covertedProp = convertAttribute(prop)
      _props.push(checkRules(covertedProp))
    }
  }

  pushProps()

  if (objs.length <= 1) {
    attribs = objs[0]
  } else {
    // need inject mergeProps
    global.imports.add('mergeProps')
    attribs = t.callExpression(t.identifier('mergeProps'), objs)
  }
  return attribs
}

function convertAttribute(node) {
  const value = convertAttributeValue(node.value || t.booleanLiteral(true))
  if (t.isStringLiteral(value) && !t.isJSXExpressionContainer(node.value)) {
    value.value = value.value.replace(/\n\s+/g, ' ')
  }
  if (t.isValidIdentifier(node.name.name)) {
    node.name.type = 'Identifier'
  } else {
    node.name = t.stringLiteral(node.name.name)
  }
  return t.inherits(t.objectProperty(node.name, value), node)
}

function convertAttributeValue(node) {
  if (t.isJSXExpressionContainer(node)) {
    return node.expression
  } else {
    return node
  }
}

module.exports = buildOpeningElementAttributes
