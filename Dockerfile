FROM node:24-slim

# argon2 is a native addon; these are needed when no prebuilt binary matches.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential python3 openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pre-create node_modules so the named volume mounted there inherits node's ownership.
RUN mkdir -p /app/node_modules && chown -R node:node /app

WORKDIR /app
USER node

CMD ["npm", "run", "dev"]
