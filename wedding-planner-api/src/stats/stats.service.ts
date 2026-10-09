import { Injectable } from '@nestjs/common';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  userCount: number;
  bookingCount: number;
  pendingBookingCount: number;
  postCount: number;
  publishedPostCount: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns dashboard counts using aggregate COUNT queries instead of fetching
   * every row, so the dashboard scales independently of table size.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [userCount, bookingCount, pendingBookingCount, postCount, publishedPostCount] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.appointment.count(),
        this.prisma.appointment.count({ where: { status: BookingStatus.PENDING } }),
        this.prisma.blogPost.count(),
        this.prisma.blogPost.count({ where: { published: true } }),
      ]);

    return { userCount, bookingCount, pendingBookingCount, postCount, publishedPostCount };
  }
}
