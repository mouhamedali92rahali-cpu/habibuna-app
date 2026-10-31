import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

// رقم نسخة التطبيق من android/app/build.gradle، ليقارنه التطبيق بالحقل app في cards.json فيعرض زرّ التحديث
const APP_VERSION = /versionName "([^"]+)"/.exec(readFileSync(new URL('./android/app/build.gradle', import.meta.url), 'utf8'))?.[1] ?? '0'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
})
