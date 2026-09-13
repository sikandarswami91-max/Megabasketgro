import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        // Force a SINGLE copy of React across the root app and the nested
        // frontend/ folder. Without this, files inside frontend/src resolve
        // react/react-router-dom from frontend/node_modules while the root
        // src/ entry uses root node_modules -> two React instances ->
        // "Invalid hook call" errors (hooks see a different React than the
        // renderer). Regex aliases also cover subpath imports such as
        // react/jsx-runtime used by the automatic JSX transform.
        {
          find: /^react$/,
          replacement: path.resolve(__dirname, 'node_modules/react'),
        },
        {
          find: /^react\/(.*)$/,
          replacement: path.resolve(__dirname, 'node_modules/react') + '/$1',
        },
        {
          find: /^react-dom$/,
          replacement: path.resolve(__dirname, 'node_modules/react-dom'),
        },
        {
          find: /^react-dom\/(.*)$/,
          replacement: path.resolve(__dirname, 'node_modules/react-dom') + '/$1',
        },
        // NOTE: no subpath aliases for react-router — "react-router/dom" is
        // resolved via the package "exports" map, not a real file path.
        {
          find: /^react-router$/,
          replacement: path.resolve(__dirname, 'node_modules/react-router'),
        },
        {
          find: /^react-router-dom$/,
          replacement: path.resolve(__dirname, 'node_modules/react-router-dom'),
        },
        {
          find: /^react-router-dom\/(.*)$/,
          replacement:
            path.resolve(__dirname, 'node_modules/react-router-dom') + '/$1',
        },
      ],
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
