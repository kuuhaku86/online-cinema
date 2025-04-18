import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { DatabaseModule } from './database.module';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
@Module({
  imports: [DatabaseModule],
})
export class AppModule {}
