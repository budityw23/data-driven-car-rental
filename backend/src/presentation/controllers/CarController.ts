import { Request, Response } from 'express';
import {
  GetCarsUseCase,
  GetCarByIdUseCase,
  CreateCarUseCase,
  UpdateCarUseCase,
} from '../../application/use-cases/car/index.js';
import { CarRepository } from '../../infrastructure/repositories/CarRepository.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { parsePagination } from '../../shared/utils/pagination.js';
import { CarFilters, CarSortOptions } from '../../domain/repositories/index.js';

// Initialize repository and use cases
const carRepository = new CarRepository();
const getCarsUseCase = new GetCarsUseCase(carRepository);
const getCarByIdUseCase = new GetCarByIdUseCase(carRepository);
const createCarUseCase = new CreateCarUseCase(carRepository);
const updateCarUseCase = new UpdateCarUseCase(carRepository);

export class CarController {
  static async getCars(req: Request, res: Response): Promise<Response> {
    const query = req.query;

    // Parse pagination
    const pagination = parsePagination({
      page: query.page as string,
      limit: query.limit as string,
    });

    // Parse filters
    const filters: CarFilters = {
      type: query.type as string | undefined,
      seats: query.seats ? Number(query.seats) : undefined,
      transmission: query.transmission as string | undefined,
      fuel: query.fuel as string | undefined,
      priceMin: query.priceMin ? Number(query.priceMin) : undefined,
      priceMax: query.priceMax ? Number(query.priceMax) : undefined,
      startDate: query.startDate ? new Date(query.startDate as string) : undefined,
      endDate: query.endDate ? new Date(query.endDate as string) : undefined,
      status: 'ACTIVE', // Only show active cars
    };

    // Parse sort
    const sort: CarSortOptions | undefined =
      query.sortBy && query.sortOrder
        ? {
            field: query.sortBy as any,
            order: query.sortOrder as 'asc' | 'desc',
          }
        : undefined;

    const result = await getCarsUseCase.execute(filters, pagination, sort);

    return sendSuccess(res, result.data, 200, result.meta);
  }

  static async getCarById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const car = await getCarByIdUseCase.execute(id);

    return sendSuccess(res, car);
  }

  static async createCar(req: Request, res: Response): Promise<Response> {
    const carData = req.body;

    const car = await createCarUseCase.execute(carData);

    return sendCreated(res, car);
  }

  static async updateCar(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const carData = req.body;

    const car = await updateCarUseCase.execute(id, carData);

    return sendSuccess(res, car);
  }
}
