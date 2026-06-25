import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateBookingDto) {
    return this.prisma.appointment.create({
      data: {
        userId,
        eventDate: new Date(dto.eventDate),
        message: dto.message,
        status: BookingStatus.PENDING,
      },
    });
  }

  findMine(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { eventDate: 'desc' },
    });
  }

  findAll() {
    return this.prisma.appointment.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { eventDate: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Booking not found');
    }
    return this.prisma.appointment.update({ where: { id }, data: { status: dto.status } });
  }
}
