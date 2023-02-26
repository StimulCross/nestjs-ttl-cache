import * as TTLCache from '@isaacs/ttlcache';
import { type SetOptions } from '@isaacs/ttlcache';
import { Inject, Injectable } from '@nestjs/common';
import { TTL_CACHE_OPTIONS } from '../constants';
import { TtlCacheOptions } from '../interfaces';

/**
 * TTL cache service.
 *
 * Allows you to specify <K, V> (key, value) type parameters.
 */
@Injectable()
export class TtlCache<K = any, V = any> extends TTLCache<K, V> {
	/** @internal */
	constructor(@Inject(TTL_CACHE_OPTIONS) private readonly _options: TtlCacheOptions) {
		super(_options);
	}

	/**
	 * Adds a value to the cache.
	 *
	 * The third parameter can be either a TTL number, or options object.
	 */
	public override set(key: K, value: V, ttl?: number): this;
	public override set(key: K, value: V, options?: SetOptions): this;
	public override set(key: K, value: V, optionsOrTtl?: SetOptions | number): this {
		optionsOrTtl = typeof optionsOrTtl === 'number' ? { ttl: optionsOrTtl } : optionsOrTtl;
		super.set(key, value, optionsOrTtl);
		return this;
	}
}
