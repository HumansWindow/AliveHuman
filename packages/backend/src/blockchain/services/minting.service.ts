import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ShahiTokenService } from './shahi-token.service';
import { MintingRecord } from '../entities/minting-record.entity';
import { MintingQueue } from '../entities/minting-queue.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MintingService {
  private readonly logger = new Logger(MintingService.name);
  private batchMintingEnabled: boolean;
  private batchMintMaxSize: number;
  private batchMintingIntervalMs: number;
  private batchMintingTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(MintingRecord)
    private mintingRecordRepository: Repository<MintingRecord>,
    @InjectRepository(MintingQueue)
    private mintingQueueRepository: Repository<MintingQueue>,
    private readonly configService: ConfigService,
    private readonly shahiTokenService: ShahiTokenService,
  ) {
    // Load configuration
    this.batchMintingEnabled = this.configService.get<boolean>('blockchain.minting.batchEnabled', false);
    this.batchMintMaxSize = this.configService.get<number>('blockchain.minting.batchMaxSize', 10);
    this.batchMintingIntervalMs = this.configService.get<number>('blockchain.minting.batchIntervalMs', 300000);

    // Start batch processing if enabled
    if (this.batchMintingEnabled) {
      this.startBatchProcessing();
    }
  }

  onModuleDestroy() {
    if (this.batchMintingTimer) {
      clearInterval(this.batchMintingTimer);
    }
  }

  /**
   * Start the batch processing timer
   */
  private startBatchProcessing() {
    this.logger.log(`Starting batch minting process (interval: ${this.batchMintingIntervalMs}ms, max batch size: ${this.batchMintMaxSize})`);
    this.batchMintingTimer = setInterval(async () => {
      try {
        await this.processMintingBatch();
      } catch (error) {
        this.logger.error(`Batch processing error: ${error.message}`);
      }
    }, this.batchMintingIntervalMs);

    // Process immediately on startup to handle any pending mints
    this.processMintingBatch().catch(error => {
      this.logger.error(`Initial batch processing error: ${error.message}`);
    });
  }

  /**
   * Process a batch of pending minting requests
   */
  async processMintingBatch(): Promise<void> {
    // Check if there are pending minting requests
    const pendingCount = await this.mintingQueueRepository.count({ 
      where: { status: 'pending' } 
    });

    if (pendingCount === 0) {
      this.logger.debug('No pending minting requests to process');
      return;
    }

    // Generate a batch ID
    const batchId = uuidv4();
    this.logger.log(`Processing minting batch ${batchId} (${pendingCount} pending requests)`);

    // Get records to process in this batch
    const queueItems = await this.mintingQueueRepository.find({
      where: { status: 'pending' },
      order: { priority: 'DESC', createdAt: 'ASC' },
      take: this.batchMintMaxSize,
      relations: ['mintingRecord'],
    });

    if (queueItems.length === 0) {
      return;
    }

    // Update status to processing
    await this.mintingQueueRepository.update(
      { id: In(queueItems.map(item => item.id)) },
      { status: 'processing' }
    );

    // Prepare recipients and amounts for batch minting
    const mintingRecordIds = queueItems.map(item => item.mintingRecordId);
    const mintingRecords = await this.mintingRecordRepository.find({
      where: { id: In(mintingRecordIds) }
    });

    // Map to arrays needed for batch minting
    const recipients: string[] = [];
    const amounts: string[] = [];
    const recordMap = new Map<string, MintingRecord>();

    mintingRecords.forEach(record => {
      recordMap.set(record.id, record);
      recipients.push(record.recipientAddress);
      amounts.push(record.amount);
    });

    // Default to polygon network for production (or use Mumbai for testing/dev)
    const network = process.env.NODE_ENV === 'production' ? 'polygon' : 'mumbai';

    try {
      // Execute the batch mint transaction
      const txHash = await this.shahiTokenService.batchMint(recipients, amounts, network);
      const now = new Date();

      // Update all minting records
      await this.mintingRecordRepository.update(
        { id: In(mintingRecordIds) },
        { 
          status: 'complete', 
          transactionHash: txHash,
          processedAt: now,
          networkId: network === 'polygon' ? 137 : 80001 // Chain IDs for Polygon and Mumbai
        }
      );

      // Update queue items
      await this.mintingQueueRepository.update(
        { id: In(queueItems.map(item => item.id)) },
        { status: 'complete', processedAt: now }
      );

      this.logger.log(`Batch ${batchId} minting completed. Transaction: ${txHash}`);
    } catch (error) {
      this.logger.error(`Batch ${batchId} minting failed: ${error.message}`);

      // Update all minting records with error
      await this.mintingRecordRepository.update(
        { id: In(mintingRecordIds) },
        { 
          status: 'failed', 
          error: error.message
        }
      );

      // Update queue items
      await this.mintingQueueRepository.update(
        { id: In(queueItems.map(item => item.id)) },
        { status: 'failed' }
      );
    }
  }

  /**
   * Request token minting for a user
   * @param userId User ID
   * @param amount Amount to mint
   * @param recipientAddress Recipient wallet address
   * @param priority Priority level (higher number = higher priority)
   * @returns The created minting record
   */
  async requestMinting(
    userId: string,
    amount: string,
    recipientAddress: string,
    priority: number = 0
  ): Promise<MintingRecord> {
    // Create a minting record
    const mintingRecord = this.mintingRecordRepository.create({
      userId,
      amount,
      recipientAddress,
      status: 'pending'
    });

    // Save the minting record
    const savedRecord = await this.mintingRecordRepository.save(mintingRecord);

    // If batch minting is enabled, add to queue and return
    if (this.batchMintingEnabled) {
      // Create a queue entry
      const queueItem = this.mintingQueueRepository.create({
        batchId: '',  // Will be set during batch processing
        mintingRecordId: savedRecord.id,
        status: 'pending',
        priority
      });

      // Save to queue
      await this.mintingQueueRepository.save(queueItem);
      this.logger.log(`Minting request queued for ${recipientAddress}: ${amount} tokens with priority ${priority}`);
      return savedRecord;
    }

    // Otherwise, mint immediately
    try {
      // Default to polygon network for production (or use Mumbai for testing/dev)
      const network = process.env.NODE_ENV === 'production' ? 'polygon' : 'mumbai';
      const txHash = await this.shahiTokenService.mint(recipientAddress, amount, network);

      // Update record with transaction hash
      savedRecord.status = 'complete';
      savedRecord.transactionHash = txHash;
      savedRecord.processedAt = new Date();
      savedRecord.networkId = network === 'polygon' ? 137 : 80001; // Chain IDs for Polygon and Mumbai

      await this.mintingRecordRepository.save(savedRecord);
      this.logger.log(`Direct minting completed for ${recipientAddress}: ${amount} tokens. Transaction: ${txHash}`);
    } catch (error) {
      // Update record with error
      savedRecord.status = 'failed';
      savedRecord.error = error.message;

      await this.mintingRecordRepository.save(savedRecord);
      this.logger.error(`Direct minting failed for ${recipientAddress}: ${error.message}`);
    }

    return savedRecord;
  }

  /**
   * Get the minting status for a user
   * @param userId User ID
   * @returns Minting records for the user
   */
  async getUserMintingHistory(userId: string): Promise<MintingRecord[]> {
    return this.mintingRecordRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get a minting record by ID
   * @param recordId Record ID
   * @returns Minting record
   */
  async getMintingRecord(recordId: string): Promise<MintingRecord> {
    return this.mintingRecordRepository.findOne({ where: { id: recordId } });
  }

  /**
   * Get minting statistics
   * @returns Minting statistics
   */
  async getMintingStats(): Promise<any> {
    const totalMinted = await this.mintingRecordRepository.count({ 
      where: { status: 'complete' } 
    });

    const pendingMints = await this.mintingRecordRepository.count({ 
      where: { status: 'pending' } 
    });

    const failedMints = await this.mintingRecordRepository.count({ 
      where: { status: 'failed' } 
    });

    // Total amount minted (sum)
    const result = await this.mintingRecordRepository
      .createQueryBuilder('minting')
      .select('SUM(minting.amount)', 'totalAmount')
      .where('minting.status = :status', { status: 'complete' })
      .getRawOne();
    
    return {
      totalMinted,
      pendingMints,
      failedMints,
      totalAmount: result?.totalAmount || '0'
    };
  }
}