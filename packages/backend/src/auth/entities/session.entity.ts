import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DeviceFingerprint, LocationData } from '@alive-human/shared';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.sessions)
  user: User;

  @Column({ name: 'wallet_address', nullable: true })
  walletAddress: string;

  @Column({ name: 'device_fingerprint', type: 'jsonb' })
  deviceFingerprint: DeviceFingerprint;

  @Column({ name: 'location_data', type: 'jsonb' })
  locationData: LocationData;

  @Column({ name: 'start_time', type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ name: 'last_active_time', type: 'timestamp with time zone' })
  lastActiveTime: Date;

  @Column({ name: 'end_time', type: 'timestamp with time zone', nullable: true })
  endTime: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ name: 'chain_id', nullable: true })
  chainId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
