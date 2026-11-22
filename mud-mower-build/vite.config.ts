import { defineConfig } from 'vite';
// Relative base so dist/ works on GitHub Pages, Netlify, or a sub-folder.
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 1500 } });
