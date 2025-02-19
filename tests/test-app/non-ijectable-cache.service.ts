import { CachedAsync } from '../../src';
import { Cached } from '../../src';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NonInjectableCacheService {
	@Cached({ ttl: 100 })
	public getRandomNumber(): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 100 })
	public async getRandomNumberAsync(): Promise<number> {
		return Math.random();
	}
}
