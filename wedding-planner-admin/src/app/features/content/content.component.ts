import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ContentService } from '../../core/services/content.service';

interface ContentSection {
  key: string;
  label: string;
  description: string;
  /** Sections are rendered under these headings, in this order. */
  group: string;
  /** Short facts have no title and get a one-line field instead of a textarea. */
  singleValue?: boolean;
  bodyLabel?: string;
}

/**
 * Every text block on the public site that is worth editing.
 *
 * Section headings live here too: the site falls back to the copy written in
 * the components when a key is empty, so nothing ever renders blank. Button
 * labels, status words and validation messages are deliberately absent -
 * those are mechanics, and the booking flow depends on them matching exactly
 * between the site, the admin panel and screen readers.
 */
const SECTIONS: ContentSection[] = [
  {
    key: 'site.name',
    label: 'Business name',
    description:
      'Used in the header, the footer, every page title and the data search engines read.',
    group: 'Your details',
    singleValue: true,
    bodyLabel: 'Name',
  },
  {
    key: 'site.region',
    label: 'Where you work',
    description:
      'Shown under the hero and in the footer, e.g. "Tbilisi and across Georgia". Left empty, it is not shown at all.',
    group: 'Your details',
    singleValue: true,
    bodyLabel: 'Region',
  },
  {
    key: 'contact.email',
    label: 'Email address',
    description: 'Shown on the contact page and in the footer. Left empty, neither shows an email.',
    group: 'Your details',
    singleValue: true,
    bodyLabel: 'Email',
  },
  {
    key: 'contact.phone',
    label: 'Phone number',
    description: 'Optional. Shown on the contact page and in the footer.',
    group: 'Your details',
    singleValue: true,
    bodyLabel: 'Phone',
  },
  {
    key: 'contact.instagram',
    label: 'Instagram',
    description: 'Full link, e.g. https://instagram.com/yourname. Optional.',
    group: 'Your details',
    singleValue: true,
    bodyLabel: 'Instagram link',
  },
  {
    key: 'contact.pinterest',
    label: 'Pinterest',
    description: 'Full link. Optional.',
    group: 'Your details',
    singleValue: true,
    bodyLabel: 'Pinterest link',
  },

  {
    key: 'home.hero',
    label: 'Hero',
    description:
      'The first thing a visitor reads. Title is the headline; body is the line beneath it.',
    group: 'Home page',
  },
  {
    key: 'home.about',
    label: 'Introduction',
    description:
      'A short, personal introduction below the hero. Written in the first person reads best.',
    group: 'Home page',
  },
  {
    key: 'home.services',
    label: 'Services section',
    description: 'The heading and sentence above your service cards.',
    group: 'Home page',
  },
  {
    key: 'home.gallery',
    label: 'Photographs section',
    description: 'The heading above your photographs. Only the title is used.',
    group: 'Home page',
  },
  {
    key: 'home.process',
    label: 'How it works section',
    description: 'The heading above the numbered steps. Only the title is used.',
    group: 'Home page',
  },
  {
    key: 'home.testimonials',
    label: 'Testimonials section',
    description: 'The heading above the couples’ quotes. Only the title is used.',
    group: 'Home page',
  },
  {
    key: 'home.journal',
    label: 'Journal section',
    description: 'The heading above the latest journal entries. Only the title is used.',
    group: 'Home page',
  },
  {
    key: 'home.faq',
    label: 'Questions section',
    description: 'The heading above the questions and answers. Only the title is used.',
    group: 'Home page',
  },
  {
    key: 'home.cta',
    label: 'Closing invitation',
    description: 'The dark block at the foot of the home page.',
    group: 'Home page',
  },

  {
    key: 'services.intro',
    label: 'Page introduction',
    description: 'The heading and sentence at the top of the Services page.',
    group: 'Services page',
  },
  {
    key: 'services.faq',
    label: 'Questions section',
    description: 'The heading above the questions on the Services page.',
    group: 'Services page',
  },
  {
    key: 'services.cta',
    label: 'Closing invitation',
    description: 'The dark block at the foot of the Services page.',
    group: 'Services page',
  },

  {
    key: 'about.story',
    label: 'Your story',
    description:
      'The main text of the About page, in the first person. Falls back to the home page introduction if empty.',
    group: 'About page',
  },
  {
    key: 'about.process',
    label: 'How it works section',
    description: 'The heading above the steps on the About page.',
    group: 'About page',
  },
  {
    key: 'about.cta',
    label: 'Closing invitation',
    description: 'The dark block at the foot of the About page.',
    group: 'About page',
  },

  {
    key: 'blog.intro',
    label: 'Page introduction',
    description: 'The heading and sentence at the top of the Journal.',
    group: 'Journal page',
  },
  {
    key: 'blog.cta',
    label: 'Closing invitation',
    description: 'The dark block at the foot of the Journal.',
    group: 'Journal page',
  },

  {
    key: 'contact.intro',
    label: 'Page introduction',
    description: 'The heading and sentence at the top of the Contact page.',
    group: 'Contact page',
  },
  {
    key: 'contact.consult',
    label: 'Consultation panel',
    description:
      'The panel offering a consultation. Left empty, it describes the call using the length from Opening Hours.',
    group: 'Contact page',
  },
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

  /** Sections grouped for display, preserving the order declared above. */
  readonly groups = [...new Set(SECTIONS.map((section) => section.group))].map((group) => ({
    name: group,
    sections: SECTIONS.filter((section) => section.group === group),
  }));

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
    this.contentService.getAll().subscribe({
      next: (content) => {
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
      },
      error: () => this.loading.set(false),
    });
  }

  save(key: string): void {
    const form = this.forms.get(key);
    if (!form) return;

    this.savingKey.set(key);
    this.savedKey.set(null);

    const { title, body } = form.getRawValue();
    this.contentService.upsert(key, { title, body }).subscribe({
      next: () => {
        this.savingKey.set(null);
        this.savedKey.set(key);
      },
      error: () => this.savingKey.set(null),
    });
  }
}
