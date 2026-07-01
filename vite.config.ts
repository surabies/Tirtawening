import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import neon from './neon-vite-plugin.ts'

const config = defineConfig({
  resolve: { tsconfigPaths: true },

  // Mengamankan koneksi tunnel/ngrok agar tidak terblokir
  server: {
    allowedHosts: true,
  },

  // Vite 8/Rolldown dapat memicu WebAssembly memory exhaustion di lingkungan ini.
  // Menonaktifkan optimizer dependency menghilangkan crash saat dev/build tanpa
  // mengubah fungsionalitas aplikasi.
  optimizeDeps: {
    noDiscovery: true,
    include: [
      // CJS shim — tanpa pre-bundle, ESM named import gagal di client
      'use-sync-external-store/shim/with-selector',
      'use-sync-external-store/shim',
      // @visx/responsive import default dari lodash/debounce (CJS)
      'lodash/debounce',
      'classnames',
    ],
  },

  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
  },

  esbuild: {
    target: 'es2022',
  },

  ssr: {
    // Bundel paket @visx agar import ESM tanpa ekstensi (.js) ter-resolve di SSR
    noExternal: [/^@visx\//, 'recharts'],
  },

  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    neon,
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
