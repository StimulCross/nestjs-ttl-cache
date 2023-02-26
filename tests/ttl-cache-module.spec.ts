import { Test } from '@nestjs/testing';
import type { NestApplication } from '@nestjs/core';
import type * as TTLCache from '@isaacs/ttlcache';
import type { INestApplication } from '@nestjs/common';
import { TTL_CACHE, TTL_CACHE_OPTIONS } from '../src/constants';
import { TtlCacheModule } from '../src/ttl-cache.module';
import type { TtlCacheOptions } from '../src/interfaces/ttl-cache-options.interface';
import { TtlCacheOptionsFactoryModule } from './test-app/ttl-cache-options-factory/ttl-cache-options-factory.module';
import { TtlCacheFactory } from './test-app/ttl-cache-options-factory/ttl-cache-options-factory';

describe('TTL cache module test suite', () => {
	describe('TTL cache options', () => {
		let app: NestApplication;
		const max = 1000;
		const ttl = 5000;

		beforeAll(async () => {
			const TestingModule = await Test.createTestingModule({
				imports: [TtlCacheModule.register({ isGlobal: true, max, ttl })]
			}).compile();

			app = TestingModule.createNestApplication();

			await app.init();
			await app.listen(3000);
		});

		afterAll(async () => {
			await app.close();
		});

		test('TTL cache options should be defined', async () => {
			const ttlCache = app.get<TtlCacheOptions>(TTL_CACHE_OPTIONS);
			expect(ttlCache).toBeDefined();
			expect(ttlCache.max).toBe(max);
			expect(ttlCache.ttl).toBe(ttl);
		});

		test('TTL cache instance should be defined', async () => {
			const ttlCache = app.get<TTLCache<unknown, unknown>>(TTL_CACHE);
			expect(ttlCache).toBeDefined();
			expect(ttlCache).toHaveProperty('get');
			expect(ttlCache).toHaveProperty('set');
			expect(ttlCache).toHaveProperty('has');
			expect(ttlCache).toHaveProperty('delete');
		});
	});

	describe('TTL cache empty options', () => {
		let app: NestApplication;

		beforeAll(async () => {
			const TestingModule = await Test.createTestingModule({
				imports: [TtlCacheModule.register()]
			}).compile();

			app = TestingModule.createNestApplication();

			await app.init();
			await app.listen(3000);
		});

		afterAll(async () => {
			await app.close();
		});

		test('TTL cache options should be defined', async () => {
			const ttlCacheOptions = app.get<TtlCacheOptions>(TTL_CACHE_OPTIONS);
			expect(ttlCacheOptions).toBeDefined();
			expect(ttlCacheOptions.max).toBe(undefined);
			expect(ttlCacheOptions.ttl).toBe(undefined);
		});

		test('TTL cache instance should be defined', async () => {
			const ttlCache = app.get<TTLCache<unknown, unknown>>(TTL_CACHE);
			expect(ttlCache).toBeDefined();
			expect(ttlCache).toHaveProperty('get');
			expect(ttlCache).toHaveProperty('set');
			expect(ttlCache).toHaveProperty('has');
			expect(ttlCache).toHaveProperty('delete');
		});
	});

	describe('TTL cache async options', () => {
		const max = 10000;
		const ttl = 50000;

		const testModule = async (app: INestApplication): Promise<void> => {
			await app.init();
			await app.listen(3000);

			const ttlCacheOptions = app.get<TtlCacheOptions>(TTL_CACHE_OPTIONS);
			expect(ttlCacheOptions).toBeDefined();
			expect(ttlCacheOptions.max).toBe(max);
			expect(ttlCacheOptions.ttl).toBe(ttl);

			const ttlCache = app.get<TTLCache<unknown, unknown>>(TTL_CACHE);
			expect(ttlCache).toBeDefined();
			expect(ttlCache).toHaveProperty('get');
			expect(ttlCache).toHaveProperty('set');
			expect(ttlCache).toHaveProperty('has');
			expect(ttlCache).toHaveProperty('delete');

			await app.close();
		};

		test('TTL cache options should be resolved with "useClass"', async () => {
			const TestingModule = await Test.createTestingModule({
				imports: [
					TtlCacheModule.registerAsync({
						isGlobal: true,
						imports: [TtlCacheOptionsFactoryModule],
						useClass: TtlCacheFactory
					})
				]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});

		test('TTL cache options should be resolved with "useExisting"', async () => {
			const TestingModule = await Test.createTestingModule({
				imports: [
					TtlCacheModule.registerAsync({
						isGlobal: true,
						imports: [TtlCacheOptionsFactoryModule],
						useExisting: TtlCacheFactory
					})
				]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});

		test('TTL cache options should be resolved with "useFactory"', async () => {
			const createOptions = async (): Promise<TtlCacheOptions> => {
				return { max, ttl };
			};

			const TestingModule = await Test.createTestingModule({
				imports: [TtlCacheModule.registerAsync({ isGlobal: true, useFactory: createOptions })]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});

		test('TTL cache imports should be injected to "useFactory"', async () => {
			const createOptions = async (factory: TtlCacheFactory): Promise<TtlCacheOptions> => {
				expect(factory).toBeInstanceOf(TtlCacheFactory);
				return { max, ttl };
			};

			const TestingModule = await Test.createTestingModule({
				imports: [
					TtlCacheModule.registerAsync({
						isGlobal: true,
						imports: [TtlCacheOptionsFactoryModule],
						inject: [TtlCacheFactory],
						useFactory: createOptions
					})
				]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});
	});
});
