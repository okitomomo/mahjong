import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './',
  base: '/Mahjong/',
  server: {
    host: true,    // コンテナ外からアクセス可能に
    watch: {
      usePolling: true, // Windowsなどで確実に監視するため
      interval: 1000,
    },
    port: 8080
  }
})