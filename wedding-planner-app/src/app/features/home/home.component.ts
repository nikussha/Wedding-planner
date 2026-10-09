import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';
import { BlogPost } from '../../core/models/blog-post.model';
import { Photo } from '../../core/models/photo.model';
import { BlogService } from '../../core/services/blog.service';
import { ContentService } from '../../core/services/content.service';
import { MarketingStore } from '../../core/services/marketing.store';
import { SeoService } from '../../core/services/seo.service';
import { SiteContentStore } from '../../core/services/site-content.store';

/** Used when the CMS hero has never been filled in. */
const FALLBACK_HEADLINE = 'Weddings planned with calm, care and attention';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, ScrollRevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly blogService = inject(BlogService);
  private readonly siteContent = inject(SiteContentStore);
  private readonly marketing = inject(MarketingStore);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly hero = this.siteContent.hero;
  readonly about = this.siteContent.about;
  readonly region = this.siteContent.region;
  readonly closingCta = this.siteContent.closingCta;

  /* Lists come from the admin panel; an empty one hides its whole section. */
  readonly tiers = this.marketing.serviceTiers;
  readonly steps = this.marketing.processSteps;
  readonly faqs = this.marketing.faqs;
  readonly testimonials = this.marketing.testimonials;

  readonly photos = signal<Photo[]>([]);
  readonly posts = signal<BlogPost[]>([]);

  readonly headline = computed(() => this.hero()?.title ?? FALLBACK_HEADLINE);

  /* Section headings: editable, with the copy written here as the fallback. */
  readonly servicesHeading = computed(() =>
    this.siteContent.heading('home.services', 'Three ways to work together'),
  );
  readonly servicesBlurb = computed(() =>
    this.siteContent.blurb(
      'home.services',
      'From the first idea to the last dance, or just the day itself — whichever you need.',
    ),
  );
  readonly galleryHeading = computed(() =>
    this.siteContent.heading('home.gallery', 'Weddings we have planned'),
  );
  readonly processHeading = computed(() =>
    this.siteContent.heading('home.process', 'From hello to the last dance'),
  );
  readonly testimonialsHeading = computed(() =>
    this.siteContent.heading('home.testimonials', 'Couples we have worked with'),
  );
  readonly journalHeading = computed(() =>
    this.siteContent.heading('home.journal', 'Notes on planning a wedding'),
  );
  readonly faqHeading = computed(() =>
    this.siteContent.heading('home.faq', 'Asked before every wedding'),
  );

  /** The hero carries the first photo; the gallery shows the rest. */
  readonly heroImage = computed(() => this.photos()[0] ?? null);
  readonly galleryPhotos = computed(() => this.photos().slice(1, 7));
  readonly latestPosts = computed(() => this.posts().slice(0, 3));

  /**
   * Gallery reveals are staggered by row, not by index: staggering a grid by
   * DOM order sends a diagonal wipe across it, which reads like a slide
   * transition rather than a page settling.
   */
  rowDelay(index: number, perRow = 3): number {
    return Math.floor(index / perRow) * 50;
  }

  ngOnInit(): void {
    this.applySeo();

    this.contentService
      .getPhotos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (photos) => this.photos.set(photos),
        error: () => this.photos.set([]),
      });

    this.blogService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => this.posts.set(posts),
        error: () => this.posts.set([]),
      });
  }

  private applySeo(): void {
    const region = this.region();
    const name = this.siteContent.siteName();
    const description =
      this.hero()?.body ??
      this.about()?.body ??
      `Wedding planning${region ? ` in ${region}` : ''}: full planning, partial planning and on-the-day coordination.`;

    this.seo.setPage({
      title: region ? `Wedding Planner in ${region}` : name,
      description,
      path: '/',
    });

    // Only facts the owner has actually entered go into the structured data.
    const email = this.siteContent.email();
    const phone = this.siteContent.phone();
    const social = [this.siteContent.instagram(), this.siteContent.pinterest()].filter(Boolean);

    this.seo.setJsonLd('business', {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name,
      description,
      url: this.seo.absolute('/'),
      ...(region ? { areaServed: region } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { telephone: phone } : {}),
      ...(social.length ? { sameAs: social } : {}),
      ...(this.tiers().length
        ? {
            makesOffer: this.tiers().map((tier) => ({
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: tier.name, description: tier.forWho },
            })),
          }
        : {}),
    });
  }
}
