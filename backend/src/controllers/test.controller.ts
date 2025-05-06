import { Controller, Get } from '@nestjs/common';
import { TestService, LivenessResponse } from '../services/test.service';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('liveness')
  getLiveness(): LivenessResponse {
    return this.testService.getLiveness();
  }
}
