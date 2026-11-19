# Build context is the repository root (see compose.yaml), because the
# workspaces share one package-lock.json.

FROM node:24-alpine AS build
WORKDIR /app
# Manifests first: the dependency layer is only rebuilt when they change.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# --ignore-scripts: skips the root `prepare` (husky), which is meaningless here.
RUN npm ci --workspace apps/api --include-workspace-root --ignore-scripts
COPY apps/api apps/api
RUN npm run build --workspace apps/api

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/api --omit=dev --ignore-scripts \
  && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
# Read at runtime by dist/db/migrate.js and dist/db/seed.js.
COPY apps/api/drizzle apps/api/drizzle
COPY apps/api/fixtures apps/api/fixtures

WORKDIR /app/apps/api
USER node
EXPOSE 3000
# Run node directly (not via npm) so it receives SIGTERM from `docker stop`.
CMD ["node", "dist/server.js"]
