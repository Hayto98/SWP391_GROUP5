# Sử dụng image Node.js phiên bản 20 (bản Alpine gọn nhẹ)
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy các file quản lý thư viện trước để tận dụng Docker cache
COPY package*.json ./

# Cài đặt các thư viện (chỉ cài dependencies dùng cho production)
RUN npm ci --only=production

# Copy toàn bộ code vào trong container
COPY . .

# Mở port (cần khớp với file .env, thường là 3000)
EXPOSE 3000

# Lệnh chạy ứng dụng khi container khởi động
CMD ["npm", "start"]
