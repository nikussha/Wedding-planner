import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.findMine(user.id);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  updateStatus(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto);
  }
}
