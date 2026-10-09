import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';
import { Photo } from '../../core/models/photo.model';
import { ContentService } from '../../core/services/content.service';
import { MarketingStore } from '../../core/services/marketing.store';
import { SeoService } from '../../core/services/seo.service';
import { SiteContentStore } from '../../core/services/site-content.store';

@Component({
  selector: 'app-about',
  imports: [RouterLink, ScrollRevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly siteContent = inject(SiteContentStore);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly marketing = inject(MarketingStore);

  readonly steps = this.marketing.processSteps;
  readonly region = this.siteContent.region;
  readonly photos = signal<Photo[]>([]);

  /** The dedicated About copy, falling back to the home page's introduction. */
  readonly story = computed(() => this.siteContent.entry('about.story') ?? this.siteContent.about());

  /** A portrait if there is one to use; the page reads fine without it. */
  readonly portrait = computed(() => this.photos()[1] ?? this.photos()[0] ?? null);

  readonly processHeading = computed(() =>
    this.siteContent.heading('about.process', 'How working together goes'),
  );
  readonly ctaHeading = computed(() =>
    this.siteContent.heading('about.cta', 'Tell us about your day'),
  );
  readonly ctaBody = computed(() =>
    this.siteContent.blurb(
      'about.cta',
      'The best way to start is a conversation. Pick a time that suits you, or send a note and we will come back to you.',
    ),
  );

  ngOnInit(): void {
    const region = this.region();
    const description =
      this.story()?.body ??
      `The people behind the planning${region ? `, working in ${region}` : ''}.`;

    this.seo.setPage({ title: 'About', description, path: '/about' });
    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]);

    this.contentService
      .getPhotos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (photos) => this.photos.set(photos),
        error: () => this.photos.set([]),
      });
  }
}
