import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
plugins: [react()],
server: {
port: 5173,
proxy: {
// APIs and auth endpoints handled by Express @ 3000
'/login': { target: 'http://localhost:3000', changeOrigin: true },
'/logout': { target: 'http://localhost:3000', changeOrigin: true },
'/select-car': { target: 'http://localhost:3000', changeOrigin: true },
'/api': { target: 'http://localhost:3000', changeOrigin: true },
},
},
})