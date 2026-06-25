import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly isAuthenticated = this.authService.isAuthenticated;

  logout(): void {
    this.authService.logout().subscribe();
  }
}
