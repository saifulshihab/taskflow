FROM node:24-slim

# Install system build dependencies for native addons like argon2
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential python3 openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy package files first
COPY package*.json ./

# 2. Clean install your dependencies inside the Linux container
RUN npm install

# 3. Copy the rest of your project files
COPY . .

RUN chown -R node:node /app
USER node

CMD ["npm", "run", "dev"]
