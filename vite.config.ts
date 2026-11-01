import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the built dist/ works under main-server at /tidyup/
  // without being rebuilt for that path. Asset URLs stay relative to the page.
  base: './',
  plugins: [react()],
});
