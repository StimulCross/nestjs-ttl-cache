"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_INSTANCE = exports.CACHE_INSTANCE_ID_PROPERTY = exports.CACHE_INSTANCES_PROPERTY = exports.TTL_CACHE_OPTIONS = exports.TTL_CACHE = void 0;
/**
 * Allows you to inject the original TTL cache instance using NestJS @Inject() decorator.
 *
 * @see https://github.com/isaacs/ttlcache
 */
exports.TTL_CACHE = 'TtlCacheToken';
/** @internal */
exports.TTL_CACHE_OPTIONS = 'TtlCacheOptionsToken';
/** @internal */
exports.CACHE_INSTANCES_PROPERTY = '__cache_instances__';
/** @internal */
exports.CACHE_INSTANCE_ID_PROPERTY = '__cache_instance_id__';
/** @internal */
exports.CACHE_INSTANCE = '__cache__';
//# sourceMappingURL=ttl-cache.constants.js.map