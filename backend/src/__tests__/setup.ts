import { prisma } from '../infrastructure/database/prisma.js';

beforeAll(async () => {
  // Ensure database is connected
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

// Increase timeout for database operations
jest.setTimeout(30000);
