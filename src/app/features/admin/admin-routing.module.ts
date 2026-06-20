import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { PhotographersListComponent } from './photographers/photographers-list/photographers-list.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { PlatformSettingsComponent } from './platform-settings/platform-settings.component';
import { SubscriptionActivationComponent } from './subscription-activation/subscription-activation.component';
import { AffiliatesListComponent } from './affiliates/affiliates-list/affiliates-list.component';
import { AffiliateDetailComponent } from './affiliates/affiliate-detail/affiliate-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'photographers', component: PhotographersListComponent },
      { path: 'subscriptions', component: SubscriptionsComponent },
      { path: 'settings', component: PlatformSettingsComponent },
      { path: 'activate', component: SubscriptionActivationComponent },
      { path: 'affiliates', component: AffiliatesListComponent },
      { path: 'affiliates/:id', component: AffiliateDetailComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
