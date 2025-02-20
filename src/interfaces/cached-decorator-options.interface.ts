import { type GetOptions, type SetOptions } from '@isaacs/ttlcache';

/**
 * Options for the {@link Cached} decorator.
 *
 * These options will override similar options in {@link TtlCacheOptions} for a specific method or getter.
 */
export interface CachedDecoratorOptions extends GetOptions, SetOptions {
	/**
	 * Custom hash function.
	 *
	 * If the method has arguments, you can use them to create a custom hash key.
	 *
	 * @param args Method arguments used to create the cache key. Must match the decorated method's signature.
	 */
	hashFunction?: (...args: any[]) => string;

	/**
	 * Allows the use of {@link CacheArgumentOptions} passed as the last argument in the decorated method
	 * to control caching behavior for a specific method call.
	 *
	 * @default false
	 */

	useArgumentOptions?: boolean;

	/**
	 * Enables the decorated method to use a shared cache across all instances of the class.
	 *
	 * By default, this behavior is applied unless the class is decorated with the {@link IsolatedCache} decorator.
	 * If the {@link IsolatedCache} decorator is applied but you want certain methods to use a shared cache
	 * across all class instances, set this option to `true` to enforce the shared cache behavior at the method level.
	 *
	 * @default false
	 */
	useSharedCache?: boolean;

	/**
	 * Maximum time (in milliseconds) for entries in the cache to live before they are considered stale.
	 *
	 * Must be an integer value representing milliseconds, or `Infinity`. Defaults to `undefined`, meaning TTL must
	 * be explicitly set either in {@link TtlCacheOptions}, {@link CacheArgumentOptions}, or for each `set()` call.
	 *
	 * When paired with {@link CachedDecoratorOptions#updateAgeOnGet} set to `true`, the TTL of the entry
	 * will be updated when returning the cached result.
	 *
	 * Defaults to the value specified in {@link TtlCacheOptions}.
	 */
	ttl?: number;

	/**
	 * Suppresses calling the `dispose()` function if the entry key is still accessible within the cache.
	 *
	 * Defaults to the value specified in {@link TtlCacheOptions}.
	 */
	noDisposeOnSet?: boolean;

	/**
	 * Prevents the TTL from being updated when an existing entry is overwritten.
	 *
	 * Defaults to the value specified in {@link TtlCacheOptions}.
	 */
	noUpdateTTL?: boolean;

	/**
	 * Updates the age of a cache entry when it is accessed.
	 *
	 * When paired with {@link CachedDecoratorOptions#ttl}, the TTL of the entry is updated with the specified value
	 * when retrieving a cached result.
	 *
	 * This can simulate a "least-recently used" (LRU) algorithm by refreshing the TTL of entries as they are used.
	 *
	 * Defaults to the value specified in {@link TtlCacheOptions}.
	 */
	updateAgeOnGet?: boolean;

	/**
	 * Deletes an entry if it is found to have exceeded its TTL before the `setTimeout` timer has fired to trigger
	 * expiration.
	 *
	 * Defaults to the value specified in {@link TtlCacheOptions}.
	 */
	checkAgeOnGet?: boolean;
}
