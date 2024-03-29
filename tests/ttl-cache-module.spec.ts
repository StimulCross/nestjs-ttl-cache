import { type INestApplication } from '@nestjs/common';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TtlCacheFactory } from './test-app/ttl-cache-options-factory/ttl-cache-options-factory';
import { TtlCacheOptionsFactoryModule } from './test-app/ttl-cache-options-factory/ttl-cache-options-factory.module';
import { TtlCache, TtlCacheModule, type TtlCacheOptions } from '../src';
import { TTL_CACHE_OPTIONS } from '../src/constants';

const testCacheOptions = (options: TtlCacheOptions, max?: number, ttl?: number): void => {
	expect(options).toBeDefined();
	expect(options.max).toBe(max);
	expect(options.ttl).toBe(ttl);
};

const testCacheProvider = (ttlCache: TtlCache): void => {
	expect(ttlCache).toBeDefined();
	expect(ttlCache).toHaveProperty('get');
	expect(ttlCache).toHaveProperty('set');
	expect(ttlCache).toHaveProperty('has');
	expect(ttlCache).toHaveProperty('delete');
};

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
		});

		test('TTL cache options should be defined', () => {
			testCacheOptions(app.get<TtlCacheOptions>(TTL_CACHE_OPTIONS), max, ttl);
		});

		test('TTL cache instance should be defined', () => {
			testCacheProvider(app.get(TtlCache));
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
		});

		test('TTL cache options should be defined', () => {
			testCacheOptions(app.get<TtlCacheOptions>(TTL_CACHE_OPTIONS));
		});

		test('TTL cache instance should be defined', () => {
			testCacheProvider(app.get(TtlCache));
		});
	});

	describe('TTL cache async options', () => {
		const max = 10000;
		const ttl = 50000;

		const testModule = async (app: INestApplication): Promise<void> => {
			await app.init();
			testCacheOptions(app.get<TtlCacheOptions>(TTL_CACHE_OPTIONS), max, ttl);
			testCacheProvider(app.get(TtlCache));
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
