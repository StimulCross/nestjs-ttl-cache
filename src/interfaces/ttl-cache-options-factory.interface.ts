import { type TtlCacheOptions } from './ttl-cache-options.interface';

/**
 * Class with factory method to create {@link TtlCacheOptions}.
 */
export interface TtlCacheOptionsFactory {
	/**
	 * Factory method that creates {@link TtlCacheOptions}.
	 */
	createTtlCacheOptions(): Promise<TtlCacheOptions> | TtlCacheOptions;
}
