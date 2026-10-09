import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostListener,
  NgZone,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SiteContentStore } from '../../core/services/site-content.store';

interface NavLink {
  path: string;
  label: string;
  exact?: boolean;
}

/**
 * Marketing navigation. The booking action is the one primary CTA across the
 * whole site, so it is styled as a button here and worded identically
 * everywhere else. Account links are deliberately quiet: prospects book
 * consultations, accounts matter only once they are clients.
 */
const NAV_LINKS: NavLink[] = [
  { path: '/services', label: 'Services' },
  { path: '/about', label: 'About' },
  { path: '/blog', label: 'Journal' },
  { path: '/contact', label: 'Contact' },
];

/** How far down the page the header starts getting out of the way. */
const HIDE_BELOW_PX = 140;

/** How long scrolling has to pause before the header comes back. */
const SCROLL_IDLE_MS = 180;

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    '[class.is-hidden]': 'hidden()',
  },
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly siteContent = inject(SiteContentStore);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly navLinks = NAV_LINKS;
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  /** Out of the way while the page is moving; back as soon as it settles. */
  readonly hidden = signal(false);

  private idleTimer: ReturnType<typeof setTimeout> | undefined;

  readonly user = this.authService.user;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly region = this.siteContent.region;
  readonly siteName = this.siteContent.siteName;

  /** First name only: the header is not the place for a full name. */
  readonly firstName = computed(() => this.user()?.name?.split(' ')[0] ?? null);

  constructor() {
    if (!this.isBrowser) return;

    /**
     * Scroll is watched outside Angular, because a scroll handler inside it
     * runs change detection for the whole application on every single scroll
     * event. The listener is passive (so it can never delay the scroll
     * itself) and only re-enters Angular when the header actually has to
     * change: twice per scroll burst - once to get out of the way, once to
     * come back - rather than hundreds of times.
     */
    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        const y = window.scrollY;
        this.set(this.scrolled, y > 8);

        // Near the top, and whenever the mobile sheet is open, the header
        // stays put: hiding it there would just make the page twitch.
        if (y <= HIDE_BELOW_PX || this.menuOpen() || this.prefersReducedMotion()) {
          clearTimeout(this.idleTimer);
          this.set(this.hidden, false);
          return;
        }

        this.set(this.hidden, true);

        // Coming back is what the idle timer is for: every scroll event
        // pushes it out, so it only fires once the page has settled.
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => this.set(this.hidden, false), SCROLL_IDLE_MS);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => {
        clearTimeout(this.idleTimer);
        window.removeEventListener('scroll', onScroll);
      });
      onScroll();
    });
  }

  /**
   * Keyboard users must never be left tabbing into something they cannot
   * see, so focus anywhere in the header brings it straight back.
   */
  @HostListener('focusin')
  onFocusIn(): void {
    clearTimeout(this.idleTimer);
    this.hidden.set(false);
  }

  /** Writes a signal from outside Angular, and only when the value changes. */
  private set(target: WritableSignal<boolean>, value: boolean): void {
    if (target() === value) return;
    this.zone.run(() => target.set(value));
  }

  /**
   * A header that slides away as the page moves is motion triggered by
   * interaction, so visitors who have asked for less of it keep a header
   * that simply stays where it is.
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Escape closes the mobile sheet, as it would any other overlay. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen()) this.closeMenu();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.lockScroll(this.menuOpen());
  }

  closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.lockScroll(false);
  }

  /** Stops the page scrolling behind the open mobile sheet. */
  private lockScroll(locked: boolean): void {
    if (!this.isBrowser) return;
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout().subscribe(() => {
      void this.router.navigateByUrl('/');
    });
  }
}
