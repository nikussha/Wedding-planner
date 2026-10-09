import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  constructor() {
    inject(Title).setTitle('Dashboard | Wedding Planner Admin');
  }

  readonly loading = signal(true);
  readonly userCount = signal(0);
  readonly bookingCount = signal(0);
  readonly pendingBookingCount = signal(0);
  readonly postCount = signal(0);
  readonly publishedPostCount = signal(0);

  ngOnInit(): void {
    this.statsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.userCount.set(stats.userCount);
        this.bookingCount.set(stats.bookingCount);
        this.pendingBookingCount.set(stats.pendingBookingCount);
        this.postCount.set(stats.postCount);
        this.publishedPostCount.set(stats.publishedPostCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
