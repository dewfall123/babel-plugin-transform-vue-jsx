/* eslint-env node, mocha */
import { expect } from 'chai'
import { h, render } from 'vue'
import { nodeOps, resetOps, dumpOps } from '@vue/runtime-test'
const jsdom = require('mocha-jsdom')

function _render(jsxFn) {
  const App = {
    render() {
      return jsxFn
    },
  }
  const root = nodeOps.createElement('div')

  resetOps()
  render(h(App), root)
  const ops = dumpOps()
  return ops
}

describe('babel-plugin-transform-vue-jsx', () => {
  jsdom()
  console.log(document)

  it('should contain text', () => {
    const vnode = _render(() => <div>test</div>)
    console.log(vnode)
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('test')
  })

  it('should bind text', () => {
    const text = 'foo'
    const vnode = _render(() => <div>{text}</div>)
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('foo')
  })

  it('should extract attrs', () => {
    const vnode = _render(() => <div id="hi" dir="ltr"></div>)
    expect(vnode.data.id).toEqual('hi')
    expect(vnode.data.dir).toEqual('ltr')
  })

  it('should bind attr', () => {
    const id = 'foo'
    const vnode = _render(() => <div id={id}></div>)
    expect(vnode.data.attrs.id).toEqual('foo')
  })

  it('should omit attribs if possible', () => {
    const vnode = _render(() => <div>test</div>)
    expect(vnode.data).toEqual(undefined)
  })

  it('should omit children argument if possible', () => {
    const vnode = _render(() => <div />)
    const children = vnode.children
    expect(children).toEqual(undefined)
  })

  it('should handle top-level special attrs', () => {
    const vnode = _render(() => (
      <div
        class="foo"
        style="bar"
        key="key"
        ref="ref"
        refInFor
        slot="slot"
      ></div>
    ))
    expect(vnode.data.class).toEqual('foo')
    expect(vnode.data.style).toEqual('bar')
    expect(vnode.data.key).toEqual('key')
    expect(vnode.data.ref).toEqual('ref')
    expect(vnode.data.refInFor).to.be.true
    expect(vnode.data.slot).toEqual('slot')
  })

  it('should handle nested properties', () => {
    const noop = _ => _
    const vnode = _render(() => (
      <div
        props-on-success={noop}
        on-click={noop}
        on-kebab-case={noop}
        domProps-innerHTML="<p>hi</p>"
        hook-insert={noop}
      ></div>
    ))
    expect(vnode.data.props['on-success']).toEqual(noop)
    expect(vnode.data.on.click).toEqual(noop)
    expect(vnode.data.on['kebab-case']).toEqual(noop)
    expect(vnode.data.domProps.innerHTML).toEqual('<p>hi</p>')
    expect(vnode.data.hook.insert).toEqual(noop)
  })

  it('should handle nested properties (camelCase)', () => {
    const noop = _ => _
    const vnode = _render(() => (
      <div
        propsOnSuccess={noop}
        onClick={noop}
        onCamelCase={noop}
        domPropsInnerHTML="<p>hi</p>"
        hookInsert={noop}
      ></div>
    ))
    expect(vnode.data.props.onSuccess).toEqual(noop)
    expect(vnode.data.on.click).toEqual(noop)
    expect(vnode.data.on.camelCase).toEqual(noop)
    expect(vnode.data.domProps.innerHTML).toEqual('<p>hi</p>')
    expect(vnode.data.hook.insert).toEqual(noop)
  })

  it('should support data attributes', () => {
    const vnode = _render(() => <div data-id="1"></div>)
    expect(vnode.data.attrs['data-id']).toEqual('1')
  })

  it('should handle identifier type name as components', () => {
    const Test = {}
    const vnode = _render(() => <Test />)
    expect(vnode.type).to.contain('vue-component')
  })

  it('should work for components with children', () => {
    const Test = {}
    const vnode = _render(() => (
      <Test>
        <div>hi</div>
      </Test>
    ))
    const children = vnode.componentOptions.children
    expect(children[0].type).toEqual('div')
  })

  it('should bind things in thunk with correct this context', () => {
    const Test = {
      _render(h) {
        return <div>{this.$slots.default}</div>
      },
    }
    const context = { test: 'foo' }
    const vnode = _render(
      function(h) {
        return <Test>{this.test}</Test>
      }.bind(context),
    )
    const vm = createComponentInstanceForVnode(vnode)
    const childVnode = vm._render()
    expect(childVnode.type).toEqual('div')
    expect(childVnode.children[0].text).toEqual('foo')
  })

  it('spread (single object expression)', () => {
    const props = {
      innerHTML: 2,
    }
    const vnode = _render(() => <div {...{ props }} />)
    expect(vnode.data.props.innerHTML).toEqual(2)
  })

  it('spread (mixed)', () => {
    const calls = []
    const data = {
      attrs: {
        id: 'hehe',
      },
      on: {
        click: function() {
          calls.push(1)
        },
      },
      props: {
        innerHTML: 2,
      },
      hook: {
        insert: function() {
          calls.push(3)
        },
      },
      class: ['a', 'b'],
    }
    const vnode = _render(() => (
      <div
        href="huhu"
        {...data}
        class={{ c: true }}
        on-click={() => calls.push(2)}
        hook-insert={() => calls.push(4)}
      />
    ))

    expect(vnode.data.attrs.id).toEqual('hehe')
    expect(vnode.data.attrs.href).toEqual('huhu')
    expect(vnode.data.props.innerHTML).toEqual(2)
    expect(vnode.data.class).to.deep.equal(['a', 'b', { c: true }])
    // merge handlers properly for on
    vnode.data.on.click()
    expect(calls).to.deep.equal([1, 2])
    // merge hooks properly
    vnode.data.hook.insert()
    expect(calls).to.deep.equal([1, 2, 3, 4])
  })

  it('custom directives', () => {
    const vnode = _render(() => <div v-test={123} v-other={234} />)

    expect(vnode.data.directives.length).toEqual(2)
    expect(vnode.data.directives[0]).to.deep.equal({ name: 'test', value: 123 })
    expect(vnode.data.directives[1]).to.deep.equal({
      name: 'other',
      value: 234,
    })
  })

  it('xlink:href', () => {
    const vnode = _render(() => <use xlinkHref={'#name'}></use>)

    expect(vnode.data.attrs['xlink:href']).toEqual('#name')
  })

  it('merge class', () => {
    const vnode = _render(() => <div class="a" {...{ class: 'b' }} />)

    expect(vnode.data.class).to.deep.equal({ a: true, b: true })
  })

  it('h injection in object methods', () => {
    const obj = {
      method() {
        return <div>test</div>
      },
    }
    const vnode = _render(() => obj.method.call({ $createElement: h }))
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('test')
  })

  it('h should not be injected in nested JSX expressions', () => {
    const obj = {
      method() {
        return (
          <div
            foo={{
              _render() {
                return <div>bar</div>
              },
            }}
          >
            test
          </div>
        )
      },
    }
    const vnode = _render(() => obj.method.call({ $createElement: h }))
    expect(vnode.type).toEqual('div')
    const nested = vnode.data.attrs.foo._render()
    expect(nested.type).toEqual('div')
    expect(nested.children[0].text).toEqual('bar')
  })

  it('h injection in object getters', () => {
    const obj = {
      get computed() {
        return <div>test</div>
      },
    }
    const vnode = _render(() => {
      obj.$createElement = h
      return obj.computed
    })
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('test')
  })

  it('h injection in multi-level object getters', () => {
    const obj = {
      inherited: {
        get computed() {
          return <div>test</div>
        },
      },
    }
    const vnode = _render(() => {
      obj.inherited.$createElement = h
      return obj.inherited.computed
    })
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('test')
  })

  it('h injection in class methods', () => {
    class Test {
      constructor(h) {
        this.$createElement = h
      }
      _render() {
        return <div>test</div>
      }
    }
    const vnode = _render(() => new Test(h)._render(h))
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('test')
  })

  it('h injection in class getters', () => {
    class Test {
      constructor(h) {
        this.$createElement = h
      }
      get computed() {
        return <div>test</div>
      }
    }
    const vnode = _render(() => new Test(h).computed)
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('test')
  })

  it('h injection in methods with parameters', () => {
    class Test {
      constructor(h) {
        this.$createElement = h
      }
      notRender(notH) {
        return <div>{notH}</div>
      }
    }
    const vnode = _render(() => new Test(h).notRender('test'))
    expect(vnode.type).toEqual('div')
    expect(vnode.children[0].text).toEqual('test')
  })

  it('should handle special attrs properties', () => {
    const vnode = _render(() => <input value="value" />)
    expect(vnode.data.attrs.value).toEqual('value')
  })

  it('should handle special domProps properties', () => {
    const vnode = _render(() => <input value={'some jsx expression'} />)
    expect(vnode.data.domProps.value).toEqual('some jsx expression')
  })
})

function createComponentInstanceForVnode(vnode) {
  const opts = vnode.componentOptions
  return new opts.Ctor({
    _isComponent: true,
    parent: opts.parent,
    propsData: opts.propsData,
    _componenttype: opts.type,
    _parentVnode: vnode,
    _parentListeners: opts.listeners,
    _renderChildren: opts.children,
  })
}
