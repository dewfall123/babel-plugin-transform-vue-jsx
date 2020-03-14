import { createApp, ref, h, withDirectives } from 'vue'

const testdir = {
  mounted(_, binding) {
    console.log('directive mounted:')
    console.log(binding)
  },
  updated(_, binding) {
    console.log('directive updated:')
    console.log(binding)
  },
}

const CustomComponent = {
  props: {
    text: String,
  },
  setup(props) {
    return () =>
      withDirectives(
        h('div', {
          text: props.text,
        }),
        [[testdir, 111]],
      )
  },
}

createApp({
  components: {
    CustomComponent,
  },
  directives: {
    testdir,
  },
  setup() {
    const data = {
      id: 'hehe',
      onClick() {
        console.log('click')
      },
      onclick() {
        console.log('click1')
      },
      innerHTML: 'hihihi',
    }
    const createFn = x => () => console.log(x)
    const msg = 'msg'
    const input = ref('input value')
    const setInput = e => {
      input.value = e.target.value
    }

    return () => (
      <div id="hi" dir="ltr">
        <CustomComponent text="this is a component!"></CustomComponent>
        <span
          class={{ a: true, b: true }}
          style={{ fontSize: '15px' }}
          innerHTML={123}
          on-success={createFn('success')}
          on-click={createFn('click')}
          on-kebab-case={createFn('kebab-case')}
          innerHTML="<p>hi</p>"
          onVnodeMounted={createFn('onVnodeMounted')}
          // xlinkHref={'#name'}
          {...data}
          v-testdir={111}
        >
          {msg}
        </span>
        <br />
        <input value={input.value} onInput={setInput} />
        <p v-testdir={input.value}>{input.value}</p>
      </div>
    )
  },
}).mount('#app')
