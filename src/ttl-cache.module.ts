import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { TTL_CACHE_OPTIONS } from './constants';
import {
	type TtlCacheAsyncModuleOptions,
	type TtlCacheModuleOptions,
	type TtlCacheOptions,
	type TtlCacheOptionsFactory
} from './interfaces';
import { TtlCache } from './providers';

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

		return {
			global: options.isGlobal,
			module: TtlCacheModule,
			providers: [optionsProvider, TtlCache],
			exports: [TtlCache]
		};
	}

	/**
	 * Registers the LRU cache module asynchronously.
	 *
	 * Requires one of the following factories: `useFactory`, `useClass`, or `useExisting`.
	 *
	 * @param options TTL cache async options.
	 */
	public static async registerAsync(options: TtlCacheAsyncModuleOptions): Promise<DynamicModule> {
		return {
			global: options.isGlobal,
			imports: options.imports ?? [],
			module: TtlCacheModule,
			providers: [...TtlCacheModule._createOptionsProviders(options), TtlCache],
			exports: [TtlCache]
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
