import type { Options } from '@isaacs/ttlcache';
import type { ModuleMetadata, Type } from '@nestjs/common';
/**
 * Addition module options.
 */
export interface TtlCacheModuleExtraOptions {
    isGlobal?: boolean;
}
/**
 * TTL cache options passed directly to the underlying TTLCache instance.
 */
export declare type TtlCacheOptions<K = any, V = any> = Options<K, V>;
/**
 * Class with factory method to create {@link TtlCacheOptions}.
 */
export interface TtlCacheOptionsFactory {
    /**
     * Factory method that creates {@link TtlCacheOptions}.
     */
    createTtlCacheOptions(): Promise<TtlCacheOptions> | TtlCacheOptions;
}
/**
 * TTL cache module options.
 */
export declare type TtlCacheModuleOptions = TtlCacheModuleExtraOptions & TtlCacheOptions;
/**
 * TTL cache module async options.
 */
export interface TtlCacheAsyncModuleOptions extends TtlCacheModuleExtraOptions, Pick<ModuleMetadata, 'imports'> {
    /**
     * Dependencies that a Factory may inject.
     */
    inject?: any[];
    /**
     * Injection token resolving to a class that will be instantiated as a provider.
     *
     * The class must implement the corresponding interface.
     */
    useClass?: Type<TtlCacheOptionsFactory>;
    /**
     * Injection token resolving to an existing provider.
     *
     * The provider must implement the corresponding interface.
     */
    useExisting?: Type<TtlCacheOptionsFactory>;
    /**
     * Function returning options (or a Promise resolving to options) to configure the cache module.
     */
    useFactory?: (...args: any[]) => Promise<TtlCacheOptions> | TtlCacheOptions;
}
//# sourceMappingURL=ttl-cache-options.interface.d.ts.map