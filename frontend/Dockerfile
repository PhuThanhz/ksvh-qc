# ==============================================================================
# Multi-stage Dockerfile cho Frontend KSVH QC (React 19 + Vite + Nginx)
# ==============================================================================

# Stage 1: Build tĩnh
FROM node:22-alpine AS builder
WORKDIR /workspace

# Sao chép package.json và cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Sao chép mã nguồn và đóng gói bản build production
COPY . .
RUN npm run build

# Stage 2: Web Server Nginx
FROM nginx:1.27-alpine AS runner

# Xoá trang mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Sao chép file cấu hình Nginx và file tĩnh đã build
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
