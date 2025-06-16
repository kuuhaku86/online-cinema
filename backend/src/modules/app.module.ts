import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { TestController } from '../controllers/test.controller';
import { TestService } from '../services/test.service';
import { DatabaseModule } from './database.module';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';
import { RoomModule } from './room.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, RoomModule],
  controllers: [AppController, TestController],
  providers: [AppService, TestService],
})
export class AppModule {}
