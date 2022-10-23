import { Inject } from '@nestjs/common';
import type { CachedDecoratorOptions } from '../interfaces/cached-decorator-options.interface';
import type { CacheArgumentOptions } from '../interfaces/cache-argument-options.interface';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY } from '../ttl-cache.constants';
import { isObject } from '../utils/is-object';
import { TtlCache } from '../providers/ttl-cache';
import { wrapCacheKey } from '../utils/wrap-cache-key';

function createCachedFunction(
	target: object,
	propertyKey: string | symbol,
	origFn: Function,
	options: CachedDecoratorOptions
) {
	return function (this: { [CACHE_INSTANCE_ID_PROPERTY]?: number; [CACHE_INSTANCE]: TtlCache }, ...args: unknown[]) {
		const cacheInstanceId = this[CACHE_INSTANCE_ID_PROPERTY] ? `_${this[CACHE_INSTANCE_ID_PROPERTY]}` : '';
		let cacheOptionsArg: CacheArgumentOptions | undefined;

		if (options.useArgumentOptions && args.length > 0) {
			const possibleCacheOptions = args.at(-1);

			if (isObject<CacheArgumentOptions>(possibleCacheOptions)) {
				cacheOptionsArg = possibleCacheOptions;
			}
		}

		const mergedOptions = { ...options, ...cacheOptionsArg };

		let cacheKey = mergedOptions.useSharedCache
			? `${this.constructor.name}.${String(propertyKey)}`
			: `${this.constructor.name}${cacheInstanceId}.${String(propertyKey)}`;

		if (options.hashFunction) {
			cacheKey += `:${options.hashFunction.apply(this, args)}`;
		}

		cacheKey = wrapCacheKey(cacheKey);

		if ((mergedOptions.returnCached ?? true) && this[CACHE_INSTANCE].has(cacheKey)) {
			return this[CACHE_INSTANCE].get(cacheKey, mergedOptions);
		}

		const result: unknown = origFn.apply(this, args);
		this[CACHE_INSTANCE].set(cacheKey, result, mergedOptions);

		return result;
	};
}

/**
 * Decorates a method or getter to apply automatic caching logic. If you need to decorate an async method, use
 * {@link CachedAsync} instead.
 *
 * Takes one argument, which can be either a hash function, a TTL number, or an options object.
 *
 * @example
 * ```ts
 * // Simple application with default options
 * @Cached()
 * public getUserById(id: number) { ... }
 *
 * // TTL overload
 * @Cached(5000)
 * public getUserById(id: number) { ... }
 *
 * // Hash function overload
 * @Cached((id: number) => String(id))
 * public getUserById(id: number) { ... }
 *
 * // Options object overload
 * @Cached({ ttl: 5000, hashFunction: (id: number) => String(id) })
 * public getUserById(id: number) { ... }
 * ```
 */
export function Cached(options?: CachedDecoratorOptions): MethodDecorator;
export function Cached(ttl?: CachedDecoratorOptions['ttl']): MethodDecorator;
export function Cached(hashFunction?: CachedDecoratorOptions['hashFunction']): MethodDecorator;
export function Cached(
	optionsOrHashFunctionOtTtl:
		| CachedDecoratorOptions
		| CachedDecoratorOptions['ttl']
		| CachedDecoratorOptions['hashFunction'] = {}
): MethodDecorator {
	const injectCache = Inject(TtlCache);

	return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor => {
		injectCache(target, CACHE_INSTANCE);
		let options: CachedDecoratorOptions = {};

		if (typeof optionsOrHashFunctionOtTtl === 'object') {
			options = optionsOrHashFunctionOtTtl;
		} else if (typeof optionsOrHashFunctionOtTtl === 'number') {
			options.ttl = optionsOrHashFunctionOtTtl;
		} else if (typeof optionsOrHashFunctionOtTtl === 'function') {
			options.hashFunction = optionsOrHashFunctionOtTtl;
		}

		if (typeof descriptor.value === 'function') {
			descriptor.value = createCachedFunction(target, propertyKey, descriptor.value, options);
		} else if (typeof descriptor.get === 'function') {
			// eslint-disable-next-line @typescript-eslint/unbound-method
			descriptor.get = createCachedFunction(target, propertyKey, descriptor.get, options);
		}

		return descriptor;
	};
}
