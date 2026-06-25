import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BlogPost } from '../../core/models/blog-post.model';
import { BlogService } from '../../core/services/blog.service';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  constructor() {
    inject(Title).setTitle('Blog | Wedding Planner Admin');
  }

  readonly posts = signal<BlogPost[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.blogService.getAll().subscribe((posts) => {
      this.posts.set(posts);
      this.loading.set(false);
    });
  }

  remove(post: BlogPost): void {
    if (!confirm(`Delete the post "${post.title}"?`)) return;

    this.blogService.remove(post.id).subscribe(() => {
      this.posts.update((posts) => posts.filter((p) => p.id !== post.id));
    });
  }
}
