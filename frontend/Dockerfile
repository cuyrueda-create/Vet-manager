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

EXPOSE 5173

CMD ["pnpm", "exec", "serve", "-s", "dist", "-l", "5173"]