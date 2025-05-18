import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

interface ProviderInfo {
  provider: ethers.providers.JsonRpcProvider;
  url: string;
  isHealthy: boolean;
  lastResponseTime: number;
}

@Injectable()
export class RpcProviderService {
  private readonly logger = new Logger(RpcProviderService.name);
  private providers: Record<string, ProviderInfo[]> = {
    ethereum: [],
    polygon: [],
    mumbai: [],
  };
  
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.setupProviders();
    this.startHealthChecks();
  }

  private setupProviders() {
    // Setup Ethereum providers
    const ethereumRpcUrl = this.configService.get<string>('blockchain.rpcUrls.ethereum');
    if (ethereumRpcUrl) {
      this.providers.ethereum.push({
        provider: new ethers.providers.JsonRpcProvider(ethereumRpcUrl),
        url: ethereumRpcUrl,
        isHealthy: true,
        lastResponseTime: 0,
      });
    }

    // Setup Polygon providers
    this.setupPolygonProviders();
    
    // Setup Mumbai testnet providers
    this.setupMumbaiProviders();

    this.logger.log('RPC providers initialized');
  }

  private setupPolygonProviders() {
    const mainRpcUrl = this.configService.get<string>('blockchain.rpcUrls.polygon');
    const fallbackUrls = this.configService.get<string[]>('blockchain.fallbackRpcUrls.polygon', []);
    
    if (mainRpcUrl) {
      // Add main RPC
      this.providers.polygon.push({
        provider: new ethers.providers.JsonRpcProvider(mainRpcUrl),
        url: mainRpcUrl,
        isHealthy: true,
        lastResponseTime: 0,
      });
    }
    
    // Add fallbacks
    for (const url of fallbackUrls) {
      if (url && url !== mainRpcUrl) {
        this.providers.polygon.push({
          provider: new ethers.providers.JsonRpcProvider(url),
          url,
          isHealthy: true,
          lastResponseTime: 0,
        });
      }
    }
  }

  private setupMumbaiProviders() {
    const mainRpcUrl = this.configService.get<string>('blockchain.rpcUrls.mumbai');
    const fallbackUrls = this.configService.get<string[]>('blockchain.fallbackRpcUrls.mumbai', []);
    
    if (mainRpcUrl) {
      // Add main RPC
      this.providers.mumbai.push({
        provider: new ethers.providers.JsonRpcProvider(mainRpcUrl),
        url: mainRpcUrl,
        isHealthy: true,
        lastResponseTime: 0,
      });
    }
    
    // Add fallbacks
    for (const url of fallbackUrls) {
      if (url && url !== mainRpcUrl) {
        this.providers.mumbai.push({
          provider: new ethers.providers.JsonRpcProvider(url),
          url,
          isHealthy: true,
          lastResponseTime: 0,
        });
      }
    }
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.checkProviderHealth();
    }, 60000); // Check every minute
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  private async checkProviderHealth() {
    for (const network of Object.keys(this.providers)) {
      for (const providerInfo of this.providers[network]) {
        try {
          const startTime = Date.now();
          const blockNumber = await providerInfo.provider.getBlockNumber();
          const responseTime = Date.now() - startTime;
          
          providerInfo.isHealthy = true;
          providerInfo.lastResponseTime = responseTime;
          
          this.logger.debug(`${network} provider ${providerInfo.url} health check passed. Block: ${blockNumber}, response time: ${responseTime}ms`);
        } catch (error) {
          providerInfo.isHealthy = false;
          this.logger.warn(`${network} provider ${providerInfo.url} health check failed: ${error.message}`);
        }
      }
    }
  }

  private getOptimalProvider(network: string): ethers.providers.JsonRpcProvider {
    if (!this.providers[network] || this.providers[network].length === 0) {
      throw new Error(`No providers configured for ${network}`);
    }
    
    // Sort by health and response time
    const sortedProviders = [...this.providers[network]]
      .filter(p => p.isHealthy)
      .sort((a, b) => a.lastResponseTime - b.lastResponseTime);
    
    if (sortedProviders.length === 0) {
      // If all are unhealthy, try the first one anyway
      return this.providers[network][0].provider;
    }
    
    return sortedProviders[0].provider;
  }

  async getProvider(network: 'ethereum' | 'polygon' | 'mumbai' = 'polygon'): Promise<ethers.providers.JsonRpcProvider> {
    return this.getOptimalProvider(network);
  }

  async getProviderHealth(): Promise<Record<string, any>> {
    const health = {};
    
    for (const network of Object.keys(this.providers)) {
      health[network] = this.providers[network].map(p => ({
        url: p.url,
        isHealthy: p.isHealthy,
        responseTime: p.lastResponseTime,
      }));
    }
    
    return health;
  }
}