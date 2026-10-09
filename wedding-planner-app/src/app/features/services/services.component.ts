import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';
import { MarketingStore } from '../../core/services/marketing.store';
import { SeoService } from '../../core/services/seo.service';
import { SiteContentStore } from '../../core/services/site-content.store';

@Component({
  selector: 'app-services',
  imports: [RouterLink, ScrollRevealDirective],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent implements OnInit {
  private readonly siteContent = inject(SiteContentStore);
  private readonly marketing = inject(MarketingStore);
  private readonly seo = inject(SeoService);

  readonly tiers = this.marketing.serviceTiers;
  readonly faqs = this.marketing.faqs;
  readonly region = this.siteContent.region;

  readonly heading = computed(() =>
    this.siteContent.heading('services.intro', 'Three ways to work together'),
  );
  readonly blurb = computed(() =>
    this.siteContent.blurb(
      'services.intro',
      'Some couples want a partner from the first idea onwards. Others have planned everything themselves and want to hand over the day itself. Both are good ways to do this.',
    ),
  );
  readonly faqHeading = computed(() =>
    this.siteContent.heading('services.faq', 'Before you get in touch'),
  );
  readonly ctaHeading = computed(() =>
    this.siteContent.heading('services.cta', 'Not sure which one you need?'),
  );
  readonly ctaBody = computed(() =>
    this.siteContent.blurb(
      'services.cta',
      'That is the most common place to start. Book a consultation and we will work it out together — there is no charge and no obligation.',
    ),
  );

  ngOnInit(): void {
    const region = this.region();
    const description =
      this.blurb() ??
      `Wedding planning services${region ? ` in ${region}` : ''}: what each level includes, when it starts, and what it does not cover.`;

    this.seo.setPage({ title: 'Services', description, path: '/services' });
    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/services' },
    ]);

    // One Service entity per tier, so each can be understood on its own.
    this.seo.setJsonLd(
      'services',
      this.tiers().length
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: this.tiers().map((tier, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Service',
                name: tier.name,
                description: tier.forWho,
                serviceType: 'Wedding planning',
                ...(region ? { areaServed: region } : {}),
                ...(tier.investment
                  ? { offers: { '@type': 'Offer', price: tier.investment } }
                  : {}),
              },
            })),
          }
        : null,
    );
  }
}
