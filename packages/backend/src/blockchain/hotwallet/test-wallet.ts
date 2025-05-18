import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { WalletManager } from './WalletManager';

const logger = new Logger('TestHotWallet');

async function testHotWallet() {
  logger.log('Testing hot wallet functionality...');
  
  try {
    // Load configurations manually
    const configService = new ConfigService();
    
    // Get hot wallet config
    const hotWalletAddress = configService.get<string>('blockchain.hotWallet.address');
    const encryptionKey = configService.get<string>('blockchain.hotWallet.encryptionKey');
    
    if (!hotWalletAddress || !encryptionKey) {
      throw new Error('Hot wallet configuration is missing. Please check your .env file.');
    }
    
    logger.log(`Hot wallet address: ${hotWalletAddress}`);
    
    // Initialize WalletManager
    const walletManager = new WalletManager({
      encryptionKey,
      address: hotWalletAddress,
    });
    
    // Test wallet initialization
    logger.log('Initializing wallet...');
    await walletManager.init();
    
    // Test getAddress
    const address = walletManager.getAddress();
    logger.log(`Wallet address: ${address}`);
    
    if (address.toLowerCase() !== hotWalletAddress.toLowerCase()) {
      throw new Error(`Address mismatch: ${address} != ${hotWalletAddress}`);
    }
    
    // Test wallet balance
    const mumbaiRpcUrl = configService.get<string>('blockchain.rpcUrls.mumbai');
    if (mumbaiRpcUrl) {
      const provider = new ethers.providers.JsonRpcProvider(mumbaiRpcUrl);
      const balance = await provider.getBalance(address);
      logger.log(`Wallet balance on Mumbai: ${ethers.utils.formatEther(balance)} MATIC`);
    }
    
    logger.log('Hot wallet tests completed successfully.');
  } catch (error) {
    logger.error(`Error testing hot wallet: ${error.message}`);
    throw error;
  }
}

// Run the test function
testHotWallet()
  .then(() => {
    logger.log('All hot wallet tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Hot wallet tests failed: ${error.message}`);
    process.exit(1);
  });
