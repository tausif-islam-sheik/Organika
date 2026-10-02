FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
COPY packages ./packages
RUN pnpm install --frozen-lockfile
FROM deps AS dev
COPY . .
CMD ["pnpm", "--filter", "backend", "start:dev"]
FROM deps AS build
COPY . .
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend build
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/backend/dist ./dist
COPY --from=build /repo/backend/package.json ./
COPY --from=build /repo/backend/prisma ./prisma
USER node
EXPOSE 4000
HEALTHCHECK CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/main.js"]
