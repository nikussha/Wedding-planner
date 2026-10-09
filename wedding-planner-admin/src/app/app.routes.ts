import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [adminGuard],
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'content',
        loadComponent: () => import('./features/content/content.component').then((m) => m.ContentComponent),
      },
      {
        path: 'photos',
        loadComponent: () => import('./features/photos/photos.component').then((m) => m.PhotosComponent),
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/blog/blog-list.component').then((m) => m.BlogListComponent),
      },
      {
        path: 'blog/new',
        loadComponent: () => import('./features/blog/blog-form.component').then((m) => m.BlogFormComponent),
      },
      {
        path: 'blog/:id/edit',
        loadComponent: () => import('./features/blog/blog-form.component').then((m) => m.BlogFormComponent),
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'services',
        data: { listKey: 'service-tiers' },
        loadComponent: () =>
          import('./features/content-lists/content-list.component').then(
            (m) => m.ContentListComponent,
          ),
      },
      {
        path: 'process',
        data: { listKey: 'process' },
        loadComponent: () =>
          import('./features/content-lists/content-list.component').then(
            (m) => m.ContentListComponent,
          ),
      },
      {
        path: 'faq',
        data: { listKey: 'faq' },
        loadComponent: () =>
          import('./features/content-lists/content-list.component').then(
            (m) => m.ContentListComponent,
          ),
      },
      {
        path: 'testimonials',
        data: { listKey: 'testimonials' },
        loadComponent: () =>
          import('./features/content-lists/content-list.component').then(
            (m) => m.ContentListComponent,
          ),
      },
      {
        path: 'enquiries',
        loadComponent: () =>
          import('./features/enquiries/enquiries.component').then((m) => m.EnquiriesComponent),
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./features/availability/availability.component').then((m) => m.AvailabilityComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
