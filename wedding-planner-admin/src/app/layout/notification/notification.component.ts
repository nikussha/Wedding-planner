import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent {
  private readonly notifications = inject(NotificationService);
  readonly toasts = this.notifications.toasts;

  dismiss(id: number): void {
    this.notifications.dismiss(id);
  }
}
