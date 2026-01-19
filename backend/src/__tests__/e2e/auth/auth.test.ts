import request from 'supertest';
import { app } from '../../helpers/testApp.js';
import { cleanDatabase, createTestUser } from '../../helpers/testDb.js';

describe('Auth E2E Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'Password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: 'newuser@example.com',
        name: 'New User',
        role: 'CUSTOMER',
      });
      expect(response.body.data.token.accessToken).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          name: 'Test User',
          password: 'Password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token.accessToken).toBeDefined();
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const user = await createTestUser();
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      const token = loginResponse.body.data.token.accessToken;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
