import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  HttpStatus,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';
import { CreateUserDto } from '../src/dto/users/create-user.dto';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { AuthService } from '../src/services/auth.service';

const generateCredentials = (suffix: string): CreateUserDto => ({
  username: `e2e_user_${suffix}`,
  email: `e2e_${suffix}@example.com`,
  password: 'Password123!',
  name: `E2E Test User ${suffix}`,
});

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService; // Optional: If direct service interaction is needed
  let createdUserIds: string[] = [];

  const uniqueSuffix = Date.now().toString();
  const userCredentials = generateCredentials(uniqueSuffix);
  const userCredentialsForConflictTest = generateCredentials(
    uniqueSuffix + '_conflict',
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply validation pipe globally to match main.ts/app setup
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        validationError: { target: false },
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    if (dataSource && createdUserIds.length > 0) {
      try {
        const userRepository = dataSource.getRepository(User);
        console.log(`Cleaning up test users: ${createdUserIds.join(', ')}`);
        await userRepository.delete(createdUserIds);
      } catch (error) {
        console.error('Error during test user cleanup:', error);
      }
    }
    await app.close();
  });

  let registeredUserId: string;
  let accessToken: string;
  let refreshToken: string;

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(HttpStatus.CREATED);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.username).toEqual(userCredentials.username);
      expect(response.body.email).toEqual(userCredentials.email);
      expect(response.body.name).toEqual(userCredentials.name);
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('currentHashedRefreshToken');

      registeredUserId = response.body.id;
      createdUserIds.push(registeredUserId);
    });

    it('should return 409 Conflict when registering with an existing username', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 409 Conflict when registering with an existing email', async () => {
      const conflictingEmailCredentials = {
        ...generateCredentials(uniqueSuffix + '_email_conflict'),
        email: userCredentials.email,
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(conflictingEmailCredentials)
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 400 Bad Request for invalid registration data (e.g., missing fields)', async () => {
      const { password, ...invalidData } = generateCredentials(
        uniqueSuffix + '_invalid',
      );

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST); // 400
    });

    it('should return 400 Bad Request for invalid email format', async () => {
      const invalidData = { ...userCredentials, email: 'not-an-email' };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login the registered user successfully and return tokens', async () => {
      expect(registeredUserId).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();

      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          password: 'WrongPassword!',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistentuser',
          password: userCredentials.password,
        })
        .expect(HttpStatus.UNAUTHORIZED); // 401
    });

    it('should return 400 Bad Request if email/password is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: userCredentials.email })
        .expect(HttpStatus.UNAUTHORIZED);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: userCredentials.password })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens successfully using a valid refresh token', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(refreshToken).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(HttpStatus.OK); // 200

      expect(response.body).toBeDefined();
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      expect(response.body.access_token).not.toEqual(accessToken);
      expect(response.body.refresh_token).not.toEqual(refreshToken);

      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
    });

    it('should return 401 Unauthorized when using an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalidrefreshtoken' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized when no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized when using an access token instead of a refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: accessToken })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout the user successfully', async () => {
      expect(accessToken).toBeDefined();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.message).toContain('Logout successful');
        });
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized when trying to logout without a token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized when trying to logout with an invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalidaccesstoken')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized when trying to logout with a refresh token', async () => {
      const logoutSuffix = uniqueSuffix + '_logout';
      const logoutCreds = generateCredentials(logoutSuffix);
      const regRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(logoutCreds);
      createdUserIds.push(regRes.body.id);
      const logRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: logoutCreds.email,
          password: logoutCreds.password,
        });
      const tempRefreshToken = logRes.body.refresh_token;

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${tempRefreshToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
