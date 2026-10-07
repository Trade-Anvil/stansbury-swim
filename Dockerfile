# Builder stage
FROM node:24 as builder

ARG NODE_ENV
ARG BUILD_FLAG

WORKDIR /app/builder

COPY package*.json ./

ENV NX_SKIP_NATIVE_BUILD=true

RUN npm ci --legacy-peer-deps --ignore-scripts && node node_modules/nx/bin/post-install || true

COPY . .

RUN npm run build:api

# --- Final runtime stage ---
FROM node:24 as runner

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps

COPY --from=builder /app/builder/dist/apps/api ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/main.js"]
