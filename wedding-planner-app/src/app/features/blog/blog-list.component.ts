import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
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
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly posts = signal<BlogPost[]>([]);

  ngOnInit(): void {
    this.title.setTitle('Blog | Wedding Planner');
    this.meta.updateTag({
      name: 'description',
      content: 'Wedding planning tips, inspiration, and stories from our blog.',
    });

    this.blogService.list().subscribe((posts) => this.posts.set(posts));
  }
}
