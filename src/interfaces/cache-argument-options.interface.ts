import { type GetOptions, type SetOptions } from '@isaacs/ttlcache';

/**
 * Additional cache options to pass as the last argument to a method decorated with {@link Cached} or
 * {@link CachedAsync}. These options allow control over caching behavior for a specific method call.
 *
 * These options override similar options in {@link CachedDecoratorOptions}, {@link CachedAsyncDecoratorOptions},
 * and {@link TtlCacheOptions}.
 *
 * To enable argument options, set `useArgumentOptions` in {@link CachedDecoratorOptions} or
 * {@link CachedAsyncDecoratorOptions} to `true`. As a result, the last method argument will be treated as cache
 * options.
 *
 * @example
 * ```ts
 * class Test {
 * 		@Cached({ useArgumentOptions: true })
 * 		public getRandomNumber(options?: CacheOptionsArg): number {
 *     		return Math.random();
 * 		}
 * }
 *
 * const testInstance = new Test();
 *
 * const number = testInstance.getRandomNumber({
 *     updateAgeOnGet: true,
 *     ttl: 5000
 * });
 * ```
 */
export interface CacheArgumentOptions extends GetOptions, SetOptions {
	/**
	 * Whether to ignore the cached value.
	 *
	 * Set this to `true` to ignore the cached value and call the original method. The result of the method will
	 * replace the previous value in the cache as usual.
	 */
	ignoreCached?: boolean;

	/**
	 * Enables the decorated method to use the shared cache across multiple class instances for a specific method call.
	 *
	 * This option overrides `useSharedCache` specified in the decorator options. To enable this behavior, you must
	 * set `useArgumentOptions` in {@link CachedDecoratorOptions} or {@link CachedAsyncDecoratorOptions} to `true`.
	 */
	useSharedCache?: boolean;

	/**
	 * Maximum time (in milliseconds) for items to remain in the cache before being considered stale.
	 *
	 * Must be an integer value representing milliseconds, or `Infinity`. Defaults to `undefined`, meaning that a TTL
	 * must be explicitly set for each `set()` call.
	 *
	 * If not specified, defaults to the value provided in {@link CachedDecoratorOptions} or {@link CachedAsyncDecoratorOptions}.
	 */
	ttl?: number;

	/**
	 * Set to `true` to suppress calling the `dispose()` function if the entry key is still accessible within the
	 * cache.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} or {@link TtlCacheOptions}.
	 */
	noDisposeOnSet?: boolean;

	/**
	 * Prevents the TTL from being updated when overwriting an existing cache entry.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} or {@link CachedAsyncDecoratorOptions}.
	 */
	noUpdateTTL?: boolean;

	/**
	 * Updates the age of a cache entry when it is accessed.
	 *
	 * When paired with {@link CacheArgumentOptions#ttl}, the TTL of the entry is updated with the specified value
	 * when retrieving a cached result.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} or {@link CachedAsyncDecoratorOptions}.
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
