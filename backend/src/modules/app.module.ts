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
import { ChatGateway } from 'src/gateways/chat.gateway';
import { RoomGateway } from 'src/gateways/room.gateway';

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
  providers: [AppService, TestService, ChatGateway, RoomGateway],
})
export class AppModule {}
