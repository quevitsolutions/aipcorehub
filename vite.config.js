import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('ethers') || id.includes('@ethersproject')) {
              return 'ethers';
            }
            if (
              id.includes('@rainbow-me/rainbowkit') ||
              id.includes('wagmi') ||
              id.includes('viem') ||
              id.includes('@tanstack')
            ) {
              return 'web3-vendor';
            }
          }
        }
      },
    },
  },
  server: {
    port: 3000,
    host: true
  }
})
