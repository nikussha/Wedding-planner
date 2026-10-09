import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { forkJoin, finalize } from 'rxjs';
import { BlockedDate } from '../../core/models/availability.model';
import { AvailabilityService } from '../../core/services/availability.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import { formatCalendarDate } from '../../core/utils/planner-time.util';

/** Monday-first, matching the order the public calendar lays its grid out. */
const WEEKDAYS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

@Component({
  selector: 'app-availability',
  imports: [ReactiveFormsModule],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss',
})
export class AvailabilityComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly notifications = inject(NotificationService);

  constructor() {
    inject(Title).setTitle('Opening Hours | Wedding Planner Admin');
  }

  readonly weekdays = WEEKDAYS;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly blockedDates = signal<BlockedDate[]>([]);
  readonly removingId = signal<string | null>(null);
  readonly addingBlockedDate = signal(false);

  /** Which weekdays are open, as a set of 0-6. */
  readonly openWeekdays = signal<ReadonlySet<number>>(new Set([1, 2, 3, 4, 5, 6]));

  readonly form = this.fb.nonNullable.group({
    slotMinutes: [120, [Validators.required, Validators.min(15), Validators.max(480)]],
    dayStartHour: [10, [Validators.required, Validators.min(0), Validators.max(23)]],
    dayEndHour: [18, [Validators.required, Validators.min(1), Validators.max(24)]],
    leadTimeHours: [24, [Validators.required, Validators.min(0), Validators.max(2160)]],
    horizonDays: [365, [Validators.required, Validators.min(1), Validators.max(1095)]],
    timezoneOffsetMinutes: [240, [Validators.required, Validators.min(-720), Validators.max(840)]],
    timezoneLabel: ['GMT+4', [Validators.required, Validators.maxLength(32)]],
  });

  readonly blockForm = this.fb.nonNullable.group({
    date: ['', [Validators.required]],
    reason: ['', [Validators.maxLength(200)]],
  });

  /** The times these settings produce, so the effect is visible before saving. */
  readonly slotPreview = signal<string[]>([]);

  readonly previewSummary = computed(() => {
    const slots = this.slotPreview();
    if (slots.length === 0) return 'These hours produce no bookable times.';
    return `${slots.length} time${slots.length === 1 ? '' : 's'} per open day`;
  });

  ngOnInit(): void {
    this.load();
    this.form.valueChanges.subscribe(() => this.updatePreview());
  }

  isOpen(weekday: number): boolean {
    return this.openWeekdays().has(weekday);
  }

  toggleWeekday(weekday: number): void {
    this.openWeekdays.update((current) => {
      const next = new Set(current);
      if (next.has(weekday)) {
        next.delete(weekday);
      } else {
        next.add(weekday);
      }
      return next;
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.openWeekdays().size === 0) {
      this.notifications.error('Choose at least one open day.');
      return;
    }

    this.saving.set(true);
    this.availabilityService
      .updateSettings({
        ...this.form.getRawValue(),
        openWeekdays: [...this.openWeekdays()].sort((a, b) => a - b),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.notifications.success('Opening hours saved.'),
        error: (error: HttpErrorResponse) =>
          this.notifications.error(
            extractErrorMessage(error, 'Could not save the opening hours.'),
          ),
      });
  }

  addBlockedDate(): void {
    if (this.blockForm.invalid) {
      this.blockForm.markAllAsTouched();
      return;
    }

    const { date, reason } = this.blockForm.getRawValue();
    this.addingBlockedDate.set(true);

    this.availabilityService
      .addBlockedDate(date, reason.trim() || undefined)
      .pipe(finalize(() => this.addingBlockedDate.set(false)))
      .subscribe({
        next: () => {
          this.notifications.success(`${formatCalendarDate(date)} closed.`);
          this.blockForm.reset({ date: '', reason: '' });
          this.loadBlockedDates();
        },
        error: (error: HttpErrorResponse) =>
          this.notifications.error(extractErrorMessage(error, 'Could not close that date.')),
      });
  }

  removeBlockedDate(blocked: BlockedDate): void {
    this.removingId.set(blocked.id);

    this.availabilityService
      .removeBlockedDate(blocked.id)
      .pipe(finalize(() => this.removingId.set(null)))
      .subscribe({
        next: () => {
          this.notifications.info(`${this.dateLabel(blocked)} reopened.`);
          this.loadBlockedDates();
        },
        error: (error: HttpErrorResponse) =>
          this.notifications.error(extractErrorMessage(error, 'Could not reopen that date.')),
      });
  }

  dateLabel(blocked: BlockedDate): string {
    return formatCalendarDate(blocked.date);
  }

  private load(): void {
    forkJoin({
      settings: this.availabilityService.getSettings(),
      blocked: this.availabilityService.listBlockedDates(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ settings, blocked }) => {
          this.form.patchValue({
            slotMinutes: settings.slotMinutes,
            dayStartHour: settings.dayStartHour,
            dayEndHour: settings.dayEndHour,
            leadTimeHours: settings.leadTimeHours,
            horizonDays: settings.horizonDays,
            timezoneOffsetMinutes: settings.timezoneOffsetMinutes,
            timezoneLabel: settings.timezoneLabel,
          });
          this.openWeekdays.set(
            new Set(
              settings.openWeekdays
                .split(',')
                .map(Number)
                .filter((day) => Number.isInteger(day)),
            ),
          );
          this.blockedDates.set(blocked);
          this.updatePreview();
        },
        error: (error: HttpErrorResponse) =>
          this.notifications.error(
            extractErrorMessage(error, 'Could not load the opening hours.'),
          ),
      });
  }

  private loadBlockedDates(): void {
    this.availabilityService.listBlockedDates().subscribe({
      next: (blocked) => this.blockedDates.set(blocked),
      error: () => undefined,
    });
  }

  /** Mirrors the slot generation the API does, so the preview cannot drift. */
  private updatePreview(): void {
    const { slotMinutes, dayStartHour, dayEndHour } = this.form.getRawValue();
    const times: string[] = [];

    if (slotMinutes > 0 && dayEndHour > dayStartHour) {
      for (
        let minute = dayStartHour * 60;
        minute + slotMinutes <= dayEndHour * 60;
        minute += slotMinutes
      ) {
        const hours = String(Math.floor(minute / 60) % 24).padStart(2, '0');
        const minutes = String(minute % 60).padStart(2, '0');
        times.push(`${hours}:${minutes}`);
      }
    }

    this.slotPreview.set(times);
  }
}
