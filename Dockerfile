# Dockerfile at monorepo root. Railway uses this for one public app service.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/infra ./infra
EXPOSE 4000
CMD ["npm", "run", "start"]
