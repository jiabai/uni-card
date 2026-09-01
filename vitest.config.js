import { defineConfig } from 'vitest/config'

// 独立于 vite.config.js：不加载 uni 插件，测试走纯 Node 环境
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
})
