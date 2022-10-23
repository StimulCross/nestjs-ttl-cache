# NestJS TTL Cache

> **WARNING:** Although this library has been automatically (100% covered) and manually tested, it may still have fundamental design issues. Use it at your own risk.

### Table of Contents

-   [Installation](#installation)
-   [Introduction](#introduction)
-   [General Usage](#general-usage)
-   [Options](#options)
-   [API](#api)
-   [Decorators](#decorators)
    -   [@Cacheable](#cacheable)
    -   [@Cached](#cached)
        -   [@Cached Options](#cached-options)
    -   [@CachedAsync](#cachedasync)
        -   [@CachedAsync Options](#cachedasync-options)
    -   [Argument Options](#argument-options)
-   [Support](#support)

## Installation

Using **npm**:

```
npm i --save nestjs-ttl-cache
```

Using **yarn**:

```
yarn add nestjs-ttl-cache
```

## Introduction

This is a NestJS wrapper around [@isaacs/ttlcache](https://github.com/isaacs/ttlcache) library with support for fancy **[cache decorators](#decorators)** ❤

This cache module focuses on a TTL strategy where each entry in the cache has a limited lifetime and will be automatically deleted on expire.

A TTL number _must_ be set for every entry either on module or decorator level, or directly in `set()` method. **If the TTL value is not set, an error will be thrown.**

You can also set the cache capacity limit. If the limit is reached, the soonest-expiring entries are purged to fit the size limit.

It's highly recommended to set both `ttl` and `max` options on module level to avoid unexpected errors and unbounded cache growth (see [cache options](#options) below.)

Although it is possible to set `Infinity` as TTL value for a cache entry, it is not recommended to create immortal entries. If you need a persistent storage, consider using `Map` or plain object instead. Read the caveat from the original maintainer [here](https://github.com/isaacs/ttlcache#immortality-hazards).

You can also consider using [nestjs-lru-cache](https://github.com/stimulcross/nestjs-lru-cache) - a NestJS wrapper for [lru-cache](https://github.com/isaacs/node-lru-cache) library that implements LRU cache.

## General Usage

First of all, you must register the module in your main **AppModule** using either `register` or `registerAsync` static methods.

`register` method allow you to directly set [cache options](#options):

```ts
import { Module } from '@nestjs/common';
import { TtlCacheModule } from 'nestjs-ttl-cache';

@Module({
	imports: [
		TtlCacheModule.register({
			isGlobal: true,
			max: 10000,
			ttl: 10000
		})
	]
})
export class AppModule {}
```

`registerAsync` method allow you to use one of the following options factories: `useFactory`, `useClass`, or `useExisting`. If you need dynamically generate cache options, for example, using your `ConfigService`, you can do this using `useFactory` like this:

```ts
import { Module } from '@nestjs/common';
import { TtlCacheModule, TtlCacheOptions } from 'nestjs-ttl-cache';

@Module({
	imports: [
		ConfigModule.register({
			isGlobal: true,
			cache: true
		}),
		TtlCacheModule.registerAsync({
			isGlobal: true,
			inject: [ConfigService],
			useFactory: async (configService: ConfigService): Promise<TtlCacheOptions> => {
				return {
					max: Number(configService.get('CACHE_MAX')),
					ttl: Number(configService.get('CACHE_TTL'))
				};
			}
		})
	]
})
export class AppModule {}
```

The `ConfigService` will be injected into the `useFactory` function. Note that in the example above, `ConfigModule` is global, so it does not need to be imported to the `TtlCacheModule`.

Another option is to use class factories with `useClass` and `useExisting`. `useClass` creates a new instance of the given class, while `useExisting` uses the single shared instance. The provider must implement `TtlCacheOptionsFactory` interface:

```ts
interface TtlCacheOptionsFactory {
	createTtlCacheOptions(): Promise<TtlCacheOptions> | TtlCacheOptions;
}
```

```ts
import { Injectable } from '@nestjs/common';
import { TtlCacheOptionsFactory } from 'nestjs-ttl-cache';

@Injectable()
export class OptionsFactory implements TtlCacheOptionsFactory {
	createTtlCacheOptions(): TtlCacheOptions {
		return {
			max: 10000,
			ttl: 10000
		};
	}
}
```

The root module should look like this:

```ts
import { Module } from '@nestjs/common';
import { TtlCacheModule } from 'nestjs-ttl-cache';

@Module({
	imports: [
		// We are assuming this is a global module,
		// so we don't need to import it inside TtlCacheModule
		OptionsFactoryModule,
		TtlCacheModule.registerAsync({
			isGlobal: true,
			useExisting: OptionsFactory
		})
	]
})
export class AppModule {}
```

Once the module is registered, `TtlCache` provider can be injected as a dependency. Note that `TtlCacheModule` is registered as a global module, so it does not need to be imported into other modules.

```ts
import { Injectable } from '@nestjs/common';
import { TtlCache } from 'nestjs-ttl-cache';

@Injectable()
export class AnyCustomProvider {
	constructor(private readonly _cache: TtlCache) {}
}
```

You can also inject the **original** cache instance provided by [@isaacs/ttlcache](https://github.com/isaacs/ttlcache) library using `TTL_CACHE` token:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { TTL_CACHE } from 'nestjs-ttl-cache';
import * as TTLCache from '@isaacs/ttlcache';

@Injectable()
export class AnyCustomProvider {
	constructor(@Inject(TTL_CACHE) private readonly _cache: TTLCache) {}
}
```

See [API](#api) section below for the cache usage information.

### Options

```ts
interface TtlCacheOptions<K = any, V = any> {
	ttl?: number;
	noUpdateTTL?: boolean;
	max?: number;
	updateAgeOnGet?: boolean;
	noDisposeOnSet?: boolean;
	dispose?: Disposer<K, V>;
}
```

Either `register` or `registerAsync` (its factories) should provide the following cache options:

### `max`

The max number of items to keep in the cache. Must be positive integer or Infinity, defaults to Infinity (ie, limited only by TTL, not by item count).

### `ttl`

The max time in milliseconds to store items. Overridable on the decorator options, argument options, or `set()` method. Must be a positive integer or `Infinity` (see note about [immortality hazards](https://github.com/isaacs/ttlcache#immortality-hazards)). If it is not set in the module options, then a TTL _must_ be provided in decorator options, argument options, or in each `set()` call.

### `updateAgeOnGet`

Should the age of an item be updated when it is retrieved? Defaults to `false`. Overridable on the decorator options, argument options, or `get()` method.

### `noUpdateTTL`

Should setting a new value for an existing key leave the TTL unchanged? Defaults to `false`. Overridable on the decorator options, argument options, or `set()` method. (Note that TTL is always updated if the item is expired, since that is treated as a new `set()` and the old item is no longer relevant.)

### `dispose`

Method called with (value, key, reason) when an item is removed from the cache. Called once item is fully removed from cache. It is safe to re-add at this point, but note that adding when reason is `set` can result in infinite recursion if `noDisponseOnSet` is not specified.

Disposal reasons:

-   `'stale'` - TTL expired.
-   `'set'` - Overwritten with a new different value.
-   `'evict'` - Removed from the cache to stay within capacity limit.
-   `'delete'` - Explicitly deleted with `delete()` or `clear()`

### `noDisposeOnSet`

Do not call `dispose()` method when overwriting a key with a new value. Defaults to false. Overridable on the decorator options, argument options, or `set()` method.

### API

```ts
import { GetOptions, SetOptions } from '@isaacs/ttlcache';

interface TtlCache<K = any, V = any> {
	readonly size: number;

	has(key: K): boolean;

	get<T = unknown>(key: K, options?: GetOptions): T | undefined;

	set(key: K, value: V, ttl?: number): this;

	set(key: K, value: V, options?: SetOptions): this;

	delete(key: K): boolean;

	clear(): void;

	entries(): Generator<[K, V]>;

	keys(): Generator<K>;

	values(): Generator<V>;

	[Symbol.iterator](): Iterator<[K, V]>;
}
```

### `size`

The number of items in the cache.

### `has(key)`

Checks whether the key is in the cache. Returns boolean.

### `get(key, { updateAgeOnGet, ttl })`

Gets an item stored in the cache. Returns `undefined` if the item is not in the cache (including if it has expired and been purged).

If `updateAgeOnGet` is `true`, then re-add the item into the cache with the updated ttl value. Both options default to the settings specified in module [options](#options).

Note that using `updateAgeOnGet` can effectively simulate a "least-recently-used" type of algorithm, by repeatedly updating the TTL of items as they are used. However, if you find yourself doing this, consider using [nestjs-lru-cache](https://github.com/stimulcross/nestjs-lru-cache), as it is much more optimized for an LRU use case.

### `set(key, value, ttl)`

### `set(key, value, { ttl, noUpdateTTL, noDisposeOnSet })`

Set a value to the cache for the specified time.

`ttl` and `noUpdateTTL` optionally override defaults on the module [options](#options).

Returns the cache object itself.

### `getRemainingTTL(key)`

Returns the remaining time before an item expires. Returns `0` if the item is not found in the cache or is already expired.

### `delete(key)`

Deletes the item from the cache.

### `clear()`

Deletes all items from the cache.

### `keys()`

Returns an iterator that walks through each key from soonest expiring to latest expiring.

```ts
for (const key of cacheService.keys()) {
	// ...
}
```

### `values()`

Returns an iterator that walks through each value from soonest expiring to latest expiring.

```ts
for (const key of cacheService.values()) {
	// ...
}
```

### `entries()`

Returns an iterator that walks through each `[key, value]` from soonest expiring to latest expiring. (Items expiring at the same time are walked in insertion order.)

This is the default iteration method for the TtlCache itself.

```ts
for (const [key, value] of cacheService.entries()) {
	// ...
}
```

### `Symbol.iterator`

The cache service supports iterations over itself.

```ts
for (const [key, value] of cacheService) {
	// ...
}
```

> **NOTE:** The iterators do not yield immortal entries set with `Infinity` TTL.

## Decorators

A good way to implement automatic caching logic at class methods level is to use caching decorators.

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-ttl-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached()
	public getRandomNumber(): number {
		return Math.random();
	}
}
```

The decorators internally generate a cache key of the following pattern: `__<className><?_instanceId>.<methodName><?:hashFunctionResult>__` (`?` indicates optional part). So in the example above, the generated cache key will look like this: `__AnyCustomProvider.getRandomNumber__`.

```ts
// With @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194

// Without @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.24774185142387684
anyCustomProvider.getRandomNumber(); // -> 0.7533487702318598
```

This will work as expected if you have the single instance of the class. But if you have multiple instances of the same class (e.g. `TRANSIENT` or `REQUEST` scoped), **they will use the shared cache by default**. In order to separate them, you need to apply the `@Cacheable` decorator on the class.

### @Cacheable

The `@Cacheable` decorator makes each class instance to use separate cache.

```ts
import { Injectable } from '@nestjs/common';
import { Cacheable, Cached } from 'nestjs-ttl-cache';

@Injectable({ scope: Scope.TRANSIENT })
@Cacheable()
export class AnyCustomProvider {
	@Cached()
	public getRandomNumber(): number {
		return Math.random();
	}
}
```

The `@Cacheable` decorator assigns the unique identifier for each created instance. Thus, `@Cached` and `@CachedAsync` decorators can use it to generate unique cache keys, for example: `__AnyCustomProvider_1.getRandomNumber__`, `__AnyCustomProvider_2.getRandomNumber__`, and so on.

```ts
// With @Cacheable()
// Different class instances use separate cache
anyCustomProvider1.getRandomNumber(); // -> 0.2477418514238761
anyCustomProvider2.getRandomNumber(); // -> 0.7533487702318598

// Without @Cacheable()
// Different class instances use shared cache
anyCustomProvider1.getRandomNumber(); // -> 0.6607802129894669
anyCustomProvider2.getRandomNumber(); // -> 0.6607802129894669
```

If you're happy with different instances sharing the same cache, then don't apply this decorator. There is also a way to force some cached methods to use the shared cache by passing `useSharedCache` option to the `@Cached` or `@CachedAsync` decorators, even if the class is decorated with `@Cacheable` decorator. See below for more information.

### @Cached

```ts
@Cached(number)
@Cached((...args: any[]) => string)
@Cached({
	hashFunction: (...args: any[]) => string,
	useArgumentOptions: boolean,
	useSharedCache: boolean,
	ttl: number,
	noDisposeOnSet: boolean,
	noUpdateTTL: boolean,
	updateAgeOnGet: boolean
})
```

The `@Cached` decorator can be used to apply automatic caching logic to _synchronous_ methods and getters. To decorate asynchronous methods use [@CachedAsync](#cachedasync) decorator instead.

The `@Cached` decorator also allows you to set the TTL at the decorated method level, which will override the default value specified in the module [options](#options). To set TTL, you can pass the number of milliseconds as the first argument to the decorator itself.

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached(5000)
	public getRandomNumber(): number {
		return Math.random();
	}
}
```

If the decorated method has no parameters, you can use it as is as shown in the above examples. However, if the method has parameters, then by default they are not involved in the generation of the cache key, and calling the method with different arguments will result in the same cache key generation. To work around this issue, you can provide a function as the first argument that accepts the same parameters as the decorated method and returns a string.

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-ttl-cache';

@Injectable()
export class UsersService {
	@Cached((id: number) => String(id))
	public getUserById(id: number): User {
		// ...
	}
}
```

The resulting string will be appended to the cache key: `__UsersService.getUserById:123456789__`.

In this way you can stringify any data structure in the function, for example a plain object:

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-ttl-cache';

interface UsersOptions {
	status: string;
	role: string;
	isDeleted?: boolean;
}

@Injectable()
export class UsersService {
	@Cached((options: UsersOptions) => {
		return `${options.role}_${options.status}_${options.isDeleted}`;
	})
	public getUsers(options: UsersOptions): User[] {
		// ...
	}
}
```

The resulting cache key will look something like this: `__UsersService.getUsers:manager_online_false__`.

> **NOTE:** You're better off not using `JSON.stringify()` to convert objects to strings. If two identical objects with the same properties and values are passed with a different order of properties, this will generate different keys, for example, `{"key":1,"val":1}` and `{"val":1,"key":1}`.

By default, the `@Cached` decorator will use the default [options](#options) specified on module registration, but it also ships its own options and allows you to override the default options for the decorated method.

### @Cached Options

```ts
interface CachedDecoratorOptions {
	hashFunction?: (...args: any[]) => string;
	useArgumentOptions?: boolean;
	useSharedCache?: boolean;
	ttl?: number;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnGet?: boolean;
}
```

The `@Cached` decorator can accept options object as the first argument instead of hash function. These options allow you to flexibly control caching behavior for a single decorated method.

> **NOTE:** Some options listed below override similar options specified in module [options](#options). If they are not set, the default values will be used.

-   `hashFunction` - A function that accepts the same parameters as the decorated method and returns a string that will be appended to the generated cache key. You can specify it as the first argument or use this property in the options object.
-   `useSharedCache` - Whether the decorated method should use shared cache across multiple class instances, even if the class is decorated with `@Cacheable` decorator. Defaults to `false`.
-   `useArgumentOptions` - Makes the decorator use [argument options](#argument-options) passed as the last argument to the decorated method to control caching behavior for a single method call. See below for more information. Defaults to `false`.
-   `ttl` - The max time in milliseconds to store items of the decorated method.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing item.
-   `updateAgeOnGet` - Whether the age of an item should be updated on retrieving.

The example below shows how you can apply some cache options at theCachedAsync method level.

```ts
import { Injectable } from '@nestjs/common';
import { Cacheable, Cached } from 'nestjs-ttl-cache';

@Injectable({ scope: Scope.TRANSIENT })
@Cacheable()
export class AnyCustomProvider {
	@Cached({ ttl: 10000, updateAgeOnGet: true })
	public getRandomNumber(): number {
		return Math.random();
	}

	@Cached({ ttl: 5000, useSharedCache: true })
	public getRandomNumberShared(): number {
		return Math.random();
	}
}
```

```ts
// @Cacheable() without `useSharedCache` option
// Different class instances use separate cache
anyCustomProvider1.getRandomNumber(); // -> 0.2477418514238761
anyCustomProvider2.getRandomNumber(); // -> 0.7533487702318598

// @Cacheable() with `useSharedCache` option passed to the decorator
// Different class instances use shared cache only for this method
anyCustomProvider1.getRandomNumberShared(); // -> 0.6607802129894669
anyCustomProvider2.getRandomNumberShared(); // -> 0.6607802129894669
```

### @CachedAsync

```ts
@CachedAsync(number)
@CachedAsync((...args: any[]) => string)
@CachedAsync({
	hashFunction: (...args: any[]) => string,
	useArgumentOptions: boolean,
	useSharedCache: boolean,
	ttl: number,
	noDisposeOnSet: boolean,
	noUpdateTTL: boolean,
	updateAgeOnGet: boolean,
	cachePromise: boolean,
	cachePromiseResult: boolean
})
```

The `@CachedAsync` decorator designed for asynchronous methods. It is able to cache not only the promise result, but the promise itself.

```ts
import { Injectable } from '@nestjs/common';
import { CachedAsync } from 'nestjs-ttl-cache';

@Injectable()
export class AnyCustomProvider {
	@CachedAsync({ ttl: 5000, updateAgeOnGet: true })
	public async getRandomNumberAsync(): Promise<number> {
		return Math.random();
	}
}
```

```ts
// With @CachedAsync() decorator
// Not awaited calls return the same promise
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }

// Without @CachedAsync() decorator
// Not awaited calls return new promises for each call.
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.01035534046752562 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.19166009286482677 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.04037471223786249 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387613 }
```

In the example above, the first call of `getRandomNumberAsync()` method caches and returns a promise, the next 3 calls return the already cached promise created by the first method call. So all 4 calls waiting for the same promise to be resolved. Without `@CachedAsync` decorator 4 calls of `getRandomNumberAsync()` return a new promise for each call.

This behavior can be useful to call rate-limited third-party APIs to avoid wasting limits, or for complex database queries to maintain performance.

After expiration (5000 ms in the example) the promise will be deleted from the cache, so the next call will return a new promise.

The result of the promise is also caching for the specified TTL. For example, if you set the TTL value to 5000 ms and the promise resolves after 2000 ms, then the result of the promise will be cached, resetting the TTL back to 5000 ms. You can disable TTL update providing `noUpdateTTL: true` to the `@CachedAsync` options object, so the result of the promise will be cached for the remaining 3000 ms.

### @CachedAsync Options

```ts
interface CachedAsyncDecoratorOptions {
	cachePromise?: boolean;
	cachePromiseResult?: boolean;
	hashFunction?: (...args: any[]) => string;
	useArgumentOptions?: boolean;
	useSharedCache?: boolean;
	ttl?: number;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnGet?: boolean;
}
```

The `@CachedAsync` decorator accepts the same [options](#cached-options) as the `@Cached` decorator, but adds a few new ones:

-   `cachePromise` - Whether to cache the promise itself. If set to `false`, only the result of the promise will be cached (the latest resolved). Defaults to `true`.
-   `cachePromiseResult` - Whether to cache the result of the promise. If set to `false`, the promise will be deleted fom the cache after resolution without caching the result. Defaults to `true`.

## Argument options

```ts
interface CacheArgumentOptions {
	returnCached?: boolean;
	useSharedCache?: boolean;
	ttl?: number;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnGet?: boolean;
}
```

Argument options are a way to change caching behavior for **one specific method call** by providing cache options as the last argument in the method.

Some options listed below override similar [options](#cached-options) in the decorator. If they are not specified here, the decorator options will be used.

-   `returnCached` - Whether to return the cached value. If set to `false`, the original method will be called even if the cached result is available in the cache. The new value replaces the cached one as usual. Defaults to `true`.
-   `useSharedCache` - Whether a specific method call should use the shared cache across multiple class instances, even if [@Cacheable](#cacheable) decorator has been applied to the class. Defaults to the value specified in the [@Cached decorator options](#cached-options).
-   `ttl` - The max time in milliseconds to store items of the decorated method.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing item.
-   `updateAgeOnGet` - Whether the age of an item should be updated on retrieving.

To be able to use argument options, you _must_ set `useArgumentOptions` to `true` in the decorator options. Otherwise, they will be ignored.

```ts
import { Injectable } from '@nestjs/common';
import { Cached, CacheArgumentOptions, CachedAsyncArgumentOptions } from 'nestjs-ttl-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached({ ttl: 5000, useArgumentOptions: true })
	public getRandomNumber(options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 5000, useArgumentOptions: true })
	public async getUserById(id: number, options?: CachedAsyncArgumentOptions): Promise<User> {
		// ...
	}
}
```

After enabling `useArgumentOptions`, you can declare the argument options as the last optional parameter of the decorated method. **Only the last argument will be considered as a potential cache options object**.

```ts
// You can use the decorated method as usual:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// Call again to return the cached result:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// And you can pass `returnCached` option to ignore
// the cached value and get a new one:
anyCustomProvider.getRandomNumber({ returnCached: false });
// ->  0.24774185142387612
```

## Support

If you run into problems, or you have suggestions for improvements, please submit a new [issue](https://github.com/StimulCross/nestjs-ttl-cache/issues) 🙃
