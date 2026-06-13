import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { affiliateGuard } from './core/guards/affiliate.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'admin',
    canActivate: [authGuard, superAdminGuard],
    loadChildren: () =>
      import('./features/admin/admin.module').then(m => m.AdminModule)
  },
   {
    path: 'affiliate-portal',
    canActivate: [authGuard, affiliateGuard],
    loadChildren: () =>
      import('./features/affiliate-portal/affiliate-portal.module')
        .then(m => m.AffiliatePortalModule)
  },
  {
    path: 'upgrade',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/upgrade/upgrade.module').then(m => m.UpgradeModule)
  },
  {
    path: 'expired',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/upgrade/upgrade.module').then(m => m.UpgradeModule)
  },

  // public portfolio routes should come after fixed routes
  {
    path: '',
    loadChildren: () =>
      import('./features/public/public.module').then(m => m.PublicModule)
  },

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
