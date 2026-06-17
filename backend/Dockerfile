# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# devDeps mantidas de propósito: drizzle-kit (migrate) e tsx (seed) rodam no container.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8000

# API por padrão; o worker e o migrate sobrescrevem o command no compose:
#   worker:  node dist/worker.js
#   migrate: npm run db:migrate && npm run db:seed && npm run db:seed:demo
CMD ["node", "dist/index.js"]
