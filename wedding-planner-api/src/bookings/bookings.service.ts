import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

/** Requester details the admin screens need; never sent to the public site. */
const REQUESTER_SELECT = {
  user: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  /**
   * Creates a PENDING request for a slot. Several visitors may hold pending
   * requests for the same slot - the slot is only taken once the planner
   * confirms one of them - but one visitor cannot stack up duplicates.
   */
  async create(userId: string, dto: CreateBookingDto) {
    const { slotStart, slotEnd } = await this.availability.resolveBookableSlot(
      dto.slotStart,
    );

    const [confirmed, ownRequest] = await Promise.all([
      // Overlap rather than an exact match, so a confirmed appointment still
      // blocks its hours after the admin changes the slot length.
      this.prisma.appointment.findFirst({
        where: {
          status: BookingStatus.CONFIRMED,
          slotStart: { lt: slotEnd },
          slotEnd: { gt: slotStart },
        },
        select: { id: true },
      }),
      this.prisma.appointment.findFirst({
        where: {
          slotStart,
          userId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
        select: { id: true },
      }),
    ]);

    if (confirmed) {
      throw new ConflictException(
        'That time has just been booked. Please choose another.',
      );
    }
    if (ownRequest) {
      throw new ConflictException('You have already requested that time.');
    }

    return this.prisma.appointment.create({
      data: {
        userId,
        slotStart,
        slotEnd,
        message: dto.message,
        status: BookingStatus.PENDING,
      },
    });
  }

  findMine(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { slotStart: 'desc' },
    });
  }

  findAll() {
    return this.prisma.appointment.findMany({
      include: REQUESTER_SELECT,
      orderBy: { slotStart: 'desc' },
    });
  }

  /**
   * Confirming a request claims its slot exclusively: inside one transaction we
   * re-check that nobody else holds it, confirm this one, and cancel the rival
   * pending requests for the same slot. `supersededCount` tells the admin how
   * many other people were turned down by the decision.
   */
  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Booking not found');
    }

    if (dto.status !== BookingStatus.CONFIRMED) {
      const updated = await this.prisma.appointment.update({
        where: { id },
        data: { status: dto.status },
        include: REQUESTER_SELECT,
      });
      return { ...updated, supersededCount: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      const clash = await tx.appointment.findFirst({
        where: {
          id: { not: id },
          status: BookingStatus.CONFIRMED,
          slotStart: { lt: existing.slotEnd },
          slotEnd: { gt: existing.slotStart },
        },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException(
          'Another appointment already overlaps that time.',
        );
      }

      const confirmed = await tx.appointment.update({
        where: { id },
        data: { status: BookingStatus.CONFIRMED },
        include: REQUESTER_SELECT,
      });

      // Anyone whose pending request overlaps the confirmed hours can no
      // longer have it, so decline those too rather than leave them hanging.
      const superseded = await tx.appointment.updateMany({
        where: {
          id: { not: id },
          status: BookingStatus.PENDING,
          slotStart: { lt: existing.slotEnd },
          slotEnd: { gt: existing.slotStart },
        },
        data: { status: BookingStatus.CANCELLED },
      });

      return { ...confirmed, supersededCount: superseded.count };
    });
  }
}
