import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    inject(Title).setTitle('Login | Wedding Planner Admin');
  }

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.router.navigateByUrl('/dashboard');
          return;
        }

        this.submitting.set(false);
        this.errorMessage.set('This account does not have admin access.');
        this.authService.logout().subscribe();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Invalid email or password.'));
      },
    });
  }
}
