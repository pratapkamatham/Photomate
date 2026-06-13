import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpiredComponent } from './expired/expired.component';
import { UpgradeComponent } from './upgrade/upgrade.component';

const routes: Routes = [
  { path: '',        component: UpgradeComponent },
  { path: 'expired', component: ExpiredComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UpgradeRoutingModule { }
