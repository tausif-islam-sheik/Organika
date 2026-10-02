FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json frontend/
COPY packages ./packages
RUN pnpm install --frozen-lockfile
FROM deps AS dev
COPY . .
CMD ["pnpm", "--filter", "frontend", "dev"]
FROM deps AS build
COPY . .
RUN pnpm --filter frontend build
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/frontend/.next/standalone ./
COPY --from=build /repo/frontend/.next/static ./.next/static
COPY --from=build /repo/frontend/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
