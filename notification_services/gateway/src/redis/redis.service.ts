import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ms } from './lib/utils';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  //Idempotency check
  async getIdempotencyResponse(requestId: string): Promise<any> {
    return await this.cacheManager.get(`idempotency:${requestId}`);
  }

  //   set idempotency response
  async setIdempotencyResponse(
    requestId: string,
    response: any,
    ttl: number = 86400,
  ): Promise<void> {
    await this.cacheManager.set(`idempotency:${requestId}`, response, ttl);
  }

  //   Rate limiting
  async incrementRateLimit(userId: string, window: string): Promise<number> {
    const key = `rate_limit:${userId}:${window}`;
    let current = (await this.cacheManager.get<number>(key)) || 0;
    const newValue = current + 1;

    if (current === 0) {
      await this.cacheManager.set(key, newValue, ms(1, 'h'));
    } else {
      await this.cacheManager.set(key, newValue);
    }

    return newValue;
  }

  async getRateLimit(userId: string, window: string): Promise<number> {
    const key = `rate_limit:${userId}:${window}`;
    const current = (await this.cacheManager.get<number>(key)) || 0;
    return current;
  }

  //   status caching
  async cacheStatus(
    requestId: string,
    status: any,
    ttl = 86400,
  ): Promise<void> {
    try {
      await this.cacheManager.set(`status:${requestId}`, status, ms(1, 'h'));
      console.log('Status cached successfully');
    } catch (error) {
      console.error('Error caching status:', error);
    }
  }

  async getCachedStatus(requestId: string): Promise<any> {
    return await this.cacheManager.get(`status:${requestId}`);
  }

  //   user data caching
  async cacheUser(userId: string, data: any, ttl = 86400): Promise<void> {
    await this.cacheManager.set(`user:${userId}`, data, ms(1, 'd'));
  }

  async getCachedUser(userId: string): Promise<any> {
    return await this.cacheManager.get(`user:${userId}`);
  }

  //   template data caching
  async cacheTemplate(
    templateCode: string,
    data: any,
    ttl = 86400,
  ): Promise<void> {
    await this.cacheManager.set(`template:${templateCode}`, data, ms(3, 'd'));
  }

  async getCachedTemplate(templateCode: string): Promise<any> {
    return await this.cacheManager.get(`template:${templateCode}`);
  }
}
