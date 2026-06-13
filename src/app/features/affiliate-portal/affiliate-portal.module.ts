import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AffiliatePortalRoutingModule } from './affiliate-portal-routing.module';
import { LayoutComponent } from './layout/layout.component';
import { OverviewComponent } from './overview/overview.component';
import { MyCodesComponent } from './my-codes/my-codes.component';
import { MySalesComponent } from './my-sales/my-sales.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    LayoutComponent,
    OverviewComponent,
    MyCodesComponent,
    MySalesComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    FormsModule,
    AffiliatePortalRoutingModule
  ]
})
export class AffiliatePortalModule { }
