import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UpgradeRoutingModule } from './upgrade-routing.module';
import { UpgradeComponent } from './upgrade/upgrade.component';
import { ExpiredComponent } from './expired/expired.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UpgradeComponent,
    ExpiredComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    UpgradeRoutingModule
  ]
})
export class UpgradeModule { }
