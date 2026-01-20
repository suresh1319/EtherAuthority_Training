import { defineConfig } from 'vite'

export default defineConfig({
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
