// rollup.config.js
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/babel-plugin-transform-vue-jsx.min.js',
    format: 'cjs',
    name: 'babel-plugin-transform-vue-jsx',
  },
  plugins: [
    commonjs(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
}
