import type * as TTLCache from '@isaacs/ttlcache';
import { Logger } from '@nestjs/common';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TTL_CACHE, TtlCacheModule } from '../src';
import { IsolatedCacheTestService } from './test-app/isolated-cache-test.service';
import { NonInjectableCacheService } from './test-app/non-ijectable-cache.service';
import { TestService } from './test-app/test.service';
import { wrapCacheKey } from '../src/utils';
import { sleep } from './test-app/utils/sleep';

describe('Cached async decorator test suite', () => {
	let app: NestApplication;
	let cache: TTLCache<unknown, unknown>;

	beforeEach(async () => {
		const mod = await Test.createTestingModule({
			imports: [TtlCacheModule.register({ isGlobal: true, ttl: 1000, max: 1000 })],
			providers: [IsolatedCacheTestService, TestService],
		}).compile();

		app = mod.createNestApplication();
		cache = app.get(TTL_CACHE);

		await app.init();
	});

	afterEach(async () => {
		cache.clear();
	});

	test('should cache the promise', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);

		const promise = testService.getRandomNumberAsync();
		expect(cache.get(cachedKey)).toStrictEqual(promise);
	});

	test('should cache the promise result', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);
		const result = await testService.getRandomNumberAsync();
		expect(cache.get(cachedKey)).toBe(result);
	});

	test('should not cache the promise if "cachePromise" is false in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithoutCachingPromise`);

		void testService.getRandomNumberAsyncWithoutCachingPromise();
		expect(cache.has(cachedKey)).toBe(false);
	});

	test('should not cache the promise result if "cachePromiseResult" is false in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithoutCachingPromiseResult`);

		const promise = testService.getRandomNumberAsyncWithoutCachingPromiseResult();
		expect(cache.has(cachedKey)).toBe(true);

		await promise;
		expect(cache.has(cachedKey)).toBe(false);
	});

	test('should cache the promise with the specified TTL', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);

		void testService.getRandomNumberAsync();

		await sleep(110);

		expect(cache.get(cachedKey)).toBe(undefined);
	});

	test('should update TTL after promise resolution', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncDelayed`);

		void testService.getRandomNumberAsyncDelayed();

		await sleep(50);

		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('should not update TTL after promise resolution if "noUpdateTTL" is true in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncDelayedWithDisabledTtlUpdate`);

		void testService.getRandomNumberAsyncDelayedWithDisabledTtlUpdate();

		await sleep(50);

		expect(cache.getRemainingTTL(cachedKey)).toBeLessThanOrEqual(50);
	});

	test('should return the cached promise for subsequent calls', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const promise1 = testService1.getRandomNumberAsync();
		const promise2 = testService2.getRandomNumberAsync();

		expect(promise1).toStrictEqual(promise2);
	});

	test('should return the cached promise result for subsequent calls', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const promise1 = await testService1.getRandomNumberAsync();
		const promise2 = await testService2.getRandomNumberAsync();

		expect(promise1).toBe(promise2);
	});

	test('should cache the promise independently for different instances of the @IsolatedCache class', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const promise1 = isolatedCacheTestService1.getRandomNumberAsync();
		const promise2 = isolatedCacheTestService2.getRandomNumberAsync();

		expect(await promise1).not.toBe(await promise2);
	});

	test('should cache the promise result independently for different instances of the @IsolatedCache class', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const val1 = isolatedCacheTestService1.getRandomNumberAsync();
		const val2 = isolatedCacheTestService2.getRandomNumberAsync();

		expect(await val1).not.toBe(await val2);
	});

	test('should use shared cache across different instances of the @IsolatedCache class if "useSharedCache" is true', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const promise1 = isolatedCacheTestService1.getRandomNumberAsyncShared();
		const promise2 = isolatedCacheTestService2.getRandomNumberAsyncShared();

		expect(await promise1).toBe(await promise2);
	});

	test('should ignore argument options by default', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);
		const promise = testService.getRandomNumberAsync({ ttl });

		await sleep(ttl + 10);

		expect(cache.get(cacheKey)).toBe(await promise);
	});

	test('should use argument options if "useArgumentOptions" is true in decorator options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithOptions`);
		void testService.getRandomNumberAsyncWithOptions({ ttl });

		await sleep(ttl + 10);

		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('should return a new value if "ignoreCached" is true in argument options', async () => {
		const testService = await app.resolve(TestService);
		const promise1 = testService.getRandomNumberAsyncWithOptions();
		const promise2 = testService.getRandomNumberAsyncWithOptions();
		const promise3 = testService.getRandomNumberAsyncWithOptions({ ignoreCached: true });

		expect(await promise1).toBe(await promise2);
		expect(await promise1).not.toBe(await promise3);
	});

	test('should return the cached value if "ignoreCached" is falsy in argument options', async () => {
		const testService = await app.resolve(TestService);
		const promise1 = testService.getRandomNumberAsyncWithOptions();
		const promise2 = testService.getRandomNumberAsyncWithOptions({ ignoreCached: false });

		expect(await promise1).toBe(await promise2);
	});

	test('should use shared cache across multiple instances if "useSharedCache" is true in argument options', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const promise1 = isolatedCacheTestService1.getRandomNumberAsyncWithOptions({ useSharedCache: true });
		const promise2 = isolatedCacheTestService2.getRandomNumberAsyncWithOptions({ useSharedCache: true });

		expect(await promise1).toBe(await promise2);
	});

	test('should update TTL if "updateAgeOnGet" is true in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithEnabledTtlUpdateAsync`);

		void testService.getRandomNumberWithEnabledTtlUpdateAsync();
		await sleep(50);
		void testService.getRandomNumberWithEnabledTtlUpdateAsync();
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('should update TTL if "updateAgeOnGet" is true in argument options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithOptions`);

		void testService.getRandomNumberAsyncWithOptions();
		await sleep(50);
		void testService.getRandomNumberAsyncWithOptions({ updateAgeOnGet: true });
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('should use a hash function overload', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOverloadAsync:${a}_${b}`);
		const promise = testService.addHashFunctionOverloadAsync(a, b);

		expect(cache.has(cacheKey)).toBe(true);
		expect(await promise).toBe(a + b);
	});

	test('should use TTL overload', async () => {
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberTtlOverloadAsync`);
		const val = await testService.getRandomNumberTtlOverloadAsync();
		expect(cache.get(cacheKey)).toBe(val);

		await sleep(51);
		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('should use a hash function defined in decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOptionsAsync:${a}_${b}`);
		const promise = testService.addHashFunctionOptionsAsync(a, b);

		expect(cache.has(cacheKey)).toBe(true);
		expect(await promise).toBe(a + b);
	});

	test('should print a warning and call the original function if the class is not registered in providers', async () => {
		const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

		const service = new NonInjectableCacheService();
		await service.getRandomNumberAsync();

		expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
		expect(loggerWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Failed to get the cache instance in method NonInjectableCacheService.getRandomNumberAsync()',
			),
		);

		loggerWarnSpy.mockRestore();
	});
});
