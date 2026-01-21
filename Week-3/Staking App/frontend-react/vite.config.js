import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        target: 'es2015',
        minify: 'terser',
        cssMinify: true
    },
    server: {
        port: 5173,
        strictPort: false
    },
    esbuild: {
        target: 'es2015'
    }
})
