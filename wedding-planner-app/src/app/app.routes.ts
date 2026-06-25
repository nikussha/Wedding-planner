import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/blog-list.component').then((m) => m.BlogListComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./features/blog/blog-detail.component').then((m) => m.BlogDetailComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'booking',
    canActivate: [authGuard],
    loadComponent: () => import('./features/booking/booking.component').then((m) => m.BookingComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
