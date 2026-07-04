import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisHelper } from './redis.helper';

describe('RedisHelper', () => {
  let helper: RedisHelper;
  let cacheManager: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisHelper, { provide: CACHE_MANAGER, useValue: cacheManager }],
    }).compile();

    helper = module.get<RedisHelper>(RedisHelper);
  });

  it('should be defined', () => {
    expect(helper).toBeDefined();
  });

  describe('set', () => {
    it('should set a value with stringification', async () => {
      await helper.set('key1', { foo: 'bar' }, 60);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'key1',
        '{"foo":"bar"}',
        60,
      );
    });

    it('should set a value without TTL if not provided', async () => {
      await helper.set('key1', 'simple value');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'key1',
        '"simple value"',
        undefined,
      );
    });
  });

  describe('get', () => {
    it('should get and parse a JSON value', async () => {
      cacheManager.get.mockResolvedValue('{"foo":"bar"}');

      const result = await helper.get('key1');

      expect(cacheManager.get).toHaveBeenCalledWith('key1');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return undefined when key does not exist', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await helper.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return undefined when JSON parse fails', async () => {
      cacheManager.get.mockResolvedValue('not-valid-json');

      const result = await helper.get('bad-data');

      expect(result).toBeUndefined();
    });
  });
});
