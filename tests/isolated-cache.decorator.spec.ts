import * as TTLCache from '@isaacs/ttlcache';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TtlCacheModule } from '../src';
import { IsolatedCacheTestService } from './test-app/isolated-cache-test.service';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../src/constants';

describe('IsolatedCache decorator test suite', () => {
	let app: NestApplication;

	beforeEach(async () => {
		const TestingModule = await Test.createTestingModule({
			imports: [TtlCacheModule.register({ isGlobal: true })],
			providers: [IsolatedCacheTestService]
		}).compile();

		app = TestingModule.createNestApplication();

		await app.init();
	});

	test('should have a static "__CACHE_INSTANCES__" property on isolated cache class', async () => {
		expect(Object.getOwnPropertySymbols(Object.getPrototypeOf(IsolatedCacheTestService))).toContain(
			CACHE_INSTANCES_PROPERTY
		);
		expect(typeof IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe('number');
	});

	test('should increment the static "__CACHE_INSTANCES__" property on new instance creation', async () => {
		await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(1);
		await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(2);
	});

	test('should have a "__CACHE_INSTANCE_ID__" property on the isolated cache instance', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(Object.getOwnPropertySymbols(isolatedCacheTestService)).toContain(CACHE_INSTANCE_ID_PROPERTY);
		expect(typeof isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY]).toBe('number');
	});

	test('should set the "__CACHE_INSTANCE_ID__" property equal to the static "__CACHE_INSTANCES__" property on the instance', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(
			isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY]
		);
	});

	test('should have a DI-injected cache service on the isolated cache instance', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(Object.getOwnPropertySymbols(isolatedCacheTestService)).toContain(CACHE_INSTANCE);
		expect(isolatedCacheTestService[CACHE_INSTANCE]).toBeInstanceOf(TTLCache);
	});
});
