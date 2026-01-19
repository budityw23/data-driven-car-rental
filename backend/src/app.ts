import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import logger from './infrastructure/logger/index.js';
import { prisma } from './infrastructure/database/prisma.js';
import { swaggerSpec } from './infrastructure/swagger/index.js';
import { errorHandler, apiLimiter } from './presentation/middlewares/index.js';
import apiRoutes from './presentation/routes/index.js';

dotenv.config();

const app: Express = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Car Rental API Docs',
}));

// Health check
app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    logger.error('Database health check failed', { error });
  }

  res.status(200).json({
    success: true,
    data: {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: { status: dbStatus },
    },
  });
});

// Rate limiting (apply to all API routes)
app.use('/api', apiLimiter);

// API routes
app.use('/api', apiRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use(errorHandler);

export default app;
