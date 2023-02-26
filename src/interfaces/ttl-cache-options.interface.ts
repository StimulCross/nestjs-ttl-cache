import { type Options } from '@isaacs/ttlcache';

/**
 * TTL cache options passed directly to the underlying TTLCache instance.
 */
export type TtlCacheOptions<K = any, V = any> = Options<K, V>;
