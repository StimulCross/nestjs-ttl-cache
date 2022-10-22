import { Test } from '@nestjs/testing';
import type { NestApplication } from '@nestjs/core';
import { TtlCacheModule } from '../src';
import { TtlCache } from '../src/providers/ttl-cache';
import { sleep } from './test-app/utils/sleep';

describe('TTL cache provider test suite', () => {
	let app: NestApplication;
	let cache: TtlCache;
	const max = 1000;
	const ttl = 5000;

	beforeAll(async () => {
		const TestingModule = await Test.createTestingModule({
			imports: [TtlCacheModule.register({ isGlobal: true, max, ttl })]
		}).compile();

		app = TestingModule.createNestApplication();
		cache = app.get(TtlCache);

		await app.init();
		await app.listen(3000);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(() => {
		cache.clear();
	});

	test('Should return the correct cache size', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: Infinity
		};
		const cacheEntry2 = {
			key: 2,
			val: 2,
			ttl: Infinity
		};

		cache.set(cacheEntry1.key, cacheEntry1.val, cacheEntry1.ttl);
		expect(cache.size).toBe(1);

		cache.set(cacheEntry2.key, cacheEntry2.val, cacheEntry2.ttl);
		expect(cache.size).toBe(2);
	});

	test('Should check if the cache has an entry', async () => {
		const cacheKey = 1;
		const fakeCacheKey = 2;
		cache.set(cacheKey, true);

		expect(cache.has(cacheKey)).toBe(true);
		expect(cache.has(fakeCacheKey)).toBe(false);
	});

	test('Should get an existing entry', async () => {
		const cacheEntry = {
			key: 1,
			val: 1
		};
		cache.set(cacheEntry.key, cacheEntry.val);

		expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
	});

	test('Should return "undefined" for non-existing key', async () => {
		expect(cache.get(1)).toBe(undefined);
	});

	test('Should set entry to the cache (with default TTL)', async () => {
		const cacheEntry = {
			key: 1,
			val: 1
		};
		cache.set(cacheEntry.key, cacheEntry.val);

		expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
	});

	test('Should set entry to the cache with ttl overload', async () => {
		const cacheEntry = {
			key: 1,
			val: 1,
			ttl: Infinity
		};
		cache.set(cacheEntry.key, cacheEntry.val, cacheEntry.ttl);

		expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
		expect(cache.getRemainingTTL(cacheEntry.key)).toBe(cacheEntry.ttl);
	});

	test('Should set entry to the cache with options overload', async () => {
		const cacheEntry = {
			key: 1,
			val: 1,
			options: {
				ttl: Infinity
			}
		};
		cache.set(cacheEntry.key, cacheEntry.val, cacheEntry.options);

		expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
		expect(cache.getRemainingTTL(cacheEntry.key)).toBe(cacheEntry.options.ttl);
	});

	test('Should return "undefined" when trying to get an expired entry', async () => {
		const cacheEntry = {
			key: 1,
			val: 1,
			ttl: 10
		};
		cache.set(cacheEntry.key, cacheEntry.val, cacheEntry.ttl);

		await sleep(cacheEntry.ttl + 1);

		expect(cache.get(cacheEntry.key)).toBe(undefined);
	});

	test('Should delete an entry from the cache', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: Infinity
		};
		const cacheEntry2 = {
			key: 2,
			val: 2,
			ttl: 100
		};
		cache.set(cacheEntry1.key, cacheEntry1.val, cacheEntry1.ttl);
		cache.set(cacheEntry2.key, cacheEntry2.val, cacheEntry2.ttl);

		expect(cache.delete(cacheEntry1.key)).toBe(true);
		expect(cache.delete(cacheEntry2.key)).toBe(true);
	});

	test('Should return remaining TTL of an existing entry', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: Infinity
		};
		cache.set(cacheEntry1.key, cacheEntry1.val, cacheEntry1.ttl);

		expect(cache.getRemainingTTL(cacheEntry1.key)).toBe(Infinity);
	});

	test('Should return 0 when getting remaining TTL of a non-existing entry', async () => {
		expect(cache.getRemainingTTL(1)).toBe(0);
	});

	test('Should return 0 when getting remaining TTL of an expired entry', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: 10
		};
		cache.set(cacheEntry1.key, cacheEntry1.val, cacheEntry1.ttl);

		await sleep(cacheEntry1.ttl + 1);

		expect(cache.getRemainingTTL(cacheEntry1.key)).toBe(0);
	});

	test('Should return keys Generator', async () => {
		const generator = cache.keys();
		expect(typeof generator[Symbol.iterator]).toBe('function');
	});

	test('Should return values Generator', async () => {
		const generator = cache.values();
		expect(typeof generator[Symbol.iterator]).toBe('function');
	});

	test('Should return entries Generator', async () => {
		const generator = cache.entries();
		expect(typeof generator[Symbol.iterator]).toBe('function');
	});

	test('Should iterate over keys', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1
		};
		const cacheEntry2 = {
			key: 2,
			val: 2
		};

		cache.set(cacheEntry1.key, cacheEntry1.val);
		cache.set(cacheEntry2.key, cacheEntry2.val);

		const generator = cache.keys();

		const key1 = generator.next();
		expect(key1.value).toBe(cacheEntry1.key);

		const val2 = generator.next();
		expect(val2.value).toBe(cacheEntry2.key);
	});

	test('Should iterate over values', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1
		};
		const cacheEntry2 = {
			key: 2,
			val: 2
		};

		cache.set(cacheEntry1.key, cacheEntry1.val);
		cache.set(cacheEntry2.key, cacheEntry2.val);

		const generator = cache.values();

		const key1 = generator.next();
		expect(key1.value).toBe(cacheEntry1.val);

		const val2 = generator.next();
		expect(val2.value).toBe(cacheEntry2.val);
	});

	test('Should iterate over entries', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1
		};
		const cacheEntry2 = {
			key: 2,
			val: 2
		};

		cache.set(cacheEntry1.key, cacheEntry1.val);
		cache.set(cacheEntry2.key, cacheEntry2.val);

		const generator = cache.entries();

		/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		const entry1 = generator.next();
		expect(Array.isArray(entry1.value)).toBe(true);
		expect(entry1.value[0]).toBe(cacheEntry1.key);
		expect(entry1.value[1]).toBe(cacheEntry1.val);

		const entry2 = generator.next();
		expect(Array.isArray(entry2.value)).toBe(true);
		expect(entry2.value[0]).toBe(cacheEntry2.key);
		expect(entry2.value[1]).toBe(cacheEntry2.val);
		/* eslint-disable @typescript-eslint/no-unsafe-member-access */
	});

	test('Should iterate over cache service itself', async () => {
		expect(typeof cache[Symbol.iterator]).toBe('function');

		const entries = 5;

		for (let i = 1; i <= entries; i++) {
			cache.set(i, i);
		}

		let count = 0;

		for (const [key, val] of cache) {
			count++;
			expect(key).toBe(count);
			expect(val).toBe(count);
		}

		expect(count).toBe(entries);
	});
});
