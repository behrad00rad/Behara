import {defineConfig} from 'vite';
import contentServer from './scripts/content-server.js';

export default defineConfig({
  plugins:[contentServer()],
  server: {
    fs: {deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.studio/**']},
    // Original image files are source artifacts, not application modules.
    // Ignore them to avoid Windows file locks while images are encoded.
    watch: {ignored: ['**/src/assets/editorial/**', '**/public/images/**', '**/*.backup.txt']}
  }
});
