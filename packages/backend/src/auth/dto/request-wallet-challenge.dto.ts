import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestWalletChallengeDto {
  @ApiProperty({ 
    example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    description: 'Ethereum wallet address' 
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' })
  address: string;

  @ApiProperty({ 
    example: '1',
    description: 'Chain ID (e.g., 1 for Ethereum mainnet, 137 for Polygon, 80001 for Mumbai testnet)' 
  })
  @IsNotEmpty()
  chainId: number;
}