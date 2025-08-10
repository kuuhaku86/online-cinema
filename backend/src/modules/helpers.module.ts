import { Module } from '@nestjs/common';
import { RedisHelper } from '../helpers/redis.helper';

@Module({
  providers: [RedisHelper],
  exports: [RedisHelper],
})
export class HelpersModule {}
