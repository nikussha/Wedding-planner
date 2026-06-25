import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Booking, BookingStatus } from '../../core/models/booking.model';
import { BookingsService } from '../../core/services/bookings.service';

const STATUS_OPTIONS: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED'];

@Component({
  selector: 'app-bookings',
  imports: [DatePipe],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent implements OnInit {
  private readonly bookingsService = inject(BookingsService);

  constructor() {
    inject(Title).setTitle('Bookings | Wedding Planner Admin');
  }

  readonly statusOptions = STATUS_OPTIONS;
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly updatingId = signal<string | null>(null);

  ngOnInit(): void {
    this.bookingsService.getAll().subscribe((bookings) => {
      this.bookings.set(bookings);
      this.loading.set(false);
    });
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

  updateStatus(booking: Booking, status: BookingStatus): void {
    if (status === booking.status) return;

    this.updatingId.set(booking.id);
    this.bookingsService.updateStatus(booking.id, status).subscribe((updated) => {
      this.bookings.update((bookings) =>
        bookings.map((b) => (b.id === booking.id ? { ...b, status: updated.status } : b)),
      );
      this.updatingId.set(null);
    });
  }
}
