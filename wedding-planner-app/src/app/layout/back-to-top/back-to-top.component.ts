import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';

/** Appears once the visitor is this many viewports down the page. */
const SHOW_AFTER_VIEWPORTS = 1.5;

/**
 * A quiet way back to the top of a long page.
 *
 * Like the header, the scroll position is watched outside Angular with a
 * passive listener, and only re-enters when the button's visibility actually
 * changes - a scroll handler that triggers change detection on every event is
 * the usual reason a long page feels heavy to scroll.
 */
@Component({
  selector: 'app-back-to-top',
  imports: [],
  template: `
    <button
      type="button"
      class="to-top"
      [class.is-visible]="visible()"
      [attr.tabindex]="visible() ? 0 : -1"
      [attr.aria-hidden]="visible() ? null : true"
      (click)="scrollToTop()"
    >
      <span class="to-top__arrow" aria-hidden="true">&uarr;</span>
      <span class="visually-hidden">Back to top</span>
    </button>
  `,
  styleUrl: './back-to-top.component.scss',
})
export class BackToTopComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = signal(false);

  constructor() {
    if (!this.isBrowser) return;

    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        const past = window.scrollY > window.innerHeight * SHOW_AFTER_VIEWPORTS;
        if (past === this.visible()) return;
        this.zone.run(() => this.visible.set(past));
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
      onScroll();
    });
  }

  scrollToTop(): void {
    if (!this.isBrowser) return;

    // Smooth over a long page is a slow glide, so only animate for visitors
    // who have not asked for less motion; everyone else gets there at once.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
