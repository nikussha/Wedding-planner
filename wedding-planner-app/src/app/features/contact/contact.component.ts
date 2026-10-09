import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AvailabilityService } from '../../core/services/availability.service';
import { EnquiryService } from '../../core/services/enquiry.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteContentStore } from '../../core/services/site-content.store';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly enquiryService = inject(EnquiryService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly siteContent = inject(SiteContentStore);
  private readonly seo = inject(SeoService);

  readonly region = this.siteContent.region;

  /** Read from the opening hours so the prose cannot contradict the calendar. */
  private readonly slotMinutes = signal<number | null>(null);

  readonly consultationLength = computed(() => {
    const minutes = this.slotMinutes();
    if (minutes === null) return null;
    if (minutes % 60 !== 0) return `${minutes}-minute`;
    const hours = minutes / 60;
    return hours === 1 ? 'one-hour' : `${hours}-hour`;
  });

  readonly introHeading = computed(() =>
    this.siteContent.heading('contact.intro', 'Let’s talk about your wedding'),
  );
  readonly introBlurb = computed(() =>
    this.siteContent.blurb(
      'contact.intro',
      'Book a consultation if you would like to talk it through, or send a note if you are still early in your planning. Either reaches us.',
    ),
  );
  readonly consultHeading = computed(() =>
    this.siteContent.heading('contact.consult', 'Book a consultation'),
  );
  readonly consultBlurb = computed(() => this.siteContent.blurb('contact.consult'));
  readonly email = this.siteContent.email;
  readonly phone = this.siteContent.phone;
  readonly instagram = this.siteContent.instagram;
  readonly pinterest = this.siteContent.pinterest;
  readonly hasContactDetails = this.siteContent.hasContactDetails;

  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Six fields. Every field past the third measurably costs replies, so
   * anything that can wait for the conversation is not asked here.
   */
  readonly form = this.fb.nonNullable.group({
    names: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
    weddingDate: [''],
    location: ['', [Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(4000)]],
  });

  ngOnInit(): void {
    const region = this.region();
    this.seo.setPage({
      title: 'Contact',
      description: `Book a consultation or send a note about your wedding${region ? ` in ${region}` : ''}.`,
      path: '/contact',
    });
    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]);

    this.availabilityService.getSettings().subscribe({
      next: (settings) => this.slotMinutes.set(settings.slotMinutes),
      // Without it the panel simply omits the length.
      error: () => this.slotMinutes.set(null),
    });
  }

  telHref(phone: string): string {
    return `tel:${phone.replace(/[^+\d]/g, '')}`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { names, email, weddingDate, location, message } = this.form.getRawValue();
    this.enquiryService
      .send({
        names: names.trim(),
        email: email.trim(),
        weddingDate: weddingDate || undefined,
        location: location.trim() || undefined,
        message: message.trim(),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.sent.set(true);
          this.form.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            extractErrorMessage(
              error,
              'Your note could not be sent just now. Please try again, or email us directly.',
            ),
          );
        },
      });
  }

  writeAnother(): void {
    this.sent.set(false);
  }
}
