FROM node:24-slim

# Pre-create the mount points so the named volumes inherit node's ownership.
RUN mkdir -p /app/node_modules /app/.next && chown -R node:node /app

WORKDIR /app
USER node

CMD ["npm", "run", "dev"]
