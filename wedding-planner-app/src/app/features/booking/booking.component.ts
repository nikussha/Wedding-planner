import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AvailabilityCalendar,
  CalendarDay,
  CalendarSlot,
  DateKey,
} from '../../core/models/availability.model';
import { Booking } from '../../core/models/booking.model';
import { AuthService } from '../../core/services/auth.service';
import { AvailabilityService } from '../../core/services/availability.service';
import { BookingService } from '../../core/services/booking.service';
import { SeoService } from '../../core/services/seo.service';
import {
  addMonths,
  endOfWeek,
  firstDayOfMonth,
  formatDayAndMonth,
  formatFullDate,
  lastDayOfMonth,
  monthOf,
  startOfWeek,
  toPlannerParts,
  todayKey,
} from '../../core/utils/calendar.util';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import { MonthCalendarComponent } from './month-calendar.component';

/** Where a guest's chosen slot waits while they sign in. */
const PENDING_SELECTION_KEY = 'booking.pendingSelection';

interface PendingSelection {
  date: DateKey;
  slotStart: string;
}

@Component({
  selector: 'app-booking',
  imports: [ReactiveFormsModule, RouterLink, MonthCalendarComponent],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit {
  private readonly availabilityService = inject(AvailabilityService);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    const seo = inject(SeoService);
    seo.setPage({
      title: 'Book a consultation',
      description:
        'Choose a day and time for a free, no-obligation consultation about your wedding.',
      path: '/booking',
    });
    seo.setBreadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Book a consultation', path: '/booking' },
    ]);
  }

  readonly today = todayKey();

  readonly month = signal(monthOf(this.today));
  readonly calendar = signal<AvailabilityCalendar | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly selectedDate = signal<DateKey | null>(null);
  readonly selectedSlotStart = signal<string | null>(null);

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly confirmation = signal<Booking | null>(null);
  readonly myBookings = signal<Booking[]>([]);

  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly message = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(2000)],
  });

  readonly days = computed<CalendarDay[]>(() => this.calendar()?.days ?? []);

  readonly selectedDay = computed<CalendarDay | null>(() => {
    const date = this.selectedDate();
    return date ? (this.days().find((day) => day.date === date) ?? null) : null;
  });

  readonly selectedSlot = computed<CalendarSlot | null>(() => {
    const start = this.selectedSlotStart();
    return start ? (this.selectedDay()?.slots.find((slot) => slot.start === start) ?? null) : null;
  });

  readonly timezoneLabel = computed(() => this.calendar()?.timezoneLabel ?? '');

  readonly slotLengthLabel = computed(() => {
    const minutes = this.calendar()?.slotMinutes ?? 120;
    if (minutes % 60 !== 0) return `${minutes} minutes`;
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  });

  readonly canGoBack = computed(() => this.month() > monthOf(this.today));

  readonly canGoForward = computed(() => {
    const last = this.calendar()?.lastBookableDate;
    return last ? this.month() < monthOf(last) : true;
  });

  /**
   * Why the chosen day has nothing left. A day whose times have simply passed
   * must not be described as booked - that would claim a reservation nobody
   * holds.
   */
  readonly selectedDayNote = computed<string | null>(() => {
    const day = this.selectedDay();
    if (!day?.open || day.totalCount === 0 || day.freeCount > 0) return null;

    return day.slots.some((slot) => slot.state === 'RESERVED')
      ? 'This date is fully booked.'
      : 'There are no times left to request on this date.';
  });

  /** Shown when the chosen day has nothing left, so the visitor is never stuck. */
  readonly nextOpening = computed<{ date: DateKey; label: string; slotStart: string } | null>(() => {
    const from = this.selectedDate();
    if (!from) return null;

    for (const day of this.days()) {
      if (day.date <= from || day.freeCount === 0) continue;
      const slot = day.slots.find((candidate) => candidate.state === 'FREE');
      if (!slot) continue;

      return {
        date: day.date,
        slotStart: slot.start,
        label: `${formatDayAndMonth(day.date)}, ${slot.startLabel}`,
      };
    }
    return null;
  });

  /** Slot times are only meaningful once the planner's offset is known. */
  readonly myRequests = computed(() => {
    const offset = this.calendar()?.timezoneOffsetMinutes;
    if (offset === undefined) return [];

    return this.myBookings()
      .filter((booking) => booking.status !== 'CANCELLED' || this.isRecent(booking))
      .map((booking) => ({
        ...booking,
        dateLabel: formatFullDate(toPlannerParts(booking.slotStart, offset).date),
        timeLabel: this.timeRange(booking, offset),
        statusLabel: this.statusLabel(booking.status),
      }));
  });

  readonly confirmationDetails = computed(() => {
    const booking = this.confirmation();
    const offset = this.calendar()?.timezoneOffsetMinutes;
    if (!booking || offset === undefined) return null;

    return {
      reference: booking.id.slice(-6).toUpperCase(),
      dateLabel: formatFullDate(toPlannerParts(booking.slotStart, offset).date),
      timeLabel: this.timeRange(booking, offset),
    };
  });

  /** Announced to screen readers when the day's availability changes. */
  readonly liveMessage = computed(() => {
    if (this.loading()) return 'Loading availability';
    const day = this.selectedDay();
    if (!day) return '';

    const note = this.selectedDayNote();
    if (note) return `${formatDayAndMonth(day.date)}: ${note}`;
    if (day.freeCount === 0) return `${formatDayAndMonth(day.date)} has no times`;
    return `${formatDayAndMonth(day.date)}: ${day.freeCount} of ${day.totalCount} times available`;
  });

  readonly formatDayAndMonth = formatDayAndMonth;

  ngOnInit(): void {
    this.loadMonth(this.month());
    this.loadMyBookings();
  }

  onMonthStepped(event: { delta: number; focusDate: DateKey }): void {
    const next = addMonths(this.month(), event.delta);
    if (event.delta < 0 && !this.canGoBack()) return;
    if (event.delta > 0 && !this.canGoForward()) return;

    this.month.set(next);
    this.loadMonth(next);
  }

  selectDate(date: DateKey): void {
    this.selectedDate.set(date);
    this.selectedSlotStart.set(null);
    this.submitError.set(null);
  }

  selectSlot(slot: CalendarSlot): void {
    if (slot.state !== 'FREE') return;
    this.selectedSlotStart.set(slot.start);
    this.submitError.set(null);
  }

  jumpToNextOpening(): void {
    const opening = this.nextOpening();
    if (!opening) return;

    this.selectedDate.set(opening.date);
    this.selectedSlotStart.set(opening.slotStart);
  }

  submit(): void {
    const slot = this.selectedSlot();
    if (!slot || this.submitting()) return;

    if (!this.isAuthenticated()) {
      this.stashSelection({ date: this.selectedDate()!, slotStart: slot.start });
      void this.router.navigate(['/login'], { queryParams: { redirect: '/booking' } });
      return;
    }

    if (this.message.invalid) {
      this.message.markAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const note = this.message.value.trim();
    this.bookingService
      .create({ slotStart: slot.start, message: note || undefined })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (booking) => {
          this.confirmation.set(booking);
          this.message.reset();
          this.selectedSlotStart.set(null);
          this.loadMonth(this.month());
          this.loadMyBookings();
        },
        error: (error: HttpErrorResponse) => {
          this.submitError.set(
            extractErrorMessage(error, 'Could not send your request. Please try again.'),
          );
          // The slot may have just been taken by someone else.
          this.loadMonth(this.month());
        },
      });
  }

  chooseAnotherTime(): void {
    this.confirmation.set(null);
    this.submitError.set(null);
  }

  private loadMonth(month: string): void {
    const from = startOfWeek(firstDayOfMonth(month));
    const to = endOfWeek(lastDayOfMonth(month));

    this.loading.set(true);
    this.availabilityService
      .getCalendar(from, to)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (calendar) => {
          this.calendar.set(calendar);
          this.loadError.set(null);
          this.restoreStashedSelection();
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(
            extractErrorMessage(error, 'Could not load the calendar. Please try again.'),
          );
        },
      });
  }

  private loadMyBookings(): void {
    this.bookingService.mine().subscribe({
      next: (bookings) => this.myBookings.set(bookings),
      // A logged-out visitor simply has no requests to show.
      error: () => this.myBookings.set([]),
    });
  }

  /** Keeps a guest's chosen slot across the trip to the login page. */
  private stashSelection(selection: PendingSelection): void {
    if (!this.isBrowser) return;
    try {
      sessionStorage.setItem(PENDING_SELECTION_KEY, JSON.stringify(selection));
    } catch {
      // Private browsing or blocked storage: the visitor just re-picks a time.
    }
  }

  private restoreStashedSelection(): void {
    if (!this.isBrowser || !this.isAuthenticated() || this.selectedSlotStart()) return;

    let stashed: PendingSelection | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_SELECTION_KEY);
      stashed = raw ? (JSON.parse(raw) as PendingSelection) : null;
    } catch {
      stashed = null;
    }
    if (!stashed) return;

    const day = this.days().find((candidate) => candidate.date === stashed!.date);
    const slot = day?.slots.find((candidate) => candidate.start === stashed!.slotStart);

    try {
      sessionStorage.removeItem(PENDING_SELECTION_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }

    if (!day || !slot) return;
    this.selectedDate.set(day.date);
    if (slot.state === 'FREE') {
      this.selectedSlotStart.set(slot.start);
    } else {
      this.submitError.set('That time was taken while you signed in. Please choose another.');
    }
  }

  private timeRange(booking: Booking, offsetMinutes: number): string {
    const from = toPlannerParts(booking.slotStart, offsetMinutes).clock;
    const to = toPlannerParts(booking.slotEnd, offsetMinutes).clock;
    return `${from} – ${to}`;
  }

  private statusLabel(status: Booking['status']): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CANCELLED':
        return 'Not available';
      default:
        return 'Awaiting confirmation';
    }
  }

  private isRecent(booking: Booking): boolean {
    const thirtyDays = 30 * 86_400_000;
    return Date.now() - new Date(booking.updatedAt).getTime() < thirtyDays;
  }
}
