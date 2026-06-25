import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BlogService } from '../../core/services/blog.service';
import { BookingsService } from '../../core/services/bookings.service';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly bookingsService = inject(BookingsService);
  private readonly blogService = inject(BlogService);

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
    forkJoin({
      users: this.usersService.getAll(),
      bookings: this.bookingsService.getAll(),
      posts: this.blogService.getAll(),
    }).subscribe(({ users, bookings, posts }) => {
      this.userCount.set(users.length);
      this.bookingCount.set(bookings.length);
      this.pendingBookingCount.set(bookings.filter((b) => b.status === 'PENDING').length);
      this.postCount.set(posts.length);
      this.publishedPostCount.set(posts.filter((p) => p.published).length);
      this.loading.set(false);
    });
  }
}
