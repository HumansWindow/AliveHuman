import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const logger = new Logger('TestBlockchainConnection');

async function testConnection() {
  logger.log('Testing blockchain connections...');
  
  try {
    // Load configurations manually since we're not using the NestJS container
    const configService = new ConfigService();
    
    // Get RPC URLs from config
    const polygonRpcUrl = configService.get<string>('blockchain.rpcUrls.polygon');
    const mumbaiRpcUrl = configService.get<string>('blockchain.rpcUrls.mumbai');
    
    logger.log(`Polygon RPC URL: ${polygonRpcUrl}`);
    logger.log(`Mumbai RPC URL: ${mumbaiRpcUrl}`);
    
    // Test connections
    if (polygonRpcUrl) {
      const polygonProvider = new ethers.providers.JsonRpcProvider(polygonRpcUrl);
      const polygonNetwork = await polygonProvider.getNetwork();
      logger.log(`Connected to Polygon network: ${JSON.stringify(polygonNetwork)}`);
      
      const blockNumber = await polygonProvider.getBlockNumber();
      logger.log(`Current Polygon block number: ${blockNumber}`);
    } else {
      logger.warn('Polygon RPC URL not configured. Skipping test.');
    }
    
    if (mumbaiRpcUrl) {
      const mumbaiProvider = new ethers.providers.JsonRpcProvider(mumbaiRpcUrl);
      const mumbaiNetwork = await mumbaiProvider.getNetwork();
      logger.log(`Connected to Mumbai network: ${JSON.stringify(mumbaiNetwork)}`);
      
      const blockNumber = await mumbaiProvider.getBlockNumber();
      logger.log(`Current Mumbai block number: ${blockNumber}`);
    } else {
      logger.warn('Mumbai RPC URL not configured. Skipping test.');
    }
    
    logger.log('Blockchain connections test completed successfully.');
  } catch (error) {
    logger.error(`Error testing blockchain connections: ${error.message}`);
    throw error;
  }
}

// Run the test function
testConnection()
  .then(() => {
    logger.log('All blockchain connection tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Blockchain connection tests failed: ${error.message}`);
    process.exit(1);
  });
