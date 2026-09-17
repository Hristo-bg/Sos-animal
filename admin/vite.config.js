import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../public/admin-build',
    emptyOutDir: true,
    assetsDir: '.',
    rollupOptions: {
      output: {
        entryFileNames: 'admin.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: 'admin.[ext]'
      }
    }
  }
});
