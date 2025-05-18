/**
 * Storage utilities for persistent data storage across platforms
 * 
 * This provides a unified API for storage operations that works in
 * browser environments (localStorage) and React Native (AsyncStorage).
 */

/**
 * Storage interface that abstracts the underlying storage mechanism
 */
export interface Storage {
  /**
   * Store a value with the specified key
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   */
  setItem(key: string, value: any): Promise<void>;
  
  /**
   * Retrieve a value by key
   * @param key Storage key
   * @returns The stored value, or null if not found
   */
  getItem<T>(key: string): Promise<T | null>;
  
  /**
   * Remove an item from storage
   * @param key Storage key
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * Clear all stored items
   */
  clear(): Promise<void>;
  
  /**
   * Get all keys in storage
   * @returns Array of storage keys
   */
  getAllKeys(): Promise<string[]>;
}

/**
 * Browser storage implementation using localStorage
 */
class BrowserStorage implements Storage {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error storing data in localStorage:', error);
    }
  }
  
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // If parsing fails, return as string
        return value as unknown as T;
      }
    } catch (error) {
      console.error('Error retrieving data from localStorage:', error);
      return null;
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data from localStorage:', error);
    }
  }
  
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
  
  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting keys from localStorage:', error);
      return [];
    }
  }
}

/**
 * In-memory storage implementation for fallback
 */
class MemoryStorage implements Storage {
  private storage: Map<string, string> = new Map();
  
  async setItem(key: string, value: any): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.storage.set(key, serialized);
  }
  
  async getItem<T>(key: string): Promise<T | null> {
    const value = this.storage.get(key);
    if (value === undefined) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      // If parsing fails, return as string
      return value as unknown as T;
    }
  }
  
  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
  
  async clear(): Promise<void> {
    this.storage.clear();
  }
  
  async getAllKeys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

/**
 * Create a storage instance based on the current environment
 */
export function createStorage(): Storage {
  // Check if we're in a browser environment with localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    return new BrowserStorage();
  }
  
  // Fallback to in-memory storage
  return new MemoryStorage();
}

// Export a singleton instance
export const storage = createStorage();