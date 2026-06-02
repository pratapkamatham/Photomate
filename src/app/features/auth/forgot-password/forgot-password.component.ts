import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
forgotForm!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
 
  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}
 
  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
 
  get email() { return this.forgotForm.get('email'); }
 
  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
 
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
 
    const { email } = this.forgotForm.value;
 
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage =
          'Password reset email sent. Please check your inbox.';
        this.forgotForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err.code);
      }
    });
  }
 
  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
