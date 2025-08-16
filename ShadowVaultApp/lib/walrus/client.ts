/**
 * Walrus Storage Client
 * Provides encrypted data storage and retrieval using Walrus decentralized storage
 */

export interface WalrusConfig {
  aggregatorUrl: string;
  publisherUrl?: string;
  apiKey?: string;
  network: 'mainnet' | 'testnet';
}

export interface WalrusBlob {
  blobId: string;
  size: number;
  encoding?: string;
  cost?: {
    storage: number;
    computation: number;
  };
}

export interface WalrusResponse {
  newlyCreated?: {
    blobObject: WalrusBlob;
    resourceOperation: {
      RegisterBlobObject: {
        epoch: number;
        storage_cost: number;
      };
    };
  };
  alreadyCertified?: {
    blobObject: WalrusBlob;
    eventOrObject: {
      Event: {
        tx_digest: string;
        event_seq: number;
      };
    };
  };
}

export interface StorageOptions {
  epochs?: number;
  deletable?: boolean;
  metadata?: Record<string, any>;
}

export class WalrusClient {
  private config: WalrusConfig;

  constructor(config: WalrusConfig) {
    this.config = config;
  }

  /**
   * Store encrypted data in Walrus
   */
  async store(data: string | Uint8Array, options?: StorageOptions): Promise<WalrusBlob> {
    const url = new URL('/v1/blobs', this.config.aggregatorUrl);
    
    // Add query parameters if specified
    if (options?.epochs) {
      url.searchParams.set('epochs', options.epochs.toString());
    }
    if (options?.deletable) {
      url.searchParams.set('deletable', 'true');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/octet-stream',
    };

    // Add API key if available
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    let body: BodyInit;
    if (typeof data === 'string') {
      body = new TextEncoder().encode(data);
    } else {
      body = data;
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`Walrus storage failed: ${response.status} ${response.statusText}`);
      }

      const result: WalrusResponse = await response.json();
      
      // Extract blob info from response
      const blobInfo = result.newlyCreated?.blobObject || result.alreadyCertified?.blobObject;
      
      if (!blobInfo) {
        throw new Error('Invalid Walrus response: no blob information');
      }

      return blobInfo;
    } catch (error) {
      console.error('Walrus storage error:', error);
      throw new Error(`Failed to store data in Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve data from Walrus by blob ID
   */
  async retrieve(blobId: string): Promise<Uint8Array> {
    const url = new URL(`/v1/blobs/${blobId}`, this.config.aggregatorUrl);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Blob not found: ${blobId}`);
        }
        throw new Error(`Walrus retrieval failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Walrus retrieval error:', error);
      throw new Error(`Failed to retrieve data from Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve data as string
   */
  async retrieveText(blobId: string): Promise<string> {
    const data = await this.retrieve(blobId);
    return new TextDecoder().decode(data);
  }

  /**
   * Check if a blob exists
   */
  async exists(blobId: string): Promise<boolean> {
    try {
      await this.retrieve(blobId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get blob information without downloading content
   */
  async getBlobInfo(blobId: string): Promise<{ size: number; exists: boolean }> {
    const url = new URL(`/v1/blobs/${blobId}`, this.config.aggregatorUrl);

    try {
      const response = await fetch(url.toString(), {
        method: 'HEAD',
      });

      if (!response.ok) {
        return { size: 0, exists: false };
      }

      const contentLength = response.headers.get('content-length');
      return {
        size: contentLength ? parseInt(contentLength, 10) : 0,
        exists: true,
      };
    } catch (error) {
      return { size: 0, exists: false };
    }
  }
}

// Default configurations for different networks
export const WALRUS_CONFIGS: Record<string, WalrusConfig> = {
  mainnet: {
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    network: 'mainnet',
  },
  testnet: {
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    network: 'testnet',
  },
  devnet: {
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    network: 'testnet',
  },
};

// Export a default client instance
export const walrusClient = new WalrusClient(WALRUS_CONFIGS.testnet);