import type { GetOptions, SetOptions } from '@isaacs/ttlcache';
/**
 * Additional cache options to pass as the last argument to the method decorated with {@link Cached} /
 * {@link CachedAsync} decorator to be able to control caching behavior for one specific method call.
 *
 * These options will override similar options in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}
 * and {@link LruCacheClientOptions}.
 *
 * To enable argument options usage, set the `useArgumentOptions` in the {@link CachedDecoratorOptions} /
 * {@link CachedAsyncDecoratorOptions} to `true`. As the result, the last method argument will be treated as the cache
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
     * Whether to return the cached value.
     *
     * Set this to `false` to ignore cached value and call the original method. The resulting value will replace the
     * previous one in the cache as usual.
     *
     * @default true
     */
    returnCached?: boolean;
    /**
     * Makes the decorated method to use the shared cache across multiple class instances for one specific method call.
     *
     * This overrides `useSharedCache` specified in decorator options. To make this option work you must set
     * `useArgumentOptions` in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions} to `true`.
     */
    useSharedCache?: boolean;
    /**
     * Max time in milliseconds for items to live in cache before they are considered stale.
     *
     * Note that stale items are NOT preemptively removed by default, and MAY live in the cache, contributing to max,
     * long after they have expired.
     *
     * Must be an integer number of ms, or `Infinity`. Defaults to `undefined`, meaning that a TTL must be set
     * explicitly for each `set()`.
     *
     * Defaults to the value specified in the {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
     */
    ttl?: number;
    /**
     * Set to `true` to suppress calling the `dispose()` function if the entry key is still accessible within the cache.
     *
     * Defaults to the value specified in the {@link CachedDecoratorOptions} or {@link TtlCacheOptions}
     */
    noDisposeOnSet?: boolean;
    /**
     * Do not update the TTL when overwriting an existing item.
     *
     * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
     */
    noUpdateTTL?: boolean;
    /**
     * Whether the age of an entry should be updated on `has()`.
     *
     * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
     */
    updateAgeOnGet?: boolean;
}
//# sourceMappingURL=cache-argument-options.interface.d.ts.map