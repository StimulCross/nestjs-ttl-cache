import * as TTLCache from '@isaacs/ttlcache';
import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { TTL_CACHE, TTL_CACHE_OPTIONS } from './constants';
import {
	type TtlCacheAsyncModuleOptions,
	type TtlCacheModuleOptions,
	type TtlCacheOptions,
	type TtlCacheOptionsFactory
} from './interfaces';

/**
 * TTL cache module.
 *
 * Must be registered using on of the following static methods:
 * - `register` - Registers the module synchronously.
 * - `registerAsync` - Registers the module asynchronously.
 */
@Module({})
export class TtlCacheModule {
	/**
	 * Registers the TTL cache module synchronously.
	 *
	 * @param options TTL cache options.
	 */
	public static register(options: TtlCacheModuleOptions = {}): DynamicModule {
		const optionsProvider: Provider<TtlCacheModuleOptions> = {
			provide: TTL_CACHE_OPTIONS,
			useValue: options
		};

		const ttlCache: Provider<TTLCache<any, any>> = {
			provide: TTL_CACHE,
			useValue: new TTLCache(options)
		};

		return {
			global: options.isGlobal,
			module: TtlCacheModule,
			providers: [optionsProvider, ttlCache],
			exports: [TTL_CACHE]
		};
	}

	/**
	 * Registers the LRU cache module asynchronously.
	 *
	 * Requires one of the following factories: `useFactory`, `useClass`, or `useExisting`.
	 *
	 * @param options TTL cache async options.
	 */
	public static registerAsync(options: TtlCacheAsyncModuleOptions): DynamicModule {
		const ttlCache: Provider<TTLCache<any, any>> = {
			provide: TTL_CACHE,
			useFactory: (cacheOptions: TtlCacheOptions) => new TTLCache(cacheOptions),
			inject: [TTL_CACHE_OPTIONS]
		};

		return {
			global: options.isGlobal,
			imports: options.imports ?? [],
			module: TtlCacheModule,
			providers: [...TtlCacheModule._createOptionsProviders(options), ttlCache],
			exports: [TTL_CACHE]
		};
	}

	private static _createOptionsProviders(options: TtlCacheAsyncModuleOptions): Provider[] {
		if (options.useExisting ?? options.useFactory) {
			return [TtlCacheModule._createOptionsProvider(options)];
		}

		return [
			TtlCacheModule._createOptionsProvider(options),
			{
				provide: options.useClass!,
				useClass: options.useClass!
			}
		];
	}

	private static _createOptionsProvider(options: TtlCacheAsyncModuleOptions): Provider<TtlCacheOptions> {
		if (options.useFactory) {
			return {
				provide: TTL_CACHE_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject ?? []
			};
		}

		return {
			provide: TTL_CACHE_OPTIONS,
			useFactory: async (factory: TtlCacheOptionsFactory) => await factory.createTtlCacheOptions(),
			inject: [options.useExisting ?? options.useClass!]
		};
	}
}
