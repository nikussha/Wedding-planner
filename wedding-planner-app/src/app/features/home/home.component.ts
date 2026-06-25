import { Component, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { SiteContentEntry } from '../../core/models/content.model';
import { Photo } from '../../core/models/photo.model';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly hero = signal<SiteContentEntry | null>(null);
  readonly about = signal<SiteContentEntry | null>(null);
  readonly photos = signal<Photo[]>([]);

  ngOnInit(): void {
    this.contentService.getSiteContent().subscribe((content) => {
      const hero = content['home.hero'] ?? null;
      const about = content['home.about'] ?? null;
      this.hero.set(hero);
      this.about.set(about);

      const pageTitle = hero?.title ? `${hero.title} | Wedding Planner` : 'Wedding Planner';
      this.title.setTitle(pageTitle);

      const description = hero?.body ?? about?.body;
      if (description) {
        this.meta.updateTag({ name: 'description', content: description.slice(0, 160) });
      }
    });

    this.contentService.getPhotos().subscribe((photos) => this.photos.set(photos));
  }
}
