FROM node:18

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mở cổng ứng dụng
EXPOSE 3000

# Biến môi trường mặc định
ENV PORT=3000

# Lệnh khởi chạy server
CMD ["npm", "start"]
