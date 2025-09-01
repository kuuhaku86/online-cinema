import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { TestController } from '../controllers/test.controller';
import { TestService } from '../services/test.service';
import { DatabaseModule } from './database.module';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';
import { RoomsModule } from './rooms.module';
import { VideosModule } from './videos.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from 'src/configs/redis-options.constants';
import { HelpersModule } from './helpers.module';
import { MessagesModule } from './messages.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    RoomsModule,
    VideosModule,
    MessagesModule,
    HelpersModule,
    CacheModule.register({ isGlobal: true }),
    CacheModule.registerAsync(RedisOptions),
  ],
  controllers: [AppController, TestController],
  providers: [AppService, TestService],
})
export class AppModule {}
