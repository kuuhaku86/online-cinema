import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';
import { CreateUserDto } from '../src/dto/users/create-user.dto';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';

const generateCredentials = (suffix: string) => ({
  username: `testuser_${suffix}`,
  email: `test_${suffix}@example.com`,
  password: 'Password123!',
  name: `Test User ${suffix}`,
});

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  const uniqueSuffix = Date.now().toString();
  const testUserCredentials: CreateUserDto = generateCredentials(uniqueSuffix);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply validation pipe globally to match main.ts setup
    // app.useGlobalPipes(
    //   new ValidationPipe({ whitelist: true, transform: true }),
    // );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUserCredentials)
      .expect(HttpStatus.CREATED);

    userId = registerResponse.body.id;
    expect(userId).toBeDefined();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUserCredentials.email,
        password: testUserCredentials.password,
      })
      .expect(HttpStatus.OK);

    accessToken = loginResponse.body.access_token;
    expect(accessToken).toBeDefined();
  });

  afterAll(async () => {
    if (dataSource && userId) {
      try {
        const userRepository = dataSource.getRepository(User);
        await userRepository.delete({ id: userId });
        console.log(`Cleaned up test user: ${userId}`);
      } catch (error) {
        console.error('Error during test user cleanup:', error);
      }
    }
    await app.close();
  });

  describe('GET /users/:id', () => {
    it('should return the user data (without password) when authenticated and user exists', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.id).toEqual(userId);
          expect(res.body.username).toEqual(testUserCredentials.username);
          expect(res.body.email).toEqual(testUserCredentials.email);
          expect(res.body.name).toEqual(testUserCredentials.name);
          expect(res.body).not.toHaveProperty('passwordHash');
          expect(res.body).not.toHaveProperty('currentHashedRefreshToken');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should return 401 Unauthorized when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized when an invalid token is provided', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', 'Bearer invalidtoken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 Not Found when requesting a non-existent user ID', () => {
      const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/users/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 Bad Request when the ID parameter is not a valid UUID', () => {
      const invalidId = 'not-a-uuid';
      return request(app.getHttpServer())
        .get(`/users/${invalidId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
