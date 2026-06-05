import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
loginForm!:FormGroup;
isLoading =false;
errorMessage='';
showPassword =false;
constructor(
  private fb:FormBuilder,
  private authService:AuthService,
  private router:Router
)
{}
ngOnInit():void{
   this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
}
get email()
{
  return this.loginForm.get('email');
}
get password()
{
  return this.loginForm.get('password');
}
togglePassword():void{
  this.showPassword = !this.showPassword;
}
onSubmit():void{
  if(this.loginForm.invalid){
    this.loginForm.markAllAsTouched();
    return;
  }
  this.isLoading =true;
  this.errorMessage='';
  const {email,password} =this.loginForm.value;

 this.authService.login(email, password).subscribe({
      next: (credential) => {
        // Get role and redirect accordingly
        this.authService.getUserRole(credential.user.uid).subscribe({
          next: (role) => {
            console.log('User role:',role);
            this.isLoading = false;
            if (role === 'super-admin') {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          }
        });
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
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      default:
        return 'Login failed. Please try again.';
    }
  }
}
