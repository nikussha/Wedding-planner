import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;

  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  readonly navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/content', label: 'Page Text' },
    { path: '/services', label: 'Services' },
    { path: '/process', label: 'How It Works' },
    { path: '/faq', label: 'Q & A' },
    { path: '/testimonials', label: 'Testimonials' },
    { path: '/photos', label: 'Photos' },
    { path: '/blog', label: 'Blog' },
    { path: '/bookings', label: 'Bookings' },
    { path: '/enquiries', label: 'Enquiries' },
    { path: '/availability', label: 'Opening Hours' },
    { path: '/users', label: 'Users' },
  ];

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigateByUrl('/login');
    });
  }
}
