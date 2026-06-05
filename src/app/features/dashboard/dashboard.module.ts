import { SharedModule } from './../../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './home/home.component';
import { GalleriesListComponent } from './galleries/galleries-list/galleries-list.component';
import { GalleryCreateComponent } from './galleries/gallery-create/gallery-create.component';
import { GalleryUploadComponent } from './galleries/gallery-upload/gallery-upload.component';
import { SettingsComponent } from './settings/settings.component';
import { CloudinaryConnectComponent } from './cloudinary-connect/cloudinary-connect.component';
import { BrandingComponent } from './branding/branding.component';
import { DashboardLayoutComponent } from './layout/layout.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    HomeComponent,
    GalleriesListComponent,
    GalleryCreateComponent,
    GalleryUploadComponent,
    SettingsComponent,
    CloudinaryConnectComponent,
    BrandingComponent,
    DashboardLayoutComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    RouterModule,
    SharedModule
  ]
})
export class DashboardModule { }
