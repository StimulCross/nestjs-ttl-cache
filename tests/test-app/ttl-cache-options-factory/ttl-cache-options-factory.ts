import { Injectable } from '@nestjs/common';
import { type TtlCacheOptionsFactory, type TtlCacheOptions } from '../../../src';

@Injectable()
export class TtlCacheFactory implements TtlCacheOptionsFactory {
	async createTtlCacheOptions(): Promise<TtlCacheOptions> {
		return { max: 10000, ttl: 50000 };
	}
}
