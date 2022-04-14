import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { uglify } from 'rollup-plugin-uglify'

const config = {
  input: process.env.entry,
  output: {
    file: process.env.dest,
    format: 'umd',
    name: 'weapptracker',
    strict: false,
  },
  plugins: [
    nodeResolve(), // 解析node模块(rollup默认不支持)
    commonjs({
      // rollup-plugin-node-resolve 插件可以解决 ES6模块的查找导入，但是npm中的大多数包都是以CommonJS模块的形式出现的，
      // 所以需要使用这个插件将CommonJS模块转换为 ES2015 供 Rollup 处理
      include: 'node_modules/**', // 包括
      exclude: [], // 排除
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      plugins: ['transform-class-properties'],
    }),
    process.env.uglify && uglify(),
  ].filter(Boolean),
}

export default config
