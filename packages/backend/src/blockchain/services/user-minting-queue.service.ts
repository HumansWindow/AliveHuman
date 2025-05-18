import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MintingQueue } from '../entities/minting-queue.entity';
import { MintingRecord } from '../entities/minting-record.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserMintingQueueService {
  private readonly logger = new Logger(UserMintingQueueService.name);

  constructor(
    @InjectRepository(MintingQueue)
    private mintingQueueRepository: Repository<MintingQueue>,
    @InjectRepository(MintingRecord)
    private mintingRecordRepository: Repository<MintingRecord>,
  ) {}

  /**
   * Add a minting request to the queue
   * @param mintingRecordId ID of the minting record
   * @param priority Priority level (higher = higher priority)
   * @returns The created queue item
   */
  async addToQueue(
    mintingRecordId: string,
    priority: number = 0,
  ): Promise<MintingQueue> {
    // Check if minting record exists
    const mintingRecord = await this.mintingRecordRepository.findOne({
      where: { id: mintingRecordId },
    });

    if (!mintingRecord) {
      throw new Error(`Minting record with ID ${mintingRecordId} not found`);
    }

    // Create a queue entry
    const queueItem = this.mintingQueueRepository.create({
      batchId: '', // Will be set when processed in a batch
      mintingRecordId,
      status: 'pending',
      priority,
    });

    // Save to queue
    const savedQueueItem = await this.mintingQueueRepository.save(queueItem);
    this.logger.log(`Added minting record ${mintingRecordId} to queue with priority ${priority}`);
    
    return savedQueueItem;
  }

  /**
   * Get pending minting queue items
   * @param limit Maximum number of items to retrieve
   * @returns Array of pending queue items
   */
  async getPendingItems(limit: number = 100): Promise<MintingQueue[]> {
    return this.mintingQueueRepository.find({
      where: { status: 'pending' },
      order: { priority: 'DESC', createdAt: 'ASC' },
      take: limit,
      relations: ['mintingRecord'],
    });
  }

  /**
   * Update queue items status
   * @param ids Array of queue item IDs
   * @param status New status
   * @returns Number of updated items
   */
  async updateQueueItemsStatus(
    ids: string[],
    status: 'pending' | 'processing' | 'complete' | 'failed',
  ): Promise<number> {
    const result = await this.mintingQueueRepository.update(
      { id: In(ids) },
      { 
        status,
        ...(status === 'complete' || status === 'processing' ? { processedAt: new Date() } : {})
      }
    );
    
    return result.affected || 0;
  }

  /**
   * Assign a batch ID to queue items
   * @param ids Array of queue item IDs
   * @returns Number of updated items
   */
  async assignBatchId(ids: string[]): Promise<number> {
    const batchId = uuidv4();
    const result = await this.mintingQueueRepository.update(
      { id: In(ids) },
      { batchId }
    );
    
    this.logger.log(`Assigned batch ID ${batchId} to ${result.affected} queue items`);
    return result.affected || 0;
  }

  /**
   * Get queue statistics
   * @returns Queue statistics
   */
  async getQueueStats(): Promise<any> {
    const pendingCount = await this.mintingQueueRepository.count({
      where: { status: 'pending' },
    });

    const processingCount = await this.mintingQueueRepository.count({
      where: { status: 'processing' },
    });

    const completedCount = await this.mintingQueueRepository.count({
      where: { status: 'complete' },
    });

    const failedCount = await this.mintingQueueRepository.count({
      where: { status: 'failed' },
    });

    return {
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      failed: failedCount,
      total: pendingCount + processingCount + completedCount + failedCount,
    };
  }

  /**
   * Get queue items for a specific user
   * @param userId User ID
   * @returns Queue items for the user
   */
  async getUserQueueItems(userId: string): Promise<any[]> {
    // First, get the user's minting records
    const mintingRecords = await this.mintingRecordRepository.find({
      where: { userId },
    });

    if (!mintingRecords.length) {
      return [];
    }

    // Get the associated queue items
    const queueItems = await this.mintingQueueRepository.find({
      where: { 
        mintingRecordId: In(mintingRecords.map(record => record.id)) 
      },
    });

    // Join the data
    return queueItems.map(item => {
      const record = mintingRecords.find(r => r.id === item.mintingRecordId);
      return {
        ...item,
        amount: record?.amount,
        recipientAddress: record?.recipientAddress,
        transactionHash: record?.transactionHash,
      };
    });
  }

  /**
   * Retry failed queue items
   * @param ids Array of queue item IDs to retry
   * @returns Number of updated items
   */
  async retryFailedItems(ids: string[]): Promise<number> {
    const result = await this.mintingQueueRepository.update(
      { id: In(ids), status: 'failed' },
      { status: 'pending', batchId: '' }
    );

    if (result.affected && result.affected > 0) {
      // Also update the associated minting records
      const queueItems = await this.mintingQueueRepository.find({
        where: { id: In(ids) },
      });

      const mintingRecordIds = queueItems.map(item => item.mintingRecordId);
      await this.mintingRecordRepository.update(
        { id: In(mintingRecordIds) },
        { status: 'pending', error: null }
      );

      this.logger.log(`Reset ${result.affected} failed queue items to pending status`);
    }
    
    return result.affected || 0;
  }
}