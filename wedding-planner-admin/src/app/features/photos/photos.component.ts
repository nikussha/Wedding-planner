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
    this.photosService.getAll().subscribe((photos) => {
      this.photos.set(photos);
      this.loading.set(false);
    });
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
    this.photosService.update(photo.id, { [field]: value }).subscribe(() => {
      this.savingId.set(null);
      this.photos.update((photos) =>
        photos.map((p) => (p.id === photo.id ? { ...p, [field]: value } : p)),
      );
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
        this.photosService.update(photo.id, { order: index }).subscribe();
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
