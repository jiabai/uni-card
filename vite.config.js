import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [
    uni(),
  ],
  resolve: {
    alias: {
      // pako 源码含 C 风格 #ifdef 注释，会被 uni-app 条件编译插件误解析；
      // 使用已压缩产物（无此类注释）规避该警告。
      'pako': path.resolve(__dirname, 'node_modules/pako/dist/pako.min.js'),
    },
  },
})
