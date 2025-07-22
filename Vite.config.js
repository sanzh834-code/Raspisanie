import { defineConfig } from 'vite'
import ghPages from 'vite-plugin-gh-pages'

export default defineConfig({
  plugins: [ghPages()],
  base: '/Raspisanie/', // 👈 Обязательно — имя репозитория!
})
