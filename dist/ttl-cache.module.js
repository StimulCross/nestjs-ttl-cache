"use strict";
var TtlCacheModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtlCacheModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const TTLCache = require("@isaacs/ttlcache");
const ttl_cache_constants_1 = require("./ttl-cache.constants");
const ttl_cache_1 = require("./providers/ttl-cache");
/**
 * TTL cache module.
 *
 * Must be registered using on of the following static methods:
 * - `register` - Registers the module synchronously.
 * - `registerAsync` - Registers the module asynchronously.
 */
let TtlCacheModule = TtlCacheModule_1 = class TtlCacheModule {
    /**
     * Registers the TTL cache module synchronously.
     *
     * @param options TTL cache options.
     */
    static register(options = {}) {
        const optionsProvider = {
            provide: ttl_cache_constants_1.TTL_CACHE_OPTIONS,
            useValue: options
        };
        const ttlCacheProvider = {
            provide: ttl_cache_constants_1.TTL_CACHE,
            useValue: new TTLCache(options)
        };
        return {
            global: options.isGlobal,
            module: TtlCacheModule_1,
            providers: [optionsProvider, ttlCacheProvider, ttl_cache_1.TtlCache],
            exports: [ttlCacheProvider, ttl_cache_1.TtlCache]
        };
    }
    /**
     * Registers the LRU cache module asynchronously.
     *
     * Requires one of the following factories: `useFactory`, `useClass`, or `useExisting`.
     *
     * @param options TTL cache async options.
     */
    static registerAsync(options) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const ttlCacheProvider = {
                provide: ttl_cache_constants_1.TTL_CACHE,
                useFactory: (opts) => new TTLCache(opts),
                inject: [ttl_cache_constants_1.TTL_CACHE_OPTIONS]
            };
            return {
                global: options.isGlobal,
                imports: (_a = options.imports) !== null && _a !== void 0 ? _a : [],
                module: TtlCacheModule_1,
                providers: [...TtlCacheModule_1._createOptionsProviders(options), ttlCacheProvider, ttl_cache_1.TtlCache],
                exports: [ttlCacheProvider, ttl_cache_1.TtlCache]
            };
        });
    }
    static _createOptionsProviders(options) {
        if (options.useExisting || options.useFactory) {
            return [TtlCacheModule_1._createOptionsProvider(options)];
        }
        return [
            TtlCacheModule_1._createOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass
            }
        ];
    }
    static _createOptionsProvider(options) {
        var _a, _b;
        if (options.useFactory) {
            return {
                provide: ttl_cache_constants_1.TTL_CACHE_OPTIONS,
                useFactory: options.useFactory,
                inject: (_a = options.inject) !== null && _a !== void 0 ? _a : []
            };
        }
        return {
            provide: ttl_cache_constants_1.TTL_CACHE_OPTIONS,
            useFactory: (factory) => tslib_1.__awaiter(this, void 0, void 0, function* () { return yield factory.createTtlCacheOptions(); }),
            inject: [(_b = options.useExisting) !== null && _b !== void 0 ? _b : options.useClass]
        };
    }
};
TtlCacheModule = TtlCacheModule_1 = tslib_1.__decorate([
    (0, common_1.Module)({})
], TtlCacheModule);
exports.TtlCacheModule = TtlCacheModule;
//# sourceMappingURL=ttl-cache.module.js.map