import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite dev server proxy: forwards relative '/api' requests to the local
// backend (http://localhost:5001). This makes the relative baseURL used in
// production work during local development without cross-origin issues.
export default defineConfig(({ mode }) => {
  const proxy = {};
  if (mode === 'development') {
    proxy['/api'] = {
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
      ws: true,
    };
  }
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy,
    },
  };
});
