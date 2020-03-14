/* eslint-env node, jest */
import { h, mergeProps, withDirectives } from 'vue'

// rules
// - key and ref are reserved
// - class and style have the same API as 2.x
// - props that start with on are handled as v-on bindings, with everything after - on being converted to all-lowercase as the event name (more on this below)
// - for anything else:
//   - If the key exists as a property on the DOM node, it is set as a DOM property;
//   - Otherwise it is set as an attribute.
const noop = _ => _
describe('babel-plugin-transform-vue-jsx', () => {
  it('should contain text', () => {
    const vnode = <div>text</div>
    expect(vnode.type).toEqual('div')
    expect(vnode.children).toMatchObject(['text'])
  })

  it('should bind text', () => {
    const text = 'foo'
    const vnode = <div>{text}</div>
    expect(vnode.type).toEqual('div')
    expect(vnode.children).toMatchObject([text])
  })

  it('should extract props', () => {
    const vnode = <div id="hi" dir="ltr"></div>
    expect(vnode.props.id).toEqual('hi')
    expect(vnode.props.dir).toEqual('ltr')
  })

  it('should bind attr', () => {
    const id = 'foo'
    const vnode = <div id={id}></div>
    expect(vnode.props.id).toEqual('foo')
  })

  it('should omit attribs if possible', () => {
    const vnode = <div>test</div>
    expect(vnode.props).toEqual(null)

    const vnodeByH = h('div', null, ['test'])
    expect(vnode).toEqual(vnodeByH)
  })

  it('should omit children argument if possible', () => {
    const vnode = <div />
    expect(vnode.children).toEqual(null)

    const vnodeByH = h('div')
    expect(vnode).toEqual(vnodeByH)
  })

  it('should handle top-level special props', () => {
    const vnode = (
      <div
        class="foo"
        style="bar"
        key="key"
        ref="ref"
        refInFor
        slot="slot"
      ></div>
    )
    expect(vnode.props.class).toEqual('foo')
    expect(vnode.props.style).toEqual('bar')
    expect(vnode.key).toEqual(vnode.props.key)
    expect(vnode.key).toEqual('key')
    expect(vnode.ref).toEqual(vnode.ref)
    expect(vnode.ref).toEqual('ref')
    expect(vnode.props.refInFor).toBe(true)
    expect(vnode.props.slot).toEqual('slot')

    const vnodeByH = h('div', {
      class: 'foo',
      style: 'bar',
      key: 'key',
      ref: 'ref',
      refInFor: true,
      slot: 'slot',
    })
    expect(vnode).toEqual(vnodeByH)
  })

  it('should handle nested properties', () => {
    const vnode = (
      <div
        on-success={noop}
        on-click={noop}
        on-kebab-case={noop}
        innerHTML="<p>hi</p>"
        insert={noop}
      ></div>
    )
    expect(vnode.props['on-success']).toEqual(noop)
    expect(vnode.props['on-click']).toBe(noop)
    expect(vnode.props['on-kebab-case']).toEqual(noop)
    expect(vnode.props.innerHTML).toEqual('<p>hi</p>')
    expect(vnode.props.insert).toEqual(noop)

    const vnodeByH = h('div', {
      'on-success': noop,
      'on-click': noop,
      'on-kebab-case': noop,
      innerHTML: '<p>hi</p>',
      insert: noop,
    })
    expect(vnode).toEqual(vnodeByH)
  })

  it('should handle nested properties (camelCase)', () => {
    const vnode = (
      <div
        onSuccess={noop}
        onClick={noop}
        onCamelCase={noop}
        innerHTML="<p>hi</p>"
        insert={noop}
      ></div>
    )
    expect(vnode.props.onSuccess).toEqual(noop)
    expect(vnode.props.onClick).toEqual(noop)
    expect(vnode.props.onCamelCase).toEqual(noop)
    expect(vnode.props.innerHTML).toEqual('<p>hi</p>')
    expect(vnode.props.insert).toEqual(noop)

    const vnodeByH = h('div', {
      onSuccess: noop,
      onClick: noop,
      onCamelCase: noop,
      innerHTML: '<p>hi</p>',
      insert: noop,
    })
    expect(vnode).toEqual(vnodeByH)
  })

  it('should support data attributes', () => {
    const vnode = <div data-id="1"></div>
    expect(vnode.props['data-id']).toEqual('1')

    const vnodeByH = h('div', {
      'data-id': '1',
    })
    expect(vnode).toEqual(vnodeByH)
  })

  it('should handle identifier type name as components', () => {
    const TextCom = {
      props: {
        text: String,
      },
      setup(props) {
        return () => <span>{props.text}</span>
      },
    }
    const vnode = <TextCom text="a"></TextCom>
    const vnodeByH = h(TextCom, { text: 'a' })
    expect(vnode).toEqual(vnodeByH)
  })

  it('spread (single object expression)', () => {
    const props = {
      innerHTML: 2,
    }
    const vnode = <div {...props} />
    expect(vnode.props.innerHTML).toEqual(2)

    const vnodeByH = h('div', {
      ...props,
    })
    expect(vnode).toEqual(vnodeByH)
  })

  it('spread (mixed)', () => {
    const data = {
      id: 'hehe',
      onclick: noop,
      innerHTML: 2,
      insert: noop,
      class: ['a', 'b'],
    }
    const vnode = (
      <div
        href="huhu"
        class={{ c: true }}
        on-click={noop}
        insert={noop}
        {...data}
      />
    )

    expect(vnode.props.id).toEqual('hehe')
    expect(vnode.props.href).toEqual('huhu')
    expect(vnode.props.innerHTML).toBe(2)
    expect(vnode.props.class).toEqual('c a b')

    const vnodeByH = h(
      'div',
      mergeProps(
        {
          href: 'huhu',
          class: { c: true },
          'on-click': noop,
          insert: noop,
        },
        data,
      ),
    )
    expect(vnode).toEqual(vnodeByH)
  })

  it('xlink:href', () => {
    const vnode = <use xlinkHref={'#name'}></use>
    const vnodeByH = h('use', {
      'xlink:href': '#name',
    })

    expect(vnode).toEqual(vnodeByH)
    expect(vnode.props['xlink:href']).toEqual('#name')
  })

  test.todo('with directives')

  it('merge class', () => {
    const vnode = <div class="a" {...{ class: 'b' }} />
    expect(vnode.props.class).toEqual('a b')

    const vnodeByH = h(
      'div',
      mergeProps(
        {
          class: 'a',
        },
        { class: 'b' },
      ),
    )
    expect(vnode).toEqual(vnodeByH)
  })
})
