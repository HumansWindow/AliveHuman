import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as MerkleTree from 'merkletreejs';
import * as keccak256 from 'keccak256';

export interface WhitelistEntry {
  address: string;
  amount: string;
}

@Injectable()
export class MerkleService {
  private readonly logger = new Logger(MerkleService.name);
  private merkleTree: any = null;
  private entries: WhitelistEntry[] = [];

  /**
   * Generate a Merkle tree from a list of whitelist entries
   * @param entries Array of address and amount pairs
   * @returns Merkle root hash
   */
  generateMerkleTree(entries: WhitelistEntry[]): string {
    this.entries = entries;
    
    // Create leaves from the whitelist entries
    // Each leaf is keccak256(address + amount)
    const leaves = entries.map(entry => {
      return Buffer.from(
        ethers.utils.solidityKeccak256(
          ['address', 'uint256'],
          [entry.address, entry.amount]
        ).slice(2), // Remove the '0x' prefix
        'hex'
      );
    });

    // Create a new Merkle tree
    this.merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    
    // Get and return the Merkle root
    const root = '0x' + this.merkleTree.getRoot().toString('hex');
    this.logger.log(`Generated Merkle tree with ${entries.length} entries. Root: ${root}`);
    
    return root;
  }

  /**
   * Get the Merkle proof for a specific whitelist entry
   * @param address User address
   * @param amount Token amount
   * @returns Array of proof hashes
   */
  getMerkleProof(address: string, amount: string): string[] {
    if (!this.merkleTree) {
      throw new Error('Merkle tree not generated');
    }
    
    // Create the leaf for this entry
    const leaf = Buffer.from(
      ethers.utils.solidityKeccak256(
        ['address', 'uint256'],
        [address, amount]
      ).slice(2),
      'hex'
    );
    
    // Get the proof from the Merkle tree
    const proof = this.merkleTree.getProof(leaf);
    
    // Convert the proof to hex strings
    return proof.map(p => '0x' + p.data.toString('hex'));
  }

  /**
   * Verify if an address and amount are in the Merkle tree
   * @param address User address
   * @param amount Token amount
   * @returns True if the entry is in the tree
   */
  verifyMerkleProof(address: string, amount: string): boolean {
    if (!this.merkleTree) {
      throw new Error('Merkle tree not generated');
    }
    
    // Create the leaf for this entry
    const leaf = Buffer.from(
      ethers.utils.solidityKeccak256(
        ['address', 'uint256'],
        [address, amount]
      ).slice(2),
      'hex'
    );
    
    // Get the proof
    const proof = this.merkleTree.getProof(leaf);
    
    // Verify the proof
    return this.merkleTree.verify(proof, leaf, this.merkleTree.getRoot());
  }

  /**
   * Find the amount allocated to an address in the whitelist
   * @param address User address
   * @returns Allocated amount or null if not found
   */
  findAddressAllocation(address: string): string | null {
    const normalizedAddress = address.toLowerCase();
    const entry = this.entries.find(e => e.address.toLowerCase() === normalizedAddress);
    return entry ? entry.amount : null;
  }

  /**
   * Get the entire whitelist
   */
  getWhitelist(): WhitelistEntry[] {
    return this.entries;
  }

  /**
   * Check if an address is in the whitelist
   * @param address User address
   * @returns True if the address is in the whitelist
   */
  isWhitelisted(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    return this.entries.some(e => e.address.toLowerCase() === normalizedAddress);
  }
}