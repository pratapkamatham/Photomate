import { SharedModule } from './../../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { HomeComponent } from './home/home.component';
import { PhotographersListComponent } from './photographers/photographers-list/photographers-list.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { AdminLayoutComponent } from './layout/layout.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    HomeComponent,
    PhotographersListComponent,
    SubscriptionsComponent,
    AdminLayoutComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule
  ]
})
export class AdminModule { }
