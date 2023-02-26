import { type ModuleMetadata, type Type } from '@nestjs/common';
import { type TtlCacheOptionsFactory } from './ttl-cache-options-factory.interface';
import { type TtlCacheOptions } from './ttl-cache-options.interface';

/**
 * Addition module options.
 */
export interface TtlCacheModuleExtraOptions {
	isGlobal?: boolean;
}

/**
 * TTL cache module options.
 */
export type TtlCacheModuleOptions = TtlCacheModuleExtraOptions & TtlCacheOptions;

/**
 * TTL cache module async options.
 */
export interface TtlCacheAsyncModuleOptions extends TtlCacheModuleExtraOptions, Pick<ModuleMetadata, 'imports'> {
	/**
	 * Dependencies that a Factory may inject.
	 */
	inject?: any[];

	/**
	 * Injection token resolving to a class that will be instantiated as a provider.
	 *
	 * The class must implement the corresponding interface.
	 */
	useClass?: Type<TtlCacheOptionsFactory>;

	/**
	 * Injection token resolving to an existing provider.
	 *
	 * The provider must implement the corresponding interface.
	 */
	useExisting?: Type<TtlCacheOptionsFactory>;

	/**
	 * Function returning options (or a Promise resolving to options) to configure the cache module.
	 */
	useFactory?: (...args: any[]) => Promise<TtlCacheOptions> | TtlCacheOptions;
}
