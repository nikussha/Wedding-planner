import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Booking, BookingStatus } from '../../core/models/booking.model';
import { AvailabilityService } from '../../core/services/availability.service';
import { BookingsService } from '../../core/services/bookings.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import { formatPlannerDate, formatPlannerTimeRange } from '../../core/utils/planner-time.util';

/** A booking with its slot rendered in the planner's own working hours. */
interface BookingRow extends Booking {
  dateLabel: string;
  timeLabel: string;
}

/** All the requests competing for one slot. */
interface SlotGroup {
  slotStart: string;
  dateLabel: string;
  timeLabel: string;
  requests: BookingRow[];
}

@Component({
  selector: 'app-bookings',
  imports: [DatePipe, RouterLink],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent implements OnInit {
  private readonly bookingsService = inject(BookingsService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly notifications = inject(NotificationService);

  constructor() {
    inject(Title).setTitle('Bookings | Wedding Planner Admin');
  }

  readonly bookings = signal<BookingRow[]>([]);
  readonly loading = signal(true);
  readonly updatingId = signal<string | null>(null);
  readonly timezoneLabel = signal('');

  /** Pending requests, grouped by slot so competition is visible. */
  readonly pendingGroups = computed<SlotGroup[]>(() => {
    const groups = new Map<string, SlotGroup>();

    for (const booking of this.bookings()) {
      if (booking.status !== 'PENDING') continue;

      const group = groups.get(booking.slotStart) ?? {
        slotStart: booking.slotStart,
        dateLabel: booking.dateLabel,
        timeLabel: booking.timeLabel,
        requests: [],
      };
      group.requests.push(booking);
      groups.set(booking.slotStart, group);
    }

    return [...groups.values()].sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  });

  readonly upcomingConfirmed = computed(() => {
    const now = new Date().toISOString();
    return this.bookings()
      .filter((booking) => booking.status === 'CONFIRMED' && booking.slotStart >= now)
      .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  });

  /** Everything settled: past appointments and declined requests. */
  readonly archive = computed(() => {
    const now = new Date().toISOString();
    return this.bookings()
      .filter(
        (booking) =>
          booking.status === 'CANCELLED' ||
          (booking.status === 'CONFIRMED' && booking.slotStart < now) ||
          (booking.status === 'PENDING' && booking.slotStart < now),
      )
      .sort((a, b) => b.slotStart.localeCompare(a.slotStart));
  });

  ngOnInit(): void {
    this.load();
  }

  badgeClass(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'badge-confirmed';
      case 'CANCELLED':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  }

  statusLabel(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CANCELLED':
        return 'Declined';
      default:
        return 'Awaiting';
    }
  }

  confirm(booking: BookingRow): void {
    this.change(booking, 'CONFIRMED');
  }

  decline(booking: BookingRow): void {
    this.change(booking, 'CANCELLED');
  }

  private change(booking: BookingRow, status: BookingStatus): void {
    this.updatingId.set(booking.id);

    this.bookingsService.updateStatus(booking.id, status).subscribe({
      next: (result) => {
        this.updatingId.set(null);

        if (status === 'CONFIRMED') {
          const also =
            result.supersededCount > 0
              ? ` ${result.supersededCount} other request${result.supersededCount === 1 ? '' : 's'} for that time ${result.supersededCount === 1 ? 'was' : 'were'} declined.`
              : '';
          this.notifications.success(
            `Confirmed ${booking.dateLabel}, ${booking.timeLabel}.${also}`,
          );
        } else {
          this.notifications.info(`Declined ${booking.dateLabel}, ${booking.timeLabel}.`);
        }

        // Confirming changes other rows too, so reload rather than patch locally.
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.updatingId.set(null);
        this.notifications.error(
          extractErrorMessage(error, 'Could not update that booking. Please try again.'),
        );
        this.load();
      },
    });
  }

  private load(): void {
    this.loading.set(true);

    forkJoin({
      bookings: this.bookingsService.getAll(),
      settings: this.availabilityService.getSettings(),
    }).subscribe({
      next: ({ bookings, settings }) => {
        const offset = settings.timezoneOffsetMinutes;
        this.timezoneLabel.set(settings.timezoneLabel);
        this.bookings.set(
          bookings.map((booking) => ({
            ...booking,
            dateLabel: formatPlannerDate(booking.slotStart, offset),
            timeLabel: formatPlannerTimeRange(booking.slotStart, booking.slotEnd, offset),
          })),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
