import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogPost } from '../../core/models/blog-post.model';
import { BlogService } from '../../core/services/blog.service';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly post = signal<BlogPost | null>(null);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }

    this.blogService.getBySlug(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.title.setTitle(`${post.title} | Wedding Planner Blog`);
        if (post.excerpt) {
          this.meta.updateTag({ name: 'description', content: post.excerpt });
        }
      },
      error: () => {
        this.notFound.set(true);
        this.title.setTitle('Post Not Found | Wedding Planner Blog');
      },
    });
  }
}
