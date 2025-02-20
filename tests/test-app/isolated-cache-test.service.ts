import { Injectable, Scope } from '@nestjs/common';
import { CachedAsync, IsolatedCache, Cached, CacheArgumentOptions } from '../../src';
import { CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../../src/constants';

@Injectable({ scope: Scope.TRANSIENT })
@IsolatedCache()
export class IsolatedCacheTestService {
	declare static [CACHE_INSTANCES_PROPERTY]: number;
	declare [CACHE_INSTANCE_ID_PROPERTY]: number;

	@Cached({ ttl: 100 })
	public getRandomNumber(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@Cached({ ttl: 100, useSharedCache: true })
	public getRandomNumberShared(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@Cached({ ttl: 100, useArgumentOptions: true })
	public getRandomNumberWithOptions(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 100 })
	public async getRandomNumberAsync(_options?: CacheArgumentOptions): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100, useSharedCache: true })
	public async getRandomNumberAsyncShared(): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100, useArgumentOptions: true })
	public async getRandomNumberAsyncWithOptions(_options?: CacheArgumentOptions): Promise<number> {
		return Math.random();
	}
}
