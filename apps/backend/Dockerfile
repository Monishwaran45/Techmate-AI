# Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g npm@latest

# Development stage
FROM base AS development
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared-types/package*.json ./packages/shared-types/
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev", "--workspace=apps/backend"]

# Build stage
FROM base AS build
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared-types/package*.json ./packages/shared-types/
RUN npm ci --only=production
COPY . .
RUN npm run build --workspace=apps/backend
RUN npm run build --workspace=packages/shared-types

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /app/apps/backend/package*.json ./apps/backend/
EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
