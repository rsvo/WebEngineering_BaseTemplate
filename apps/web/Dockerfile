# Build context is the repository root (see compose.yaml), because the
# workspaces share one package-lock.json.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# The root workspace provides TypeScript for the type check in `build`.
RUN npm ci --workspace apps/web --include-workspace-root --ignore-scripts
COPY apps/web apps/web
RUN npm run build --workspace apps/web

# Only the static bundle ships; no Node.js runtime is needed to serve it.
FROM nginx:1.29-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
