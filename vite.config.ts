import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import { markdownPlugin } from './vite-plugin-markdown';

export default defineConfig(() => {
  return {
    base: process.env.NODE_ENV === 'production' ? '/blogposts/' : '/',
    plugins: [
      markdownPlugin(),
      react(),
      tailwindcss(),
      {
        name: 'serve-root-assets',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/assets/')) {
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
                res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                res.writeHead(200);
                res.end(fs.readFileSync(filePath));
                return;
              }
            }
            next();
          });
        },
        closeBundle() {
          const srcDir = path.join(__dirname, 'assets');
          const destDir = path.join(__dirname, 'dist', 'assets');
          
          const copyRecursive = (src: string, dest: string) => {
            if (!fs.existsSync(src)) return;
            if (fs.statSync(src).isDirectory()) {
              if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
              }
              const entries = fs.readdirSync(src);
              for (const entry of entries) {
                copyRecursive(path.join(src, entry), path.join(dest, entry));
              }
            } else {
              fs.copyFileSync(src, dest);
            }
          };
          
          copyRecursive(srcDir, destDir);
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
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
