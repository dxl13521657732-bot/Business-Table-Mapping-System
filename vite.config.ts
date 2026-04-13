import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_ACTIONS ? '/Business-Table-Mapping-System/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ant-design': ['ant-design-vue', '@ant-design/icons-vue'],
          'xlsx': ['xlsx'],
          'vue-core': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
