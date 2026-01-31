# Multi-stage Dockerfile for NFT Launchpad
# Run with: docker-compose up

# =============================================================================
# Stage 1: Contracts - Hardhat Node with auto-deployment
# =============================================================================
FROM node:20-alpine AS contracts

WORKDIR /app

# Install required tools
RUN apk add --no-cache wget

# Copy package files
COPY package*.json ./
COPY hardhat.config.js ./
COPY allowlist.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy contracts and scripts
COPY contracts ./contracts
COPY scripts ./scripts
COPY test ./test
COPY docker-entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Create frontend contracts directory for ABI output
RUN mkdir -p frontend/contracts

# Compile contracts
RUN npx hardhat compile

# Expose Hardhat node port
EXPOSE 8545

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD wget --spider -q http://localhost:8545 || exit 1

# Run entrypoint (starts node + deploys contracts)
CMD ["./docker-entrypoint.sh"]

# =============================================================================
# Stage 2: Frontend - Next.js App
# =============================================================================
FROM node:20-alpine AS frontend

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy frontend source
COPY frontend ./

# Build arguments for contract address
ARG NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=$NEXT_PUBLIC_CONTRACT_ADDRESS

# Build Next.js app
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD wget --spider -q http://localhost:3000 || exit 1

# Start Next.js app in dev mode
CMD ["npm", "run", "dev"]
