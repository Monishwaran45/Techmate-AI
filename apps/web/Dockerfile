# Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g npm@latest

# Development stage
FROM base AS development
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared-types/package*.json ./packages/shared-types/
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace=apps/web"]

# Build stage
FROM base AS build
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared-types/package*.json ./packages/shared-types/
RUN npm ci
COPY . .
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/web

# Production stage
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
