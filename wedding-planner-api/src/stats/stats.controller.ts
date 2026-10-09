import { Controller, Get } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { StatsService } from './stats.service';

@Roles(Role.ADMIN)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getDashboardStats() {
    return this.statsService.getDashboardStats();
  }
}
