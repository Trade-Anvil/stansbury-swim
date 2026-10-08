# Builder stage
FROM node:24 as builder

ARG NODE_ENV
ARG BUILD_FLAG

WORKDIR /app/builder

COPY package*.json ./

ENV NX_SKIP_NATIVE_BUILD=true

# Same install as CI. --legacy-peer-deps used to be here, but it skips peer dependencies, and webpack is
# one (of webpack-cli 7). Scripts are skipped because nothing in the build needs them and Nx's
# post-install step has hung builds before.
RUN npm ci --ignore-scripts

COPY . .

# webpack-cli exits 0 when it can't run, so check the bundle exists instead of trusting the exit code.
RUN npm run build:api && test -f dist/apps/api/main.js

# --- Final runtime stage ---
FROM node:24 as runner

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

COPY --from=builder /app/builder/dist/apps/api ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/main.js"]
