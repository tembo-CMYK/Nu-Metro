import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

function copyVanillaAppFiles() {
  return {
    name: 'copy-vanilla-app-files',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const assetsDir = path.resolve(__dirname, 'assets');
      const distAssetsDir = path.resolve(distDir, 'assets');

      // 1. Copy data.js, app.js, and accounts.js to dist/
      const filesToCopy = ['data.js', 'app.js', 'accounts.js'];
      filesToCopy.forEach(file => {
        const srcPath = path.resolve(__dirname, file);
        const destPath = path.resolve(distDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`[copy-vanilla-app-files] Copied ${file} to dist/`);
        }
      });

      // 2. Copy the assets directory to dist/assets
      if (fs.existsSync(assetsDir)) {
        if (!fs.existsSync(distAssetsDir)) {
          fs.mkdirSync(distAssetsDir, { recursive: true });
        }
        const copyDirRecursive = (src: string, dest: string) => {
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              if (entry.name === '.aistudio') continue; // skip .aistudio folder
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
              }
              copyDirRecursive(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        };
        copyDirRecursive(assetsDir, distAssetsDir);
        console.log(`[copy-vanilla-app-files] Copied entire assets/ folder to dist/assets/`);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), copyVanillaAppFiles()],
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
