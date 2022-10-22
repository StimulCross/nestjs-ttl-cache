import type { DynamicModule } from '@nestjs/common';
import type { TtlCacheAsyncModuleOptions, TtlCacheModuleOptions } from './interfaces/ttl-cache-options.interface';
/**
 * TTL cache module.
 *
 * Must be registered using on of the following static methods:
 * - `register` - Registers the module synchronously.
 * - `registerAsync` - Registers the module asynchronously.
 */
export declare class TtlCacheModule {
    /**
     * Registers the TTL cache module synchronously.
     *
     * @param options TTL cache options.
     */
    static register(options?: TtlCacheModuleOptions): DynamicModule;
    /**
     * Registers the LRU cache module asynchronously.
     *
     * Requires one of the following factories: `useFactory`, `useClass`, or `useExisting`.
     *
     * @param options TTL cache async options.
     */
    static registerAsync(options: TtlCacheAsyncModuleOptions): Promise<DynamicModule>;
    private static _createOptionsProviders;
    private static _createOptionsProvider;
}
//# sourceMappingURL=ttl-cache.module.d.ts.map