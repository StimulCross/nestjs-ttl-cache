import type * as TTLCache from '@isaacs/ttlcache';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TtlCacheModule } from '../src';
import { TTL_CACHE } from '../src/constants';
import { sleep } from './test-app/utils/sleep';

describe('TTL cache provider test suite', () => {
	let app: NestApplication;
	let cache: TTLCache<unknown, unknown>;
	const max = 1000;
	const ttl = 5000;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [TtlCacheModule.register({ isGlobal: true, max, ttl })],
		}).compile();

		app = testingModule.createNestApplication();
		cache = app.get(TTL_CACHE);

		await app.init();
	});

	afterEach(() => {
		cache.clear();
	});

	test('should correctly return the cache size', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: Infinity,
		};
		const cacheEntry2 = {
			key: 2,
			val: 2,
			ttl: Infinity,
		};

		cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry1.ttl });
		expect(cache.size).toBe(1);

		cache.set(cacheEntry2.key, cacheEntry2.val, { ttl: cacheEntry2.ttl });
		expect(cache.size).toBe(2);
	});

	test('should verify if the cache contains a specific entry', async () => {
		const cacheKey = 1;
		const fakeCacheKey = 2;
		cache.set(cacheKey, true);

		expect(cache.has(cacheKey)).toBe(true);
		expect(cache.has(fakeCacheKey)).toBe(false);
	});

	test('should retrieve an existing entry from the cache', async () => {
		const cacheEntry = {
			key: 1,
			val: 1,
		};
		cache.set(cacheEntry.key, cacheEntry.val);

		expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
	});

	test('should return "undefined" for a non-existent entry', async () => {
		expect(cache.get(1)).toBe(undefined);
	});

	test('should add an entry to the cache with the default TTL', async () => {
		const cacheEntry = {
			key: 1,
			val: 1,
		};
		cache.set(cacheEntry.key, cacheEntry.val);

		expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
	});

	test('should add an entry to the cache with a specified TTL', async () => {
		const cacheEntry = {
			key: 1,
			val: 1,
			options: {
				ttl: Infinity,
			},
		};
		cache.set(cacheEntry.key, cacheEntry.val, cacheEntry.options);

		expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
		expect(cache.getRemainingTTL(cacheEntry.key)).toBe(cacheEntry.options.ttl);
	});

	test('should return "undefined" when retrieving an expired entry', async () => {
		const cacheEntry = {
			key: 1,
			val: 1,
			ttl: 10,
		};
		cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

		await sleep(cacheEntry.ttl + 1);

		expect(cache.get(cacheEntry.key)).toBe(undefined);
	});

	test('should delete an entry from the cache', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: Infinity,
		};
		const cacheEntry2 = {
			key: 2,
			val: 2,
			ttl: 100,
		};
		cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry1.ttl });
		cache.set(cacheEntry2.key, cacheEntry2.val, { ttl: cacheEntry2.ttl });

		expect(cache.delete(cacheEntry1.key)).toBe(true);
		expect(cache.delete(cacheEntry2.key)).toBe(true);
	});

	test('should correctly return the remaining TTL of an existing entry', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: Infinity,
		};
		cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry1.ttl });

		expect(cache.getRemainingTTL(cacheEntry1.key)).toBe(Infinity);
	});

	test('should return 0 for the remaining TTL of a non-existent entry', async () => {
		expect(cache.getRemainingTTL(1)).toBe(0);
	});

	test('should return 0 for the remaining TTL of an expired entry', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
			ttl: 10,
		};
		cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry1.ttl });

		await sleep(cacheEntry1.ttl + 1);

		expect(cache.getRemainingTTL(cacheEntry1.key)).toBe(0);
	});

	test('should provide a generator for cache keys', async () => {
		const generator = cache.keys();
		expect(typeof generator[Symbol.iterator]).toBe('function');
	});

	test('should provide a generator for cache values', async () => {
		const generator = cache.values();
		expect(typeof generator[Symbol.iterator]).toBe('function');
	});

	test('should provide a generator for cache entries', async () => {
		const generator = cache.entries();
		expect(typeof generator[Symbol.iterator]).toBe('function');
	});

	test('should iterate over cache keys using the generator', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
		};
		const cacheEntry2 = {
			key: 2,
			val: 2,
		};

		cache.set(cacheEntry1.key, cacheEntry1.val);
		cache.set(cacheEntry2.key, cacheEntry2.val);

		const generator = cache.keys();

		const key1 = generator.next();
		expect(key1.value).toBe(cacheEntry1.key);

		const val2 = generator.next();
		expect(val2.value).toBe(cacheEntry2.key);
	});

	test('should iterate over cache values using the generator', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
		};
		const cacheEntry2 = {
			key: 2,
			val: 2,
		};

		cache.set(cacheEntry1.key, cacheEntry1.val);
		cache.set(cacheEntry2.key, cacheEntry2.val);

		const generator = cache.values();

		const key1 = generator.next();
		expect(key1.value).toBe(cacheEntry1.val);

		const val2 = generator.next();
		expect(val2.value).toBe(cacheEntry2.val);
	});

	test('should iterate over cache entries using the generator', async () => {
		const cacheEntry1 = {
			key: 1,
			val: 1,
		};
		const cacheEntry2 = {
			key: 2,
			val: 2,
		};

		cache.set(cacheEntry1.key, cacheEntry1.val);
		cache.set(cacheEntry2.key, cacheEntry2.val);

		const generator = cache.entries();

		const entry1 = generator.next();
		expect(Array.isArray(entry1.value)).toBe(true);
		expect(entry1.value[0]).toBe(cacheEntry1.key);
		expect(entry1.value[1]).toBe(cacheEntry1.val);

		const entry2 = generator.next();
		expect(Array.isArray(entry2.value)).toBe(true);
		expect(entry2.value[0]).toBe(cacheEntry2.key);
		expect(entry2.value[1]).toBe(cacheEntry2.val);
	});

	test('should iterate over the cache using the built-in iterator', async () => {
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
