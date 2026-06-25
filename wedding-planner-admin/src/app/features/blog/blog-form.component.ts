import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogService } from '../../core/services/blog.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-blog-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './blog-form.component.html',
  styleUrl: './blog-form.component.scss',
})
export class BlogFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly postId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  private slugTouched = false;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    slug: [
      '',
      [Validators.required, Validators.maxLength(200), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    excerpt: ['', [Validators.maxLength(500)]],
    content: ['', [Validators.required, Validators.minLength(1)]],
    coverImage: [''],
    published: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.slugTouched) {
        this.form.controls.slug.setValue(slugify(title), { emitEvent: false });
      }
    });

    this.form.controls.slug.valueChanges.subscribe(() => {
      this.slugTouched = true;
    });

    if (id && id !== 'new') {
      this.postId.set(id);
      this.isEditMode.set(true);
      this.slugTouched = true;

      this.blogService.getById(id).subscribe({
        next: (post) => {
          this.form.setValue({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt ?? '',
            content: post.content,
            coverImage: post.coverImage ?? '',
            published: post.published,
          });
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Post not found.');
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }

    inject(Title).setTitle(`${id && id !== 'new' ? 'Edit' : 'New'} Post | Wedding Planner Admin`);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const { title, slug, excerpt, content, coverImage, published } = this.form.getRawValue();
    const payload = {
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      coverImage: coverImage || undefined,
      published,
    };

    const id = this.postId();
    const request = id ? this.blogService.update(id, payload) : this.blogService.create(payload);

    request.subscribe({
      next: () => {
        this.router.navigateByUrl('/blog');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Failed to save post.'));
      },
    });
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
