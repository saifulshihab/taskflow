FROM node:24-slim

# Install system build dependencies for native addons like argon2
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential python3 openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install from the lockfile for a reproducible image.
COPY package.json package-lock.json ./

RUN npm ci

# The generated client is ignored by Git, so create it before compiling the API.
COPY . .
RUN npm run db:generate && npm run build

RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 4000

# Production migrations run in GitHub Actions after CI passes.
CMD ["npm", "run", "start"]
