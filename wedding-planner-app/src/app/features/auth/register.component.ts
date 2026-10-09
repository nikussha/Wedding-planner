import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import { safeInternalRedirect } from '../../core/utils/safe-redirect.util';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './auth-form.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    inject(Title).setTitle('Register | Wedding Planner');
  }

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
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

    const { name, email, password } = this.form.getRawValue();
    this.authService
      .register(name, email, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const redirect = safeInternalRedirect(this.route.snapshot.queryParamMap.get('redirect'));
          this.router.navigateByUrl(redirect);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(extractErrorMessage(err, 'Registration failed. Please try again.'));
        },
      });
  }
}
