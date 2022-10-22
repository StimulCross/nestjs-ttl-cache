import { Injectable } from '@nestjs/common';
import type { TtlCacheOptionsFactory, TtlCacheOptions } from '../../../src/interfaces/ttl-cache-options.interface';

@Injectable()
export class TtlCacheFactory implements TtlCacheOptionsFactory {
	async createTtlCacheOptions(): Promise<TtlCacheOptions> {
		return { max: 10000, ttl: 50000 };
	}
}
