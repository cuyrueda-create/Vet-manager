# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build

# Versión de la imagen (SemVer), se inyecta en tiempo de build.
# Declarada al FINAL para no invalidar la caché de capas anteriores.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

EXPOSE 5173

CMD ["pnpm", "exec", "serve", "-s", "dist", "-l", "5173"]