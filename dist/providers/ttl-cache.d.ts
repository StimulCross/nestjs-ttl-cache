import type { GetOptions, SetOptions } from '@isaacs/ttlcache';
import * as TTLCache from '@isaacs/ttlcache';
/**
 * TTL cache service.
 *
 * Allows you to specify <K, V> (key, value) type parameters.
 */
export declare class TtlCache<K = any, V = any> {
    private readonly _cache;
    constructor(_cache: TTLCache<K, V>);
    /**
     * The total number of items held in the cache at the current moment.
     */
    get size(): number;
    /**
     * Checks if a key is in the cache. Will return `false` if the item is stale, even though it is technically in
     * the cache.
     *
     * @param key The key to check.
     */
    has(key: K): boolean;
    /**
     * Returns a value from the cache.
     *
     * If the key is not found, `get()` will return `undefined`.
     * This can be confusing when setting values specifically to `undefined`, as in `set(key, undefined)`. Use `has()`
     * to determine whether a key is present in the cache at all.
     */
    get<T = unknown>(key: K, options?: GetOptions): T | undefined;
    /**
     * Adds a value to the cache.
     *
     * The third parameter can be either a TTL number, or options object.
     */
    set(key: K, value: V, ttl?: number): this;
    set(key: K, value: V, options?: SetOptions): this;
    /**
     * Deletes a key out of the cache.
     *
     * Returns `true` if the key was deleted, `false` otherwise.
     */
    delete(key: K): boolean;
    /**
     * Clears the cache entirely, throwing away all values.
     */
    clear(): void;
    /**
     * Returns the remaining time before an item expires.
     *
     * Returns `0` if the item is not found in the cache or is already expired.
     */
    getRemainingTTL(key: K): number;
    /**
     * Returns a generator yielding the keys in the cache, from soonest expiring to latest expiring.
     *
     * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
     */
    keys(): Generator<K>;
    /**
     * Returns a generator yielding the values in the cache, from soonest expiring to latest expiring.
     *
     * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
     */
    values(): Generator<V>;
    /**
     * Returns a generator yielding `[key, value]` pairs, from soonest expiring to latest expiring.
     * Items expiring at the same time are walked in insertion order.
     *
     * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
     */
    entries(): Generator<[K, V]>;
    /**
     * Iterator over cache entries.
     *
     * **WARNING:** The iterator does not iterate over immortal items set with `Infinity` TTL.
     */
    [Symbol.iterator](): Iterator<[K, V]>;
}
//# sourceMappingURL=ttl-cache.d.ts.map