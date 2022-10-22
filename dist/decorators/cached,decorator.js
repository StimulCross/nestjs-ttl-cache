"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cached = void 0;
const common_1 = require("@nestjs/common");
const ttl_cache_constants_1 = require("../ttl-cache.constants");
const is_object_1 = require("../utils/is-object");
const ttl_cache_1 = require("../providers/ttl-cache");
function createCachedFunction(target, propertyKey, origFn, options) {
    return function (...args) {
        var _a;
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
            return this[ttl_cache_constants_1.CACHE_INSTANCE].get(cacheKey, mergedOptions);
        }
        const result = origFn.apply(this, args);
        this[ttl_cache_constants_1.CACHE_INSTANCE].set(cacheKey, result, mergedOptions);
        return result;
    };
}
function Cached(optionsOrHashFunctionOtTtl = {}) {
    const injectCache = (0, common_1.Inject)(ttl_cache_1.TtlCache);
    return (target, propertyKey, descriptor) => {
        injectCache(target, ttl_cache_constants_1.CACHE_INSTANCE);
        let options = {};
        if (typeof optionsOrHashFunctionOtTtl === 'object') {
            options = optionsOrHashFunctionOtTtl;
        }
        else if (typeof optionsOrHashFunctionOtTtl === 'number') {
            options.ttl = optionsOrHashFunctionOtTtl;
        }
        else if (typeof optionsOrHashFunctionOtTtl === 'function') {
            options.hashFunction = optionsOrHashFunctionOtTtl;
        }
        if (typeof descriptor.value === 'function') {
            descriptor.value = createCachedFunction(target, propertyKey, descriptor.value, options);
        }
        else if (typeof descriptor.get === 'function') {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            descriptor.get = createCachedFunction(target, propertyKey, descriptor.get, options);
        }
        return descriptor;
    };
}
exports.Cached = Cached;
//# sourceMappingURL=cached,decorator.js.map