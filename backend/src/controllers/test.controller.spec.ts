import { Test, TestingModule } from '@nestjs/testing';
import { TestController } from './test.controller';
import { TestService, LivenessResponse } from '../services/test.service';

describe('TestController', () => {
  let controller: TestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [TestService], // Using the real TestService as it's simple
    }).compile();

    controller = module.get<TestController>(TestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLiveness', () => {
    it('should return a liveness status object from TestService', () => {
      const expectedResponse: LivenessResponse = {
        status: 'UP',
        message: 'Server is alive and kicking!',
      };
      expect(controller.getLiveness()).toEqual(expectedResponse);
    });
  });
});
