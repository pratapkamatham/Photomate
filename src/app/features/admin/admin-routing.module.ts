import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { PhotographersListComponent } from './photographers/photographers-list/photographers-list.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';

const routes: Routes = [
  {
    path:'',
    component:AdminLayoutComponent,
    children:[
      {path:'',component:HomeComponent},
            { path: 'photographers', component: PhotographersListComponent },
      { path: 'subscriptions', component: SubscriptionsComponent }

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
