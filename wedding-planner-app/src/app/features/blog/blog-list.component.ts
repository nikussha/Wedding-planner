import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';
import { BlogPost } from '../../core/models/blog-post.model';
import { BlogService } from '../../core/services/blog.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteContentStore } from '../../core/services/site-content.store';
import { readingMinutes } from '../../core/utils/reading-time.util';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, DatePipe, ScrollRevealDirective],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly siteContent = inject(SiteContentStore);
  private readonly seo = inject(SeoService);

  readonly heading = computed(() =>
    this.siteContent.heading('blog.intro', 'Notes on planning a wedding'),
  );
  readonly blurb = computed(() =>
    this.siteContent.blurb(
      'blog.intro',
      'Venues, suppliers, timelines, and what we learn from the weddings we work on.',
    ),
  );
  readonly ctaHeading = computed(() =>
    this.siteContent.heading('blog.cta', 'Planning your own wedding?'),
  );
  readonly ctaBody = computed(() =>
    this.siteContent.blurb(
      'blog.cta',
      'Bring us the half-formed version. That is the best moment to start.',
    ),
  );

  readonly posts = signal<BlogPost[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  /** The newest post leads the page; the rest fall into the grid. */
  readonly featured = computed(() => this.posts()[0] ?? null);
  readonly rest = computed(() => this.posts().slice(1));

  readonly minutes = readingMinutes;

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Journal',
      description:
        'Notes on planning a wedding: venues, suppliers, timelines and the weddings we have worked on.',
      path: '/blog',
    });
    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Journal', path: '/blog' },
    ]);

    this.blogService.list().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
