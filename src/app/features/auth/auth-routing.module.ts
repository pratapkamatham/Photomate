import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // /auth -> /auth/login
  { path: 'login', component: LoginComponent },           // /auth/login
  { path: 'register', component: RegisterComponent },       // /auth/register
  { path: 'forgot-password', component: ForgotPasswordComponent } // /auth/forgot-password
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
