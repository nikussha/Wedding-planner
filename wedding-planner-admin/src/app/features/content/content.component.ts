import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ContentService } from '../../core/services/content.service';

interface ContentSection {
  key: string;
  label: string;
  description: string;
}

const SECTIONS: ContentSection[] = [
  { key: 'home.hero', label: 'Hero Section', description: 'The main banner shown at the top of the landing page.' },
  { key: 'home.about', label: 'About Section', description: 'Introductory text describing your services.' },
];

@Component({
  selector: 'app-content',
  imports: [ReactiveFormsModule],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
})
export class ContentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contentService = inject(ContentService);

  constructor() {
    inject(Title).setTitle('Site Content | Wedding Planner Admin');
  }

  readonly sections = SECTIONS;
  readonly loading = signal(true);
  readonly savingKey = signal<string | null>(null);
  readonly savedKey = signal<string | null>(null);

  readonly forms = new Map(
    SECTIONS.map((section) => [
      section.key,
      this.fb.nonNullable.group({
        title: [''],
        body: [''],
      }),
    ]),
  );

  ngOnInit(): void {
    this.contentService.getAll().subscribe((content) => {
      for (const section of this.sections) {
        const entry = content[section.key];
        if (entry) {
          this.forms.get(section.key)?.setValue({
            title: entry.title ?? '',
            body: entry.body ?? '',
          });
        }
      }
      this.loading.set(false);
    });
  }

  save(key: string): void {
    const form = this.forms.get(key);
    if (!form) return;

    this.savingKey.set(key);
    this.savedKey.set(null);

    const { title, body } = form.getRawValue();
    this.contentService.upsert(key, { title, body }).subscribe(() => {
      this.savingKey.set(null);
      this.savedKey.set(key);
    });
  }
}
