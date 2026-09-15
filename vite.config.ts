import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // mobile/은 별도의 React Native(Expo) 패키지이므로 웹 앱 테스트 실행 시 제외한다
    exclude: ['**/node_modules/**', 'mobile/**'],
  },
})
