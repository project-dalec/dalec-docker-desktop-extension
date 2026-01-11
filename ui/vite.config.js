import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use relative base so assets resolve inside Docker Desktop extension iframe context
  base: './',
  build: {
    outDir: 'dist'
  }
});
