import { DOCUMENT } from '@angular/common';
import { Injectable, REQUEST, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SiteContentStore } from './site-content.store';

export interface PageSeo {
  /** Page title without the site suffix. */
  title: string;
  description?: string | null;
  /** Route path, e.g. '/services'. Used for canonical and og:url. */
  path?: string;
  /** Absolute or root-relative image for social cards. */
  image?: string | null;
  /** 'website' for pages, 'article' for blog posts. */
  type?: 'website' | 'article';
}

/**
 * Page metadata and structured data.
 *
 * Every public page sets its own title, description, Open Graph tags and
 * canonical URL through here. JSON-LD blocks are written into the document
 * head and keyed by id, so navigating between pages replaces the previous
 * page's structured data instead of stacking it up.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly siteContent = inject(SiteContentStore);

  setPage(seo: PageSeo): void {
    const siteName = this.siteContent.siteName();
    const fullTitle = seo.title.includes(siteName) ? seo.title : `${seo.title} | ${siteName}`;
    this.title.setTitle(fullTitle);

    const description = seo.description?.trim().slice(0, 300) ?? null;
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
    } else {
      this.meta.removeTag("name='description'");
      this.meta.removeTag("property='og:description'");
    }

    this.meta.updateTag({ property: 'og:site_name', content: siteName });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:type', content: seo.type ?? 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: seo.image ? 'summary_large_image' : 'summary' });

    const url = seo.path ? this.absolute(seo.path) : null;
    if (url) {
      this.meta.updateTag({ property: 'og:url', content: url });
      this.setCanonical(url);
    }

    const image = seo.image ? this.absolute(seo.image) : null;
    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
    } else {
      this.meta.removeTag("property='og:image'");
    }
  }

  /** Writes (or replaces) one JSON-LD block. */
  setJsonLd(id: string, data: Record<string, unknown> | null): void {
    const elementId = `ld-${id}`;
    this.doc.getElementById(elementId)?.remove();
    if (!data) return;

    const script = this.doc.createElement('script');
    script.id = elementId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }

  /** A trail of { name, path } pairs, root first. */
  setBreadcrumbs(trail: ReadonlyArray<{ name: string; path: string }>): void {
    if (trail.length === 0) {
      this.setJsonLd('breadcrumbs', null);
      return;
    }

    this.setJsonLd('breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((step, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: step.name,
        item: this.absolute(step.path),
      })),
    });
  }

  /** Resolves a root-relative path against the current origin. */
  absolute(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

    const origin = this.origin();
    if (!origin) return pathOrUrl;
    return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  }

  /**
   * The site's own origin. During SSR it has to come from the incoming
   * request, since the server has no location of its own.
   */
  private origin(): string | null {
    const host = this.request?.headers.get('x-forwarded-host') ?? this.request?.headers.get('host');
    if (host) {
      const proto = this.request?.headers.get('x-forwarded-proto') ?? 'http';
      return `${proto}://${host}`;
    }

    return this.doc.location?.origin ?? null;
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
