import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-booking',
  imports: [ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);

  constructor() {
    inject(Title).setTitle('Book Now | Wedding Planner');
  }

  readonly form = this.fb.nonNullable.group({
    eventDate: ['', [Validators.required]],
    message: ['', [Validators.maxLength(2000)]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly success = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { eventDate, message } = this.form.getRawValue();
    this.bookingService.create({ eventDate: new Date(eventDate).toISOString(), message: message || undefined }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        this.form.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Could not submit your booking. Please try again.'));
      },
    });
  }
}
