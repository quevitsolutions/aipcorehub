# AIPCore Frontend Dockerfile
# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Pass build-time environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_PROJECT_ID
ENV VITE_PROJECT_ID=$VITE_PROJECT_ID
ARG VITE_BSC_MAINNET_RPC
ENV VITE_BSC_MAINNET_RPC=$VITE_BSC_MAINNET_RPC

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy build artifacts to nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
