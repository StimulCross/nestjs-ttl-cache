# NestJS TTL Cache

> **WARNING:** Although this library has been automatically (100% covered) and manually tested, it may still have fundamental design issues.

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
-   [Tests](#tests)
    -   [Coverage](#coverage)
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

You can also consider using [nestjs-lru-cache](https://github.com/stimulcross/nestjs-lru-cache) - a NestJS wrapper for [lru-cache](https://github.com/isaacs/node-lru-cache) library that implements LRU caching.

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

> **TIP:** Read the detailed description of each option in the original [@isaacs/ttlcache repository](https://github.com/isaacs/ttlcache#new-ttlcache-ttl-max--infinty-updateageonget--false-noupdatettl--false-nodisposeonset--false-).

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

> **TIP:** Read the detailed description of the API in the original [@isaacs/ttlcache repository](https://github.com/isaacs/ttlcache#cachesize).

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
anyCustomProvider.getRandomNumber(); // -> 0.75334877023185987
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
-   `ttl` - The max time in milliseconds to store entries of the decorated method.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing entry.
-   `updateAgeOnGet` - Whether the age of an entry should be updated on retrieving.

The example below shows how you can apply some cache options at the `CachedAsync` method level.

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
// Not awaited calls return a new promise for each call.
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
-   `ttl` - The max time in milliseconds to store entries of the decorated method.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing entry.
-   `updateAgeOnGet` - Whether the age of an entry should be updated on retrieving.

To be able to use argument options, you _must_ set `useArgumentOptions` to `true` in the decorator options. Otherwise, they will be ignored.

```ts
import { Injectable } from '@nestjs/common';
import { Cached, CacheArgumentOptions, CachedAsyncArgumentOptions } from 'nestjs-ttl-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached({ ttl: 5000, useArgumentOptions: true })
	public getRandomNumber(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 5000, useArgumentOptions: true })
	public async getUserById(id: number, _options?: CachedAsyncArgumentOptions): Promise<User> {
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

// And you can pass `returnCached: false` to ignore
// the cached value and get a new one:
anyCustomProvider.getRandomNumber({ returnCached: false });
// ->  0.24774185142387612
```

## Tests

Available test commands: `test`, `test:verbose`, `test:cov`, `test:cov:verbose`.

### Coverage

`test:cov` output:

```
 PASS  tests/ttl-cache-module.spec.ts
 PASS  tests/cached-async.decorator.spec.ts
 PASS  tests/cached.decorator.spec.ts
 PASS  tests/ttl-cache.spec.ts
 PASS  tests/cacheable,decorator.spec.ts
----------------------------|---------|----------|---------|---------|-------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------|---------|----------|---------|---------|-------------------
All files                   |     100 |      100 |     100 |     100 |
 src                        |     100 |      100 |     100 |     100 |
  constants.ts              |     100 |      100 |     100 |     100 |
  ttl-cache.module.ts       |     100 |      100 |     100 |     100 |
 src/decorators             |     100 |      100 |     100 |     100 |
  cacheable.decorator.ts    |     100 |      100 |     100 |     100 |
  cached-async.decorator.ts |     100 |      100 |     100 |     100 |
  cached.decorator.ts       |     100 |      100 |     100 |     100 |
 src/providers              |     100 |      100 |     100 |     100 |
  ttl-cache.ts              |     100 |      100 |     100 |     100 |
 src/utils                  |     100 |      100 |     100 |     100 |
  is-object.ts              |     100 |      100 |     100 |     100 |
  wrap-cache-key.ts         |     100 |      100 |     100 |     100 |
----------------------------|---------|----------|---------|---------|-------------------

Test Suites: 5 passed, 5 total
Tests:       71 passed, 71 total
Snapshots:   0 total
Time:        5.225 s, estimated 12 s
Ran all test suites.
Done in 5.87s.
```

## Support

If you run into problems, or you have suggestions for improvements, please submit a new [issue](https://github.com/StimulCross/nestjs-ttl-cache/issues) 🙃
