import { Component, inject } from '@angular/core';
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

  readonly navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/content', label: 'Site Content' },
    { path: '/photos', label: 'Photos' },
    { path: '/blog', label: 'Blog' },
    { path: '/bookings', label: 'Bookings' },
    { path: '/users', label: 'Users' },
  ];

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigateByUrl('/login');
    });
  }
}
