#!/bin/sh
# docker-entrypoint.sh
# Entrypoint script for Hardhat node container

echo "Starting Hardhat Node with auto-deployment..."

# Start Hardhat node in background
npx hardhat node &
HARDHAT_PID=$!

# Wait for node to be ready
echo "Waiting for Hardhat node to start..."
sleep 5

# Check if node is running
for i in 1 2 3 4 5; do
    if wget --spider -q http://localhost:8545 2>/dev/null; then
        echo "Hardhat node is running"
        break
    fi
    echo "Still waiting... ($i/5)"
    sleep 2
done

# Deploy contracts
echo "Deploying contracts..."
npx hardhat run scripts/docker-deploy.js --network localhost

# Keep the node running
echo "Setup complete. Hardhat node is running on port 8545"
wait $HARDHAT_PID
