FROM node:20-slim

WORKDIR /app

# Install system dependencies including OpenSSL
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Combine npm global installs to reduce layers
RUN npm install -g pnpm @nestjs/cli

# Copy only package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Combine install and generate steps
RUN pnpm install && \
    pnpm prisma generate

# Copy the rest of the application
COPY . .

EXPOSE 4000

# Remove existing link if any and create new one
RUN rm -f /usr/local/bin/nest && ln -s /usr/local/lib/node_modules/@nestjs/cli/bin/nest.js /usr/local/bin/nest

CMD ["pnpm", "start:dev"]