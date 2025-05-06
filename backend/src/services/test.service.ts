import { Injectable } from '@nestjs/common';

export interface LivenessResponse {
  status: string;
  message: string;
}

@Injectable()
export class TestService {
  getLiveness(): LivenessResponse {
    return {
      status: 'UP',
      message: 'Server is alive and kicking!',
    };
  }
}
