import { registerAs } from '@nestjs/config';

export const blockchainConfig = registerAs('blockchain', () => ({
  rpcUrls: {
    ethereum: process.env.ETHEREUM_RPC_URL,
    polygon: process.env.POLYGON_RPC_URL,
    mumbai: process.env.POLYGON_MUMBAI_RPC_URL,
  },
  fallbackRpcUrls: {
    polygon: (process.env.POLYGON_FALLBACK_RPC_URLS || '').split(',').filter(Boolean),
    mumbai: (process.env.POLYGON_MUMBAI_FALLBACK_RPC_URLS || '').split(',').filter(Boolean),
  },
  contractAddresses: {
    shahiToken: process.env.SHAHI_TOKEN_CONTRACT_ADDRESS,
    shahiTokenMumbai: process.env.SHAHI_TOKEN_CONTRACT_ADDRESS_MUMBAI,
  },
  hotWallet: {
    address: process.env.HOT_WALLET_ADDRESS,
    encryptionKey: process.env.HOT_WALLET_ENCRYPTION_KEY,
  },
  minting: {
    batchEnabled: process.env.BATCH_MINTING_ENABLED === 'true',
    batchMaxSize: parseInt(process.env.BATCH_MINTING_MAX_SIZE || '10', 10),
    batchIntervalMs: parseInt(process.env.BATCH_MINTING_INTERVAL_MS || '300000', 10),
  },
}));