import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // SEO-critical pages with dynamic CMS content: render on each request.
  { path: '', renderMode: RenderMode.Server },
  { path: 'services', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/:slug', renderMode: RenderMode.Server },
  // Public availability: worth rendering on the server so the calendar is
  // visible on first paint and indexable.
  { path: 'booking', renderMode: RenderMode.Server },
  // Transactional / personalized pages: no SEO value, render in the browser.
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'register', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
