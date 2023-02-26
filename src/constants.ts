/**
 * Allows you to inject the original TTL cache instance using NestJS @Inject() decorator.
 *
 * @see https://github.com/isaacs/ttlcache
 */
export const TTL_CACHE = 'TtlCacheToken';

/** @internal */
export const TTL_CACHE_OPTIONS = 'TtlCacheOptionsToken';

/** @internal */
export const CACHE_INSTANCES_PROPERTY = '__cache_instances__';

/** @internal */
export const CACHE_INSTANCE_ID_PROPERTY = '__cache_instance_id__';

/** @internal */
export const CACHE_INSTANCE = '__cache__';
