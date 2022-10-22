"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedAsync = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const ttl_cache_constants_1 = require("../ttl-cache.constants");
const is_object_1 = require("../utils/is-object");
const ttl_cache_1 = require("../providers/ttl-cache");
function createCachedAsyncFunction(target, propertyKey, origFn, options) {
    return function (...args) {
        var _a, _b, _c;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const cacheInstanceId = this[ttl_cache_constants_1.CACHE_INSTANCE_ID_PROPERTY] ? `_${this[ttl_cache_constants_1.CACHE_INSTANCE_ID_PROPERTY]}` : '';
            let cacheOptionsArg;
            if (options.useArgumentOptions && args.length > 0) {
                const possibleCacheOptions = args.at(-1);
                if ((0, is_object_1.isObject)(possibleCacheOptions)) {
                    cacheOptionsArg = possibleCacheOptions;
                }
            }
            const mergedOptions = Object.assign(Object.assign({}, options), cacheOptionsArg);
            let cacheKey = mergedOptions.useSharedCache
                ? `${this.constructor.name}.${String(propertyKey)}`
                : `${this.constructor.name}${cacheInstanceId}.${String(propertyKey)}`;
            if (options.hashFunction) {
                cacheKey += `:${options.hashFunction.apply(this, args)}`;
            }
            if (((_a = mergedOptions.returnCached) !== null && _a !== void 0 ? _a : true) && this[ttl_cache_constants_1.CACHE_INSTANCE].has(cacheKey)) {
                const cachedVal = this[ttl_cache_constants_1.CACHE_INSTANCE].get(cacheKey, mergedOptions);
                if (cachedVal instanceof Promise) {
                    return (yield cachedVal);
                }
                return cachedVal;
            }
            const originalPromise = origFn.apply(this, args);
            if ((_b = mergedOptions.cachePromise) !== null && _b !== void 0 ? _b : true) {
                this[ttl_cache_constants_1.CACHE_INSTANCE].set(cacheKey, originalPromise, mergedOptions);
            }
            const result = yield originalPromise;
            if ((_c = mergedOptions.cachePromiseResult) !== null && _c !== void 0 ? _c : true) {
                this[ttl_cache_constants_1.CACHE_INSTANCE].set(cacheKey, result, mergedOptions);
            }
            else {
                this[ttl_cache_constants_1.CACHE_INSTANCE].delete(cacheKey);
            }
            return result;
        });
    };
}
function CachedAsync(optionsOrHashFunctionOrTtl = {}) {
    const injectCache = (0, common_1.Inject)(ttl_cache_1.TtlCache);
    return (target, propertyKey, descriptor) => {
        injectCache(target, ttl_cache_constants_1.CACHE_INSTANCE);
        let options = {};
        if (typeof optionsOrHashFunctionOrTtl === 'object') {
            options = optionsOrHashFunctionOrTtl;
        }
        else if (typeof optionsOrHashFunctionOrTtl === 'number') {
            options.ttl = optionsOrHashFunctionOrTtl;
        }
        else if (typeof optionsOrHashFunctionOrTtl === 'function') {
            options.hashFunction = optionsOrHashFunctionOrTtl;
        }
        if (typeof descriptor.value === 'function') {
            descriptor.value = createCachedAsyncFunction(target, propertyKey, descriptor.value, options);
        }
        return descriptor;
    };
}
exports.CachedAsync = CachedAsync;
//# sourceMappingURL=cached-async.decorator.js.map