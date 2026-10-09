import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { MarketingContent } from '../models/marketing.model';

const EMPTY: MarketingContent = {
  serviceTiers: [],
  processSteps: [],
  faqs: [],
  testimonials: [],
};

/**
 * The editable marketing lists, loaded once at bootstrap.
 *
 * Service tiers, process steps, FAQ entries and testimonials are all managed
 * in the admin panel. A list that is empty stays empty here, and the pages
 * then omit that section entirely rather than rendering a heading with
 * nothing under it.
 */
@Injectable({ providedIn: 'root' })
export class MarketingStore {
  private readonly http = inject(HttpClient);
  private readonly contentSignal = signal<MarketingContent>(EMPTY);

  readonly serviceTiers = computed(() => this.contentSignal().serviceTiers);
  readonly processSteps = computed(() => this.contentSignal().processSteps);
  readonly faqs = computed(() => this.contentSignal().faqs);
  readonly testimonials = computed(() => this.contentSignal().testimonials);

  load(): Observable<MarketingContent | null> {
    return this.http.get<MarketingContent>('/api/marketing').pipe(
      tap((content) => this.contentSignal.set(content)),
      catchError(() => of(null)),
    );
  }
}
