# Stage 1: Build the production bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci || npm install

# Copy application source code and configs
COPY . .

# Compile TypeScript and Vite production bundle
RUN npm run build

# Stage 2: Serve with lightweight Nginx on Cloud Run (Port 8080)
FROM nginx:alpine

# Remove default nginx site
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose Cloud Run default port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
