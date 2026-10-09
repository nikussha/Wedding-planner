import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteContentStore } from '../../core/services/site-content.store';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly siteContent = inject(SiteContentStore);

  readonly year = new Date().getFullYear();

  readonly siteName = this.siteContent.siteName;
  readonly region = this.siteContent.region;
  readonly email = this.siteContent.email;
  readonly phone = this.siteContent.phone;
  readonly instagram = this.siteContent.instagram;
  readonly pinterest = this.siteContent.pinterest;
  readonly hasContactDetails = this.siteContent.hasContactDetails;

  /** Phone numbers need the spaces stripped for a tel: link to work. */
  telHref(phone: string): string {
    return `tel:${phone.replace(/[^+\d]/g, '')}`;
  }
}
