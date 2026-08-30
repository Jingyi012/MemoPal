# Build stage
FROM node:26-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN npm ci --workspace=memopal-admin --include-workspace-root=false

COPY apps/admin apps/admin

ARG VITE_API_BASE_URL
ARG VITE_MEDIA_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_MEDIA_BASE_URL=${VITE_MEDIA_BASE_URL}

RUN npm run build --workspace=memopal-admin

# Runtime stage
FROM nginx:1.27-alpine AS runtime
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/admin/dist /usr/share/nginx/html

EXPOSE 80
