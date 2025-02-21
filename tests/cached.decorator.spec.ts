import type * as TTLCache from '@isaacs/ttlcache';
import { Logger } from '@nestjs/common';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TtlCacheModule } from '../src';
import { IsolatedCacheTestService } from './test-app/isolated-cache-test.service';
import { TestService } from './test-app/test.service';
import { CACHE_INSTANCE_ID_PROPERTY, TTL_CACHE } from '../src/constants';
import { wrapCacheKey } from '../src/utils';
import { NonInjectableCacheService } from './test-app/non-ijectable-cache.service';
import { sleep } from './test-app/utils/sleep';

describe('Cached decorator test suite', () => {
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

	test('should cache the result for cached getter', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberGetter`);
		const val = testService.getRandomNumberGetter;
		expect(cache.get(cachedKey)).toBe(val);
	});

	test('should cache the result for cached method', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		const cachedKey = wrapCacheKey(
			`${IsolatedCacheTestService.name}_${isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY]}.getRandomNumber`,
		);

		const val = isolatedCacheTestService.getRandomNumber();
		expect(cache.get(cachedKey)).toBe(val);
	});

	test('should cache the result only for the specified TTL', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		const cachedKey = wrapCacheKey(
			`${IsolatedCacheTestService.name}_${isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY]}.getRandomNumber`,
		);

		const val = isolatedCacheTestService.getRandomNumber();
		expect(cache.get(cachedKey)).toBe(val);

		await sleep(110);

		expect(cache.get(cachedKey)).toBe(undefined);

		const newVal = isolatedCacheTestService.getRandomNumber();
		expect(newVal).not.toBe(val);
	});

	test('should update TTL if "updateAgeOnGet" is specified in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithEnabledTtlUpdate`);

		testService.getRandomNumberWithEnabledTtlUpdate();
		await sleep(50);
		testService.getRandomNumberWithEnabledTtlUpdate();
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('should cache result independently for different instances of decorated class', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const val1 = isolatedCacheTestService1.getRandomNumber();
		const val2 = isolatedCacheTestService2.getRandomNumber();

		expect(val1).not.toBe(val2);
	});

	test('should use shared cache for different instances of decorated class if "useSharedCache" is set in decorator options', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const val1 = isolatedCacheTestService1.getRandomNumberShared();
		const val2 = isolatedCacheTestService2.getRandomNumberShared();

		expect(val1).toBe(val2);
	});

	test('should use shared cache for different instances of a non-decorated class', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const val1 = testService1.getRandomNumber();
		const val2 = testService2.getRandomNumber();

		expect(val1).toBe(val2);
	});

	test('should ignore argument options by default', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumber`);
		const val = testService.getRandomNumber({ ttl });

		await sleep(ttl + 10);

		expect(cache.get(cacheKey)).toBe(val);
	});

	test('should use argument options if "useArgumentOptions" is provided in decorator options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithOptions`);
		testService.getRandomNumberWithOptions({ ttl });

		await sleep(ttl + 10);

		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('should return a new value if "ignoreCached" is set to `true` in argument options', async () => {
		const testService = await app.resolve(TestService);
		const val1 = testService.getRandomNumberWithOptions();
		const val2 = testService.getRandomNumberWithOptions({ ignoreCached: true });

		expect(val2).not.toBe(val1);
	});

	test('should return a cached value if "ignoreCached" is falsy in argument options', async () => {
		const testService = await app.resolve(TestService);
		const val1 = testService.getRandomNumberWithOptions();
		const val2 = testService.getRandomNumberWithOptions({ ignoreCached: false });

		expect(val2).toBe(val1);
	});

	test('should use shared cache across multiple instances if "useSharedCache" is provided in argument options', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const val1 = isolatedCacheTestService1.getRandomNumberWithOptions({ useSharedCache: true });
		const val2 = isolatedCacheTestService2.getRandomNumberWithOptions({ useSharedCache: true });

		expect(val2).toBe(val1);
	});

	test('should use hash function overload from decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOverload:${a}_${b}`);
		testService.addHashFunctionOverload(a, b);

		expect(cache.get(cacheKey)).toBe(a + b);
	});

	test('should use TTL overload from decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberTtlOverload`);
		const val = testService.getRandomNumberTtlOverload();
		expect(cache.get(cacheKey)).toBe(val);

		await sleep(51);
		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('should use hash function from decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOptions:${a}_${b}`);
		testService.addHashFunctionOptions(a, b);

		expect(cache.get(cacheKey)).toBe(a + b);
	});

	test('should print a warning and call the original function if the class is not registered in providers', async () => {
		const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

		const service = new NonInjectableCacheService();
		service.getRandomNumber();

		expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
		expect(loggerWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Failed to get the cache instance in method NonInjectableCacheService.getRandomNumber()',
			),
		);

		loggerWarnSpy.mockRestore();
	});
});
