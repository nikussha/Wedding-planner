import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogPost } from '../../core/models/blog-post.model';
import { BlogService } from '../../core/services/blog.service';
import { SeoService } from '../../core/services/seo.service';
import { readingMinutes } from '../../core/utils/reading-time.util';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly seo = inject(SeoService);

  readonly post = signal<BlogPost | null>(null);
  readonly notFound = signal(false);
  readonly related = signal<BlogPost[]>([]);

  readonly minutes = computed(() => readingMinutes(this.post()?.content));

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }

    this.blogService.getBySlug(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.applySeo(post);
        this.loadRelated(post);
      },
      error: () => {
        this.notFound.set(true);
        this.seo.setPage({ title: 'Post not found', path: `/blog/${slug}` });
      },
    });
  }

  private applySeo(post: BlogPost): void {
    this.seo.setPage({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${post.slug}`,
      image: post.coverImage,
      type: 'article',
    });

    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/' },
      { name: 'Journal', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]);

    this.seo.setJsonLd('article', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      ...(post.excerpt ? { description: post.excerpt } : {}),
      ...(post.coverImage ? { image: this.seo.absolute(post.coverImage) } : {}),
      ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
      dateModified: post.updatedAt,
      mainEntityOfPage: this.seo.absolute(`/blog/${post.slug}`),
      publisher: { '@type': 'Organization', name: 'Wedding Planner' },
    });
  }

  /** Two or three others, never more: a long list reads as a dead end. */
  private loadRelated(current: BlogPost): void {
    this.blogService.list().subscribe({
      next: (posts) => this.related.set(posts.filter((p) => p.id !== current.id).slice(0, 3)),
      error: () => this.related.set([]),
    });
  }
}
