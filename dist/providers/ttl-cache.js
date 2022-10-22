"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtlCache = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const TTLCache = require("@isaacs/ttlcache");
const ttl_cache_constants_1 = require("../ttl-cache.constants");
/**
 * TTL cache service.
 *
 * Allows you to specify <K, V> (key, value) type parameters.
 */
let TtlCache = class TtlCache {
    constructor(_cache) {
        this._cache = _cache;
    }
    /**
     * The total number of items held in the cache at the current moment.
     */
    get size() {
        return this._cache.size;
    }
    /**
     * Checks if a key is in the cache. Will return `false` if the item is stale, even though it is technically in
     * the cache.
     *
     * @param key The key to check.
     */
    has(key) {
        return this._cache.has(key);
    }
    /**
     * Returns a value from the cache.
     *
     * If the key is not found, `get()` will return `undefined`.
     * This can be confusing when setting values specifically to `undefined`, as in `set(key, undefined)`. Use `has()`
     * to determine whether a key is present in the cache at all.
     */
    get(key, options) {
        return this._cache.get(key, options);
    }
    set(key, value, optionsOrTtl) {
        optionsOrTtl = typeof optionsOrTtl === 'number' ? { ttl: optionsOrTtl } : optionsOrTtl;
        this._cache.set(key, value, optionsOrTtl);
        return this;
    }
    /**
     * Deletes a key out of the cache.
     *
     * Returns `true` if the key was deleted, `false` otherwise.
     */
    delete(key) {
        return this._cache.delete(key);
    }
    /**
     * Clears the cache entirely, throwing away all values.
     */
    clear() {
        return this._cache.clear();
    }
    /**
     * Returns the remaining time before an item expires.
     *
     * Returns `0` if the item is not found in the cache or is already expired.
     */
    getRemainingTTL(key) {
        return this._cache.getRemainingTTL(key);
    }
    /**
     * Returns a generator yielding the keys in the cache, from soonest expiring to latest expiring.
     *
     * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
     */
    *keys() {
        yield* this._cache.keys();
    }
    /**
     * Returns a generator yielding the values in the cache, from soonest expiring to latest expiring.
     *
     * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
     */
    *values() {
        yield* this._cache.values();
    }
    /**
     * Returns a generator yielding `[key, value]` pairs, from soonest expiring to latest expiring.
     * Items expiring at the same time are walked in insertion order.
     *
     * **WARNING:** The generator does not yield immortal items set with `Infinity` TTL.
     */
    *entries() {
        yield* this._cache.entries();
    }
    /**
     * Iterator over cache entries.
     *
     * **WARNING:** The iterator does not iterate over immortal items set with `Infinity` TTL.
     */
    [Symbol.iterator]() {
        return this.entries();
    }
};
TtlCache = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(ttl_cache_constants_1.TTL_CACHE)),
    tslib_1.__metadata("design:paramtypes", [TTLCache])
], TtlCache);
exports.TtlCache = TtlCache;
//# sourceMappingURL=ttl-cache.js.map