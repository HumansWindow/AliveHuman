import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
} from 'typeorm';

@Entity('minting_queue')
export class MintingQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  batchId: string;

  @Column()
  mintingRecordId: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'complete' | 'failed';

  @Column({ default: 0 })
  priority: number;

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}