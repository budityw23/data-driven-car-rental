import { AnalyticsRepository, DashboardStats } from '../../../infrastructure/repositories/AnalyticsRepository.js';

export class GetDashboardStatsUseCase {
  constructor(private analyticsRepository: AnalyticsRepository) {}

  async execute(): Promise<DashboardStats> {
    return this.analyticsRepository.getDashboardStats();
  }
}
