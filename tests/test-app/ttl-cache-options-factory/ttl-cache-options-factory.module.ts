import { Module } from '@nestjs/common';
import { TtlCacheFactory } from './ttl-cache-options-factory';

@Module({
	providers: [TtlCacheFactory],
	exports: [TtlCacheFactory],
})
export class TtlCacheOptionsFactoryModule {}
