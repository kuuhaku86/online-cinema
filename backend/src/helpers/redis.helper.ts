import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisHelper {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, JSON.stringify(data), ttl);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const dataJson = await this.cacheManager.get<string>(key);

    if (!dataJson) {
      return undefined;
    }

    try {
      return JSON.parse(dataJson) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for key: ${key}`, error);
      return undefined;
    }
  }
}
