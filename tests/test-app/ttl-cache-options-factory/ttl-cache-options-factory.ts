import { Injectable } from '@nestjs/common';
import { type TtlCacheOptionsFactory, type TtlCacheOptions } from '../../../src';

@Injectable()
export class TtlCacheFactory implements TtlCacheOptionsFactory {
	async createTtlCacheOptions(): Promise<TtlCacheOptions> {
		return { max: 10_000, ttl: 50_000 };
	}
}
