import { type CachedDecoratorOptions } from './cached-decorator-options.interface';

/**
 * Options for the {@link CachedAsync} decorator.
 *
 * These options override similar options in {@link TtlCacheOptions} for a specific async method.
 */
export interface CachedAsyncDecoratorOptions extends CachedDecoratorOptions {
	/**
	 * Caches a promise returned by the decorated async method until it is resolved.
	 *
	 * If the decorated method is called multiple times before the promise resolves, the first call will cache
	 * the promise, and all subsequent calls will return the same cached promise instead of creating a new one.
	 *
	 * This behavior is useful for calling rate-limited third-party APIs to avoid exceeding limits or for running
	 * complex database queries to improve performance.
	 *
	 * Once the promise resolves, the result can also be cached. To disable caching of the promise's result,
	 * set `cachePromiseResult` to `false` in {@link CachedAsyncDecoratorOptions}.
	 *
	 * When the promise result is cached, the TTL resets either to the value specified in
	 * {@link CachedAsyncDecoratorOptions} (if specified) or to the value specified in {@link TtlCacheOptions}.
	 * If you want the promise and its result to share the same TTL, set the `noUpdateTTL` option in
	 * {@link CachedAsyncDecoratorOptions} to `true`.
	 *
	 * @default true
	 */
	cachePromise?: boolean;

	/**
	 * Caches the result of a resolved promise.
	 *
	 * When the promise result is cached, the TTL resets to the value specified in {@link CachedAsyncDecoratorOptions},
	 * or to the value specified in {@link TtlCacheOptions}. If you want the promise and its result to share
	 * the same TTL, set the `noUpdateTTL` option in {@link CachedAsyncDecoratorOptions} to `true`.
	 *
	 * @default true
	 */
	cachePromiseResult?: boolean;
}
