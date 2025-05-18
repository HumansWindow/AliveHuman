#!/bin/bash

# Script to test the hot wallet and blockchain functionality

# Change to the backend directory
cd $(dirname "$0")/../packages/backend

# Check environment variables
echo "Checking environment variables..."
if [[ -z "$HOT_WALLET_ADDRESS" ]]; then
  echo "Error: HOT_WALLET_ADDRESS is not set. Please check your .env file."
  exit 1
fi

if [[ -z "$HOT_WALLET_ENCRYPTION_KEY" ]]; then
  echo "Error: HOT_WALLET_ENCRYPTION_KEY is not set. Please check your .env file."
  exit 1
fi

# Test blockchain connection
echo "Testing blockchain connection..."
npx ts-node -r tsconfig-paths/register src/blockchain/test-connection.ts

# Test hot wallet functions
echo "Testing hot wallet functionality..."
npx ts-node -r tsconfig-paths/register src/blockchain/hotwallet/test-wallet.ts

echo "Tests completed."
