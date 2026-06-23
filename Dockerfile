FROM node:18-bullseye-slim

# Install git and other essential tools
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Install pnpm using npm to match lockfile version
RUN npm install -g pnpm@11.1.2

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package file
COPY backend/package.json ./backend/

# Install dependencies (only what's needed for backend and shared packages)
RUN pnpm install --filter backend... --frozen-lockfile

# Copy the rest of the application
COPY backend ./backend/

# Build the backend
RUN pnpm --filter backend build

# Expose the port
EXPOSE 3001

# Start the application
CMD ["pnpm", "--filter", "backend", "start"]
