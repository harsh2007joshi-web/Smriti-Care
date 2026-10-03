import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/2factor': {
        target: 'https://2factor.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/2factor/, ''),
      },
      '/api/fast2sms': {
        target: 'https://www.fast2sms.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fast2sms/, ''),
      },
    },
  },
})

