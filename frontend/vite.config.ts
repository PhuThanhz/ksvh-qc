import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// HTTPS bắt buộc để điện thoại cho phép dùng GPS và camera.
// Chạy `npm run dev` rồi mở https://<IP-máy-tính>:5273 trên điện thoại cùng mạng Wi-Fi.
// Chỉ dev trên máy tính: `npm run dev:http` (localhost vẫn được dùng GPS/camera, không cần HTTPS).
const useHttps = process.env.DEV_HTTP !== '1'

export default defineConfig({
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5273,
    strictPort: true, // cố định cổng vì S3_PUBLIC_ENDPOINT phụ thuộc vào nó
    proxy: {
      // API Spring Boot: trình duyệt chỉ gọi cùng origin → không cần CORS.
      '/api': { target: 'http://localhost:8088', changeOrigin: true },
      // Upload ảnh lên MinIO qua presigned URL. Giữ nguyên Host (changeOrigin: false)
      // để khớp chữ ký; backend cần S3_PUBLIC_ENDPOINT=https://<IP-máy-tính>:5273.
      '/ksvh-qc': { target: 'http://localhost:9000', changeOrigin: false },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }
          }
        },
      },
    },
  },
})
