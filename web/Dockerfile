FROM node:24-slim

WORKDIR /app

# 1. Copy package files first so Docker can cache dependencies
COPY package*.json ./

# 2. Install dependencies inside the Linux container environment
RUN npm install

# 3. Copy the rest of your Next.js application source code
COPY . .

# 4. Pre-create the build directory and ensure the 'node' user has permissions
RUN mkdir -p /app/.next && chown -R node:node /app

USER node

CMD ["npm", "run", "dev"]
