import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Enquiry, EnquiryStatus } from '../../core/models/enquiry.model';
import { EnquiriesService } from '../../core/services/enquiries.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

type Filter = 'OPEN' | 'ALL';

@Component({
  selector: 'app-enquiries',
  imports: [DatePipe],
  templateUrl: './enquiries.component.html',
  styleUrl: './enquiries.component.scss',
})
export class EnquiriesComponent implements OnInit {
  private readonly enquiriesService = inject(EnquiriesService);
  private readonly notifications = inject(NotificationService);

  constructor() {
    inject(Title).setTitle('Enquiries | Wedding Planner Admin');
  }

  readonly enquiries = signal<Enquiry[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<string | null>(null);
  readonly filter = signal<Filter>('OPEN');

  readonly newCount = computed(
    () => this.enquiries().filter((enquiry) => enquiry.status === 'NEW').length,
  );

  readonly visible = computed(() =>
    this.filter() === 'ALL'
      ? this.enquiries()
      : this.enquiries().filter((enquiry) => enquiry.status !== 'ARCHIVED'),
  );

  ngOnInit(): void {
    this.load();
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
  }

  badgeClass(status: EnquiryStatus): string {
    switch (status) {
      case 'REPLIED':
        return 'badge-confirmed';
      case 'ARCHIVED':
        return 'badge-draft';
      default:
        return 'badge-pending';
    }
  }

  statusLabel(status: EnquiryStatus): string {
    switch (status) {
      case 'REPLIED':
        return 'Replied';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return 'New';
    }
  }

  /** Opens the admin's mail client with the couple's name already in context. */
  mailtoHref(enquiry: Enquiry): string {
    const subject = encodeURIComponent('Your wedding enquiry');
    const body = encodeURIComponent(`Hello ${enquiry.names},\n\n`);
    return `mailto:${enquiry.email}?subject=${subject}&body=${body}`;
  }

  setStatus(enquiry: Enquiry, status: EnquiryStatus): void {
    this.busyId.set(enquiry.id);

    this.enquiriesService.updateStatus(enquiry.id, status).subscribe({
      next: (updated) => {
        this.enquiries.update((list) =>
          list.map((item) => (item.id === enquiry.id ? updated : item)),
        );
        this.busyId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.busyId.set(null);
        this.notifications.error(extractErrorMessage(error, 'Could not update that enquiry.'));
      },
    });
  }

  remove(enquiry: Enquiry): void {
    this.busyId.set(enquiry.id);

    this.enquiriesService.remove(enquiry.id).subscribe({
      next: () => {
        this.enquiries.update((list) => list.filter((item) => item.id !== enquiry.id));
        this.busyId.set(null);
        this.notifications.info('Enquiry deleted.');
      },
      error: (error: HttpErrorResponse) => {
        this.busyId.set(null);
        this.notifications.error(extractErrorMessage(error, 'Could not delete that enquiry.'));
      },
    });
  }

  private load(): void {
    this.enquiriesService.getAll().subscribe({
      next: (enquiries) => {
        this.enquiries.set(enquiries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
