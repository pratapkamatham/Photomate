import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

const routes: Routes = [
  // 1. Grouped Auth module comes first
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate:[authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'admin',
    canActivate:[authGuard,superAdminGuard],
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  //Subscription path management

  {
    path: 'upgrade',
    canActivate: [authGuard],
    loadChildren: () => import('./features/upgrade/upgrade.module').then(m => m.UpgradeModule)
  },
  {
    path: 'expired',
    canActivate: [authGuard],
    loadChildren: () => import('./features/upgrade/upgrade.module').then(m => m.UpgradeModule)
  },
  // 2. Public portfolios handle the empty root string '' dynamically
  {
    path: '', 
    loadChildren: () => import('./features/public/public.module').then(m => m.PublicModule)
  },

  // 3. Fallback/404 - strictly last
  {
    path: '**',
    component: NotFoundComponent
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
