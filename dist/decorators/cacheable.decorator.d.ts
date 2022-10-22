/**
 * Marks a class as cacheable.
 *
 * This only useful if the class has multiple instances (e.g. `TRANSIENT` or `REQUEST` scoped) and you don't want the
 * same methods on different instances to share the same cache space.
 * If you have a single instance, or you want to have the shared cache for the same methods on different class
 * instances, then do not apply this decorator.
 */
export declare function Cacheable(): <T extends new (...args: any[]) => object>(target: T) => any;
//# sourceMappingURL=cacheable.decorator.d.ts.map