import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { AvailabilityService } from './availability.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { CreateBlockedDateDto } from './dto/create-blocked-date.dto';
import { UpdateAvailabilitySettingsDto } from './dto/update-availability-settings.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /** Public: the slot grid a visitor browses before deciding to sign in. */
  @Public()
  @Get('calendar')
  getCalendar(@Query() query: CalendarQueryDto) {
    return this.availabilityService.getCalendar(query);
  }

  /** Public: opening hours and timezone, so the site can label times. */
  @Public()
  @Get('settings')
  getSettings() {
    return this.availabilityService.getSettings();
  }

  @Roles(Role.ADMIN)
  @Put('settings')
  updateSettings(@Body() dto: UpdateAvailabilitySettingsDto) {
    return this.availabilityService.updateSettings(dto);
  }

  @Public()
  @Get('blocked-dates')
  listBlockedDates() {
    return this.availabilityService.listBlockedDates();
  }

  @Roles(Role.ADMIN)
  @Post('blocked-dates')
  addBlockedDate(@Body() dto: CreateBlockedDateDto) {
    return this.availabilityService.addBlockedDate(dto);
  }

  @Roles(Role.ADMIN)
  @Delete('blocked-dates/:id')
  removeBlockedDate(@Param('id', ParseCuidPipe) id: string) {
    return this.availabilityService.removeBlockedDate(id);
  }
}
