# NestJS TTL Cache

### Table of Contents

- [Installation](#installation)
- [Introduction](#introduction)
- [General Usage](#general-usage)
- [Options](#options)
- [API](#api)
- [Decorators](#decorators)
    - [@Cacheable](#cacheable)
    - [@Cached](#cached)
        - [@Cached Options](#cached-options)
    - [@CachedAsync](#cachedasync)
        - [@CachedAsync Options](#cachedasync-options)
    - [Argument Options](#argument-options)
- [Tests](#tests)
    - [Coverage](#coverage)
- [Support](#support)

## Installation

Using **npm**:

```
npm i --save nestjs-ttl-cache @isaacs/ttlcache
```

Using **yarn**:

```
yarn add nestjs-ttl-cache @isaacs/ttlcache
```

Using **pnpm**:

```
pnpm add nestjs-ttl-cache @isaacs/ttlcache
```

## Introduction

This is a NestJS wrapper around [@isaacs/ttlcache](https://github.com/isaacs/ttlcache) library with support for fancy **[cache decorators](#decorators)**.

This cache module focuses on a TTL strategy where each entry in the cache has a limited lifetime and will be automatically deleted on expire.

A TTL number _must_ be set for every entry either on module or decorator level, or directly in `set()` method. **If the TTL value is not set, an error will be thrown.**

You can also set the cache capacity limit. If the limit is reached, the soonest-expiring entries are purged to fit the size limit.

It's highly recommended to set both `ttl` and `max` options on module level to avoid unexpected errors and unbounded cache growth (see [cache options](#options) below.)

Although it is possible to set `Infinity` as TTL value for a cache entry, it is not recommended to create immortal entries. If you need a persistent storage, consider using `Map` or plain object instead. Read the caveat from the original maintainer [here](https://github.com/isaacs/ttlcache#immortality-hazards).

You can also consider using [nestjs-lru-cache](https://github.com/stimulcross/nestjs-lru-cache) - a NestJS wrapper for [lru-cache](https://github.com/isaacs/node-lru-cache) library that implements LRU caching.

## General Usage

First, you must register the module in your main **AppModule** using either `register` or `registerAsync` static methods.

`register` method allows you to directly set [cache options](#options):

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

`registerAsync` method allows you to use one of the following options factories: `useFactory`, `useClass`, or `useExisting`. If you need to dynamically generate cache options, for example, using your `ConfigService`, you can do it using `useFactory` function like this:

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

Alternatively, you can employ class factories using `useClass` or `useExisting`. The `useClass` option creates a new instance of the specified class, whereas `useExisting` returns the shared instance. Note that the provider must implement the `TtlCacheOptionsFactory` interface.

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

Once the module is registered, original `TTLCache` instance can be injected as a dependency using `TTL_CACHE` token or `@InjectCache` decorator.

```ts
import TTLCache from '@isaacs/ttlcache';
import { Inject, Injectable } from '@nestjs/common';
import { TTL_CACHE } from 'nestjs-ttl-cache';

@Injectable()
export class AnyCustomProvider {
	constructor(@Inject(TTL_CACHE) private readonly _cache: TTLCache<{}, {}>) {}
}
```

Or

```ts
import TTLCache from '@isaacs/ttlcache';
import { Injectable } from '@nestjs/common';
import { InjectCache } from 'nestjs-ttl-cache';

@Injectable()
export class AnyCustomProvider {
	constructor(@InjectCache() private readonly _cache: TTLCache<{}, {}>) {}
}
```

### Options

The options are directly extending the original TTLCache options.

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

> [!TIP]
> Read the detailed description of each option in the original [@isaacs/ttlcache repository](https://github.com/isaacs/ttlcache#new-ttlcache-ttl-max--infinty-updateageonget--false-noupdatettl--false-nodisposeonset--false-).

### API

For a detailed explanation of the API, please refer to the original [@isaacs/ttlcache repository](https://github.com/isaacs/ttlcache#cachesize).

## Decorators

An effective way to implement automatic caching logic at the class-method level is to utilize caching decorators.

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

The decorators internally generate a cache key using the following pattern: `__<className><?_instanceId>.<methodName><?:hashFunctionResult>__` (the `?` indicates optional parts). For instance, in the example above, the generated cache key would look like this: `__AnyCustomProvider.getRandomNumber__`.

```ts
// With @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194

// Without @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.24774185142387684
anyCustomProvider.getRandomNumber(); // -> 0.75334877023185987
```

This works as expected when you only have one instance of the class. However, if you create multiple instances of the same class (for example, using `TRANSIENT` scope), all instances will share the same cache by default. To ensure each instance maintains its own cache, you should apply the `@Cacheable` decorator at the class level.

### @Cacheable

The `@Cacheable` decorator ensures that each class instance maintains its own isolated cache, providing instance-specific caching behavior.

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

The `@Cacheable` decorator dynamically assigns a unique identifier to each class instance, enabling `@Cached` and `@CachedAsync` decorators to generate distinct cache keys. This mechanism ensures that cached method results are segregated by instance, preventing potential data cross-contamination. For example, different instances will have cache keys like `__AnyCustomProvider_1.getRandomNumber__` and `__AnyCustomProvider_2.getRandomNumber__`.

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

If you're fine with different instances sharing the same cache, you don't need to apply this decorator. However, if you want certain cached methods to explicitly use the shared cache, you can pass the `useSharedCache` option to the `@Cached` or `@CachedAsync` decorators — even when the class is decorated with `@Cacheable`. See below for more details.

### @Cached

```ts
@Cached(number)
@Cached((...args: any[]) => string)
@Cached(options)
```

The `@Cached` decorator enables automatic caching for _synchronous_ methods and getters. To handle asynchronous methods, use the [@CachedAsync](#cachedasync) decorator instead.

Additionally, the `@Cached` decorator allows you to specify a TTL directly at the method level, overriding the default value defined in the module [options](#options). To set a custom TTL, provide the number of milliseconds as the first argument to the decorator.

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

If the decorated method does not accept any parameters, you can use it as-is, as demonstrated in the examples above. However, if the method does accept parameters, note that by default they are not factored into the cache key generation. This means that invoking the method with different arguments will produce the same cache key. To address this, you can supply a function as the first argument, which should accept the same parameters as the decorated method and return a string to be used as the cache key.

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

The resulting string will be appended to the cache key, such as: `__UsersService.getUserById:123456789__`.

This approach allows you to stringify any data structure within the function, including objects.

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

The resulting cache key looks something like this: `__UsersService.getUsers:manager_online_false__`.

> [!TIP]
> Avoid using `JSON.stringify()` to convert objects to strings for key generation. Even if two objects have the same properties and values, a different order of properties can produce different strings — for instance, `{"key1":1,"key2":2}` versus `{"key2":2,"key1":1}`. This may lead to unexpected behavior when these stringified objects are used as keys.

By default, the `@Cached` decorator utilizes the [options](#options) configured during module registration. However, it also provides its own set of options, enabling you to override the default settings specifically for the decorated method.

### @Cached Options

```ts
interface CachedDecoratorOptions {
	hashFunction?: (...args: any[]) => string;
	useArgumentOptions?: boolean;
	useSharedCache?: boolean;

	// The options below are inherited from the underlying library's options
	ttl?: number;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnGet?: boolean;
	checkAgeOnGet?: boolean;
}
```

The `@Cached` decorator can accept an options object as its first argument. This provides flexible control over the caching behavior on a per-method basis.

> [!NOTE]
> Some options detailed below will override corresponding module-level settings defined under [options](#options). If no value is provided, the default is used.

- `hashFunction` - A function that accepts the same parameters as the decorated method and returns a string to be appended to the generated cache key. This function can be specified either as the first argument to the decorator or as a property within the options object.
- `useSharedCache` - A boolean that determines whether the decorated method should share a common cache across multiple instances of the class, even if the class itself is decorated with the `@Cacheable` decorator. By default, this value is set to `false`.
- `useArgumentOptions` - When set to `true`, this option directs the decorator to use the [argument options](#argument-options) provided as the last parameter of the decorated method to manage caching behavior for that specific call. By default, its value is `false`.

The library internally utilizes the cache methods (`cache.get()`, `cache.set()`, and `cache.has()`) provided by the underlying caching library. You can specify method-specific options to customize the behavior of these internal cache calls. For example, `cache.get()` accepts an options object that includes the `updateAgeOnGet` flag refreshes the TTL of a cached entry each time it is accessed. By including this flag in the decorator's options, you ensure it is consistently applied during internal `cache.get()` operations.

For a comprehensive list of available options, refer to the official repository of the underlying library: [TTLCache Repository](https://github.com/isaacs/ttlcache?tab=readme-ov-file#cachesetkey-value--ttl-noupdatettl-nodisposeonset---).

The following example demonstrates how to apply specific cache options using the `@Cached` decorator:

```ts
import { Injectable } from '@nestjs/common';
import { Cacheable, Cached } from 'nestjs-ttl-cache';

@Injectable({ scope: Scope.TRANSIENT })
@Cacheable()
export class AnyCustomProvider {
	@Cached({ ttl: 10_000, updateAgeOnGet: true })
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

// Generates a random number and caches the result.
anyCustomProvider1.getRandomNumber(); // -> 0.1234567890123456
// Retrieves the cached value and refreshes the TTL,
// resetting it back to 10,000 milliseconds.
anyCustomProvider1.getRandomNumber(); // -> 0.1234567890123456
```

### @CachedAsync

```ts
@CachedAsync(number)
@CachedAsync((...args: any[]) => string)
@CachedAsync(options)
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

In this example, the first call to the `getRandomNumberAsync()` method caches and returns a promise. The subsequent three calls reuse the cached promise created by the first call. As a result, all four calls are waiting for the resolution of the same promise. Without the `@CachedAsync` decorator, each of the four calls to `getRandomNumberAsync()` would create and return a new promise independently.

This behavior is particularly useful when working with rate-limited third-party APIs to optimize the use of request limits or for executing complex database queries while preserving performance.

Once the cache expires (e.g., after 5000 ms in the example), the promise is removed from the cache, and the next method call will generate and cache a new promise.

The resolved value of the promise is also cached for the specified TTL. For instance, if the TTL is set to 5000 ms and the promise resolves after 2000 ms, the result will be cached and the TTL reset to 5000 ms. You can prevent the TTL from resetting by setting `noUpdateTTL: true` (inherited from the `TTLCache#set()` options) in the `@CachedAsync` options, ensuring the value remains cached only for the remaining 3000 ms.

### @CachedAsync Options

```ts
interface CachedAsyncDecoratorOptions {
	cachePromise?: boolean;
	cachePromiseResult?: boolean;
	hashFunction?: (...args: any[]) => string;
	useArgumentOptions?: boolean;
	useSharedCache?: boolean;

	// The options below are inherited from the underlying library's options
	ttl?: number;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnGet?: boolean;
	checkAgeOnGet?: boolean;
}
```

The `@CachedAsync` decorator supports all the [options](#cached-options) available to the `@Cached` decorator, while also introducing several additional options:

- `cachePromise` - Determines whether the promise itself should be cached. If set to `false`, only the resolved value will be stored in the cache (i.e. the latest successful result). The default value is `true`.

- `cachePromiseResult` - Specifies whether to cache the result of the promise. When set to `false`, the promise is removed from the cache once it resolves, and its result is not stored. The default value is `true`.

## Argument options

```ts
interface CacheArgumentOptions {
	returnCached?: boolean;
	useSharedCache?: boolean;

	// The options below are inherited from the underlying library's options
	ttl?: number;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnGet?: boolean;
	checkAgeOnGet?: boolean;
}
```

Argument options allow you to modify the caching behavior for a **single method call** by providing cache options as the final parameter of the method invocation.

Some of these options will override the corresponding settings defined in the decorator's [options]

- `returnCached` – Specifies whether to return the cached value. When set to `false`, the original method is executed regardless of a cached result, and the new result then replaces the cached one. The default value is `true`.
- `useSharedCache` – Determines if a specific method call should use a shared cache across multiple class instances, even when the [@Cacheable](#cacheable) decorator is applied to the class. By default, it adopts the value defined in the [@Cached decorator options](#cached-options).

> [!IMPORTANT]
> To enable argument options, `useArgumentOptions` must be set to `true` in the decorator options; otherwise, they will be ignored.

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

Once `useArgumentOptions` is enabled, you can pass an object with cache options as the **final, optional parameter** of the decorated method. **Only the last argument is evaluated as a potential cache options object.**

```ts
// Invoke the method as usual:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// Subsequent calls return the cached value:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// Providing { returnCached: false } bypasses the cache and fetches a new value:
anyCustomProvider.getRandomNumber({ returnCached: false });
// ->  0.24774185142387612
```

## Tests

Available test commands: `test`, `test:verbose`, `test:cov`, `test:cov:verbose`.

### Coverage

`test:cov` output:

```
 PASS  tests/cached-async.decorator.spec.ts
 PASS  tests/cached.decorator.spec.ts
 PASS  tests/ttl-cache.module.spec.ts
 PASS  tests/ttl-cache.spec.ts
 PASS  tests/cacheable.decorator.spec.ts
--------------------------------|---------|----------|---------|---------|-------------------
File                            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------------|---------|----------|---------|---------|-------------------
All files                       |     100 |      100 |     100 |     100 |
 src                            |     100 |      100 |     100 |     100 |
  constants.ts                  |     100 |      100 |     100 |     100 |
  ttl-cache.module.ts           |     100 |      100 |     100 |     100 |
 src/decorators                 |     100 |      100 |     100 |     100 |
  cacheable.decorator.ts        |     100 |      100 |     100 |     100 |
  cached-async.decorator.ts     |     100 |      100 |     100 |     100 |
  cached.decorator.ts           |     100 |      100 |     100 |     100 |
  inject-cache.decorator.ts |     100 |      100 |     100 |     100 |
 src/utils                      |     100 |      100 |     100 |     100 |
  is-object.ts                  |     100 |      100 |     100 |     100 |
  wrap-cache-key.ts             |     100 |      100 |     100 |     100 |
--------------------------------|---------|----------|---------|---------|-------------------

Test Suites: 5 passed, 5 total
Tests:       74 passed, 74 total
Snapshots:   0 total
Time:        4.111 s
Ran all test suites.
Done in 4.59s.

```

## Support

If you run into problems, or you have suggestions for improvements, please submit a new [issue](https://github.com/StimulCross/nestjs-ttl-cache/issues) 🙃
