import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import { markdownPlugin } from './vite-plugin-markdown';

export default defineConfig(() => ({
  base: process.env.NODE_ENV === 'production' ? '/blogposts/' : '/',

  plugins: [
    markdownPlugin(),
    react(),
    tailwindcss(),
    {
      // Copies the /assets/ directory into dist/ after the bundle is written
      name: 'copy-root-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/assets/')) { next(); return; }
          const cleanUrl = req.url.split('?')[0];
          const filePath = path.join(__dirname, cleanUrl);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const mimeTypes: Record<string, string> = {
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.css': 'text/css',
              '.js': 'application/javascript',
            };
            const ext = path.extname(filePath).toLowerCase();
            res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream');
            res.writeHead(200);
            res.end(fs.readFileSync(filePath));
            return;
          }
          next();
        });
      },
      closeBundle() {
        const copyRecursive = (src: string, dest: string) => {
          if (!fs.existsSync(src)) return;
          if (fs.statSync(src).isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            for (const entry of fs.readdirSync(src)) {
              copyRecursive(path.join(src, entry), path.join(dest, entry));
            }
          } else {
            fs.copyFileSync(src, dest);
          }
        };
        copyRecursive(path.join(__dirname, 'assets'), path.join(__dirname, 'dist', 'assets'));
      },
    },
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-markdown': ['react-markdown', 'remark-gfm', 'rehype-raw', 'rehype-slug'],
          'vendor-icons':    ['lucide-react'],
        },
      },
    },
  },

  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
