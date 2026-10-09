import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { SiteContentEntry, SiteContentMap } from '../models/content.model';
import { ContentService } from './content.service';

/**
 * Editable site text, loaded once at bootstrap.
 *
 * The header, footer and every marketing page read from here, so the whole
 * site shares one request and the server-rendered HTML already contains the
 * copy. Keys are the ones listed in the admin panel's Site Content screen;
 * anything an owner has not filled in reads as null, and the UI then hides
 * that element rather than showing a placeholder.
 */
@Injectable({ providedIn: 'root' })
export class SiteContentStore {
  private readonly contentService = inject(ContentService);
  private readonly contentSignal = signal<SiteContentMap>({});

  readonly content = this.contentSignal.asReadonly();

  load(): Observable<SiteContentMap | null> {
    return this.contentService.getSiteContent().pipe(
      tap((content) => this.contentSignal.set(content)),
      catchError(() => of(null)),
    );
  }

  /** Both halves of an entry, or null when the key has never been filled in. */
  entry(key: string): SiteContentEntry | null {
    const entry = this.contentSignal()[key];
    if (!entry) return null;

    const title = entry.title?.trim() || null;
    const body = entry.body?.trim() || null;
    return title || body ? { title, body } : null;
  }

  /** The body of a single-value key such as `contact.email`. */
  value(key: string): string | null {
    return this.entry(key)?.body ?? null;
  }

  /** Section heading for a key, falling back to the copy written in code. */
  heading(key: string, fallback: string): string {
    return this.entry(key)?.title ?? fallback;
  }

  /** Supporting sentence for a key; null hides the paragraph entirely. */
  blurb(key: string, fallback: string | null = null): string | null {
    return this.entry(key)?.body ?? fallback;
  }

  /**
   * The business name, used in the header, footer, page titles and the
   * structured data Google reads.
   */
  readonly siteName = computed(() => this.value('site.name') ?? 'Wedding Planner');

  readonly hero = computed(() => this.entry('home.hero'));
  readonly about = computed(() => this.entry('home.about'));
  readonly servicesIntro = computed(() => this.entry('services.intro'));
  readonly closingCta = computed(() => this.entry('home.cta'));

  /** Where the planner works, e.g. 'Tbilisi and across Georgia'. */
  readonly region = computed(() => this.value('site.region'));
  readonly email = computed(() => this.value('contact.email'));
  readonly phone = computed(() => this.value('contact.phone'));
  readonly instagram = computed(() => this.value('contact.instagram'));
  readonly pinterest = computed(() => this.value('contact.pinterest'));

  readonly hasContactDetails = computed(() =>
    Boolean(this.email() || this.phone() || this.instagram() || this.pinterest()),
  );
}
