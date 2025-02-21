import type * as TTLCache from '@isaacs/ttlcache';
import { Inject, Logger } from '@nestjs/common';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY, TTL_CACHE } from '../constants';
import { type CacheArgumentOptions, type CachedAsyncDecoratorOptions } from '../interfaces';
import { isObject, wrapCacheKey } from '../utils';

const logger = new Logger('TtlCache', { timestamp: true });

function createCachedAsyncFunction(
	target: object,
	propertyKey: string | symbol,
	origFn: Function,
	options: CachedAsyncDecoratorOptions
) {
	return async function (
		this: { [CACHE_INSTANCE_ID_PROPERTY]?: number; [CACHE_INSTANCE]?: TTLCache<unknown, unknown> },
		...args: unknown[]
	) {
		if (!this[CACHE_INSTANCE]) {
			logger.warn(
				`Failed to get the cache instance in method ${target.constructor.name}.${String(
					propertyKey
				)}(). This may be because the class using the @CachedAsync decorator has not been registered as a provider in the NestJS module, and therefore is not available in the DI container. This method's results will not be cached.`
			);
			return await (origFn.apply(this, args) as Promise<unknown>);
		}

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

		if (!mergedOptions.ignoreCached && this[CACHE_INSTANCE].has(cacheKey)) {
			const cachedVal = this[CACHE_INSTANCE].get(cacheKey, mergedOptions);

			if (cachedVal instanceof Promise) {
				return (await cachedVal) as unknown;
			}

			return cachedVal;
		}

		const originalPromise = origFn.apply(this, args) as Promise<unknown>;

		if (mergedOptions.cachePromise ?? true) {
			this[CACHE_INSTANCE].set(cacheKey, originalPromise, mergedOptions);
		}

		const result = await originalPromise;

		if (mergedOptions.cachePromiseResult ?? true) {
			this[CACHE_INSTANCE].set(cacheKey, result, mergedOptions);
		} else {
			this[CACHE_INSTANCE].delete(cacheKey);
		}

		return result;
	};
}

/**
 * Decorates an async method to apply automatic caching logic.
 *
 * Takes one argument, which can be either a hash function, a TTL number, or an options object.
 *
 * @example
 * ```ts
 * // Simple application with default options
 * @CachedAsync()
 * public getUserById(id: number) { ... }
 *
 * // TTL overload
 * @CachedAsync(5000)
 * public getUserById(id: number) { ... }
 *
 * // Hash function overload
 * @CachedAsync((id: number) => String(id))
 * public getUserById(id: number) { ... }
 *
 * // Options object overload
 * @CachedAsync({ ttl: 5000, hashFunction: (id: number) => String(id) })
 * public getUserById(id: number) { ... }
 * ```
 */
export function CachedAsync(options?: CachedAsyncDecoratorOptions): MethodDecorator;
export function CachedAsync(ttl?: CachedAsyncDecoratorOptions['ttl']): MethodDecorator;
export function CachedAsync(hashFunction?: CachedAsyncDecoratorOptions['hashFunction']): MethodDecorator;
export function CachedAsync(
	optionsOrHashFunctionOrTtl:
		| CachedAsyncDecoratorOptions
		| CachedAsyncDecoratorOptions['ttl']
		| CachedAsyncDecoratorOptions['hashFunction'] = {}
): MethodDecorator {
	const injectCache = Inject(TTL_CACHE);

	return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor => {
		injectCache(target, CACHE_INSTANCE);
		let options: CachedAsyncDecoratorOptions = {};

		if (typeof optionsOrHashFunctionOrTtl === 'object') {
			options = optionsOrHashFunctionOrTtl;
		} else if (typeof optionsOrHashFunctionOrTtl === 'number') {
			options.ttl = optionsOrHashFunctionOrTtl;
		} else if (typeof optionsOrHashFunctionOrTtl === 'function') {
			options.hashFunction = optionsOrHashFunctionOrTtl;
		}

		if (typeof descriptor.value === 'function') {
			descriptor.value = createCachedAsyncFunction(target, propertyKey, descriptor.value, options);
		}

		return descriptor;
	};
}
