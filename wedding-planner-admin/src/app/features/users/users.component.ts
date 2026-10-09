import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Role, User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'app-users',
  imports: [DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);

  constructor() {
    inject(Title).setTitle('Users | Wedding Planner Admin');
  }

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly updatingId = signal<string | null>(null);

  readonly currentUserId = computed(() => this.authService.user()?.id);

  ngOnInit(): void {
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleRole(user: User): void {
    if (user.id === this.currentUserId()) return;

    const newRole: Role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    this.updatingId.set(user.id);

    this.usersService.updateRole(user.id, newRole).subscribe({
      next: (updated) => {
        this.users.update((users) =>
          users.map((u) => (u.id === user.id ? { ...u, role: updated.role } : u)),
        );
        this.updatingId.set(null);
      },
      error: () => this.updatingId.set(null),
    });
  }
}
