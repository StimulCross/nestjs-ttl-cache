import type { CachedDecoratorOptions } from '../interfaces/cached-decorator-options.interface';
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
export declare function Cached(options?: CachedDecoratorOptions): MethodDecorator;
export declare function Cached(ttl?: CachedDecoratorOptions['ttl']): MethodDecorator;
export declare function Cached(hashFunction?: CachedDecoratorOptions['hashFunction']): MethodDecorator;
//# sourceMappingURL=cached,decorator.d.ts.map