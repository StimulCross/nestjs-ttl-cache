import type { CachedAsyncDecoratorOptions } from '../interfaces/cached-async-decorator-options.interface';
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
export declare function CachedAsync(options?: CachedAsyncDecoratorOptions): MethodDecorator;
export declare function CachedAsync(ttl?: CachedAsyncDecoratorOptions['ttl']): MethodDecorator;
export declare function CachedAsync(hashFunction?: CachedAsyncDecoratorOptions['hashFunction']): MethodDecorator;
//# sourceMappingURL=cached-async.decorator.d.ts.map