import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import neon from './neon-vite-plugin.ts'

const config = defineConfig({
  resolve: { tsconfigPaths: true },

  // TAMBAHKAN BAGIAN INI UNTUK MENJEBOL BLOKADE NGROK
  server: {
    allowedHosts: true,
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
