import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Photo } from '../../core/models/photo.model';
import { PhotosService } from '../../core/services/photos.service';

@Component({
  selector: 'app-photos',
  imports: [ReactiveFormsModule],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.scss',
})
export class PhotosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly photosService = inject(PhotosService);

  constructor() {
    inject(Title).setTitle('Photos | Wedding Planner Admin');
  }

  readonly photos = signal<Photo[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly savingId = signal<string | null>(null);

  readonly uploadForm = this.fb.nonNullable.group({
    alt: [''],
    caption: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.photosService.getAll().subscribe({
      next: (photos) => {
        this.photos.set(photos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Replaces a failed image (e.g. file missing on disk) with an inline placeholder. */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallback']) return; // avoid loop if the placeholder itself fails
    img.dataset['fallback'] = 'true';
    img.classList.add('img-missing');
    img.src =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">' +
          '<rect width="160" height="120" fill="#f0eef0"/>' +
          '<text x="80" y="64" font-family="sans-serif" font-size="12" fill="#9b8e95" ' +
          'text-anchor="middle">image unavailable</text></svg>',
      );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please choose an image to upload.');
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set(null);

    const { alt, caption } = this.uploadForm.getRawValue();
    this.photosService.upload(file, alt || undefined, caption || undefined).subscribe({
      next: (photo) => {
        this.photos.update((photos) => [...photos, photo]);
        this.uploadForm.reset({ alt: '', caption: '' });
        this.selectedFile.set(null);
        this.uploading.set(false);
      },
      error: () => {
        this.uploading.set(false);
        this.errorMessage.set('Upload failed. Please try again.');
      },
    });
  }

  updateField(photo: Photo, field: 'alt' | 'caption', value: string): void {
    this.savingId.set(photo.id);
    this.photosService.update(photo.id, { [field]: value }).subscribe({
      next: () => {
        this.savingId.set(null);
        this.photos.update((photos) =>
          photos.map((p) => (p.id === photo.id ? { ...p, [field]: value } : p)),
        );
      },
      error: () => this.savingId.set(null),
    });
  }

  moveUp(index: number): void {
    if (index === 0) return;
    this.swapOrder(index, index - 1);
  }

  moveDown(index: number): void {
    const photos = this.photos();
    if (index === photos.length - 1) return;
    this.swapOrder(index, index + 1);
  }

  private swapOrder(a: number, b: number): void {
    const photos = [...this.photos()];
    [photos[a], photos[b]] = [photos[b], photos[a]];

    photos.forEach((photo, index) => {
      if (photo.order !== index) {
        // On failure, reload from the server so the displayed order matches persisted state.
        this.photosService.update(photo.id, { order: index }).subscribe({
          error: () => this.load(),
        });
      }
    });

    this.photos.set(photos.map((photo, index) => ({ ...photo, order: index })));
  }

  remove(photo: Photo): void {
    if (!confirm('Delete this photo?')) return;

    this.photosService.remove(photo.id).subscribe(() => {
      this.photos.update((photos) => photos.filter((p) => p.id !== photo.id));
    });
  }
}
