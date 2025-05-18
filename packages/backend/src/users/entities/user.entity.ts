import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WalletConnection } from './wallet-connection.entity';
import { Session } from '../../auth/entities/session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @OneToMany(() => WalletConnection, (walletConnection: WalletConnection) => walletConnection.user)
  walletConnections: WalletConnection[];

  @OneToMany(() => Session, (session: Session) => session.user)
  sessions: Session[];

  @Column({ nullable: true })
  walletAddress: string;

  @Column({ nullable: true })
  chainId: string;

  @Column({ nullable: true })
  firstLoginAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
}