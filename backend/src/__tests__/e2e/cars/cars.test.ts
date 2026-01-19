import request from 'supertest';
import { app, generateTestToken, getAuthHeader } from '../../helpers/testApp.js';
import { cleanDatabase, createTestUser, createTestAdmin, createTestCar } from '../../helpers/testDb.js';
import { UserRole } from '@prisma/client';

describe('Cars E2E Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/cars', () => {
    it('should get all cars with pagination', async () => {
      await createTestCar();
      await createTestCar({ model: 'Accord' });

      const response = await request(app).get('/api/cars');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter cars by type', async () => {
      await createTestCar({ type: 'SEDAN' });
      await createTestCar({ type: 'SUV', model: 'Fortuner' });

      const response = await request(app).get('/api/cars?type=SEDAN');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].type).toBe('SEDAN');
    });

    it('should filter cars by seats', async () => {
      await createTestCar({ seats: 5 });
      await createTestCar({ seats: 7, model: 'Innova' });

      const response = await request(app).get('/api/cars?seats=7');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].seats).toBe(7);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestCar({ model: `Car ${i}` });
      }

      const response = await request(app).get('/api/cars?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNextPage: true,
      });
    });
  });

  describe('GET /api/cars/:id', () => {
    it('should get car by id', async () => {
      const car = await createTestCar();

      const response = await request(app).get(`/api/cars/${car.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(car.id);
      expect(response.body.data.model).toBe('Camry');
    });

    it('should return 404 for non-existent car', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/cars/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/cars/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/cars', () => {
    it('should create a car as admin', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin.id, admin.email, UserRole.ADMIN);

      const response = await request(app)
        .post('/api/cars')
        .set('Authorization', getAuthHeader(token))
        .send({
          brand: 'Honda',
          model: 'Civic',
          year: 2024,
          type: 'SEDAN',
          seats: 5,
          transmission: 'AT',
          fuel: 'GAS',
          dailyPrice: '600000',
          images: ['civic-1.jpg'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.model).toBe('Civic');
      expect(response.body.data.status).toBe('ACTIVE');
    });

    it('should return 403 for non-admin user', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email, UserRole.CUSTOMER);

      const response = await request(app)
        .post('/api/cars')
        .set('Authorization', getAuthHeader(token))
        .send({
          brand: 'Honda',
          model: 'Civic',
          year: 2024,
          type: 'SEDAN',
          seats: 5,
          transmission: 'AT',
          fuel: 'GAS',
          dailyPrice: '600000',
          images: ['civic-1.jpg'],
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/cars').send({
        brand: 'Honda',
        model: 'Civic',
        year: 2024,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/cars/:id', () => {
    it('should update a car as admin', async () => {
      const admin = await createTestAdmin();
      const car = await createTestCar();
      const token = generateTestToken(admin.id, admin.email, UserRole.ADMIN);

      const response = await request(app)
        .patch(`/api/cars/${car.id}`)
        .set('Authorization', getAuthHeader(token))
        .send({
          dailyPrice: '700000',
          status: 'MAINTENANCE',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.dailyPrice).toBe('700000');
      expect(response.body.data.status).toBe('MAINTENANCE');
    });

    it('should return 404 for non-existent car', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin.id, admin.email, UserRole.ADMIN);
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .patch(`/api/cars/${fakeId}`)
        .set('Authorization', getAuthHeader(token))
        .send({ dailyPrice: '700000' });

      expect(response.status).toBe(404);
    });
  });
});
