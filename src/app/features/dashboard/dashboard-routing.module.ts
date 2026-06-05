import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardLayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { GalleriesListComponent } from './galleries/galleries-list/galleries-list.component';
import { BrandingComponent } from './branding/branding.component';
import { CloudinaryConnectComponent } from './cloudinary-connect/cloudinary-connect.component';
import { GalleryCreateComponent } from './galleries/gallery-create/gallery-create.component';
import { GalleryUploadComponent } from './galleries/gallery-upload/gallery-upload.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
   {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'galleries', component: GalleriesListComponent },
      { path: 'galleries/create', component: GalleryCreateComponent },
      { path: 'galleries/:id/upload', component: GalleryUploadComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'cloudinary', component: CloudinaryConnectComponent },
      { path: 'branding', component: BrandingComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
