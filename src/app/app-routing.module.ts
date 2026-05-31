import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'/login',
    pathMatch:'full'
  },
  //Auth routes (lazy loaded)
  {
    path:'login',
    loadChildren:()=>import('./features/auth/auth.module').then(m=>m.AuthModule)
  },
  {
    path:'register',
    loadChildren:()=>import('./features/auth/auth.module').then(m=>m.AuthModule)
  },
  //Photographer Dashboard(Lazy loaded + auth guard)
  {
    path:'dashboard',
    loadChildren:()=>import('./features/dashboard/dashboard.module').then(m=>m.DashboardModule)
  },
  //Super Admin Panel(Lazy loaded + super admin gaurd)
  {
    path:'admin',
    loadChildren:()=>import('./features/admin/admin.module').then(m=>m.AdminModule)
  },

  //Dynamic Routes
   // Public photographer portfolio + galleries
  {
    path:'',
    loadChildren:()=>import('./features/public/public.module').then(m=>m.PublicModule)
  },
//404- must be absolute last
{
  path:'**',
  component:NotFoundComponent
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
