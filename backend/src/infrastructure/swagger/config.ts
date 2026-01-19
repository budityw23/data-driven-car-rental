import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Car Rental API',
      version: '1.0.0',
      description: 'Data-Driven Car Rental Backend API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@carrental.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Validation failed' },
                details: { type: 'object' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Car: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            brand: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            type: { type: 'string', enum: ['SUV', 'SEDAN', 'HATCHBACK', 'MPV', 'VAN'] },
            seats: { type: 'integer' },
            transmission: { type: 'string', enum: ['AT', 'MT'] },
            fuel: { type: 'string', enum: ['GAS', 'DIESEL', 'EV'] },
            dailyPrice: { type: 'number' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] },
            images: { type: 'array', items: { type: 'string' } },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            carId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            days: { type: 'integer' },
            basePrice: { type: 'number' },
            addonPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED'] },
          },
        },
        Location: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            address: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Addon: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            pricePerBooking: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Cars', description: 'Car management endpoints' },
      { name: 'Bookings', description: 'Booking management endpoints' },
      { name: 'Locations', description: 'Location endpoints' },
      { name: 'Addons', description: 'Addon endpoints' },
      { name: 'Admin', description: 'Admin-only endpoints' },
    ],
  },
  apis: ['./src/presentation/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
