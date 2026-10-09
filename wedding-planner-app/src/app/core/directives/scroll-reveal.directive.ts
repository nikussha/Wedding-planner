import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';

/**
 * Reveals an element as it scrolls into view.
 *
 * The hidden state lives in CSS (.reveal) and this directive is what applies
 * it, so the class only ever exists when the reveal can actually run: never
 * on the server, never without IntersectionObserver, never under reduced
 * motion, and never on small screens, where scroll fading mostly serves to
 * convince readers the page has ended. Content is never left invisible
 * because a script did not run.
 *
 * Use it on secondary content only - section headings, images, cards. Body
 * copy, form fields and the booking CTA should be there at paint.
 */
@Directive({
  selector: '[appScrollReveal]',
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  /** Delay in ms, for staggering a row of cards. */
  readonly appScrollReveal = input<number | ''>('');

  ngOnInit(): void {
    const node = this.element.nativeElement;
    if (!this.isBrowser || typeof IntersectionObserver === 'undefined') return;

    // Reduced motion and small screens get the content in place, with no
    // class applied at all: the CSS then has nothing to hide.
    const skip = window.matchMedia(
      '(prefers-reduced-motion: reduce), (max-width: 760px)',
    ).matches;
    if (skip) return;

    node.classList.add('reveal');
    const delay = Number(this.appScrollReveal()) || 0;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          node.style.transitionDelay = delay ? `${delay}ms` : '';
          node.classList.add('is-revealed');
          // One-shot: re-animating on every scroll past is a cheap effect.
          this.observer?.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );

    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
