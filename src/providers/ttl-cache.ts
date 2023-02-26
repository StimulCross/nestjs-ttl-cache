import { type GetOptions, type SetOptions } from '@isaacs/ttlcache';
import * as TTLCache from '@isaacs/ttlcache';
import { Inject, Injectable } from '@nestjs/common';
import { TTL_CACHE } from '../constants';

/**
 * TTL cache service.
 *
 * Allows you to specify <K, V> (key, value) type parameters.
 */
@Injectable()
export class TtlCache<K = any, V = any> {
	constructor(@Inject(TTL_CACHE) private readonly _cache: TTLCache<K, V>) {}

	/**
	 * The total number of items held in the cache at the current moment.
	 */
	public get size(): number {
		return this._cache.size;
	}

	/**
	 * Checks if a key is in the cache. Will return `false` if the item is stale, even though it is technically in
	 * the cache.
	 *
	 * @param key The key to check.
	 */
	public has(key: K): boolean {
		return this._cache.has(key);
	}

	/**
	 * Returns a value from the cache.
	 *
	 * If the key is not found, `get()` will return `undefined`.
	 * This can be confusing when setting values specifically to `undefined`, as in `set(key, undefined)`. Use `has()`
	 * to determine whether a key is present in the cache at all.
	 */
	public get<T = unknown>(key: K, options?: GetOptions): T | undefined {
		return this._cache.get<T>(key, options);
	}

	/**
	 * Adds a value to the cache.
	 *
	 * The third parameter can be either a TTL number, or options object.
	 */
	public set(key: K, value: V, ttl?: number): this;
	public set(key: K, value: V, options?: SetOptions): this;
	public set(key: K, value: V, optionsOrTtl?: SetOptions | number): this {
		optionsOrTtl = typeof optionsOrTtl === 'number' ? { ttl: optionsOrTtl } : optionsOrTtl;
		this._cache.set(key, value, optionsOrTtl);
		return this;
	}

	/**
	 * Deletes a key out of the cache.
	 *
	 * Returns `true` if the key was deleted, `false` otherwise.
	 */
	public delete(key: K): boolean {
		return this._cache.delete(key);
	}

	/**
	 * Clears the cache entirely, throwing away all values.
	 */
	public clear(): void {
		return this._cache.clear();
	}

	/**
	 * Returns the remaining time before an item expires.
	 *
	 * Returns `0` if the item is not found in the cache or is already expired.
	 */
	public getRemainingTTL(key: K): number {
		return this._cache.getRemainingTTL(key);
	}

	/**
	 * Returns a generator yielding the keys in the cache, from soonest expiring to latest expiring.
	 *
	 * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
	 */
	public *keys(): Generator<K> {
		yield* this._cache.keys();
	}

	/**
	 * Returns a generator yielding the values in the cache, from soonest expiring to latest expiring.
	 *
	 * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
	 */
	public *values(): Generator<V> {
		yield* this._cache.values();
	}

	/**
	 * Returns a generator yielding `[key, value]` pairs, from soonest expiring to latest expiring.
	 * Items expiring at the same time are walked in insertion order.
	 *
	 * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
	 */
	public *entries(): Generator<[K, V]> {
		yield* this._cache.entries();
	}

	/**
	 * Iterator over cache entries.
	 *
	 * **WARNING:** The iterator does not iterate over immortal items set with `Infinity` TTL.
	 */
	[Symbol.iterator](): Iterator<[K, V]> {
		return this.entries();
	}
}
