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
import { LeadsComponent } from './leads/leads.component';
import { PortfolioSectionListComponent } from './portfolio-sections/portfolio-section-list/portfolio-section-list.component';
import { PortfolioSectionCreateComponent } from './portfolio-sections/portfolio-section-create/portfolio-section-create.component';
import { PortfolioSectionUploadComponent } from './portfolio-sections/portfolio-section-upload/portfolio-section-upload.component';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    HomeComponent,
    GalleriesListComponent,
    GalleryCreateComponent,
    GalleryUploadComponent,
    SettingsComponent,
    CloudinaryConnectComponent,
    BrandingComponent,
    DashboardLayoutComponent,
    LeadsComponent,
    PortfolioSectionListComponent,
    PortfolioSectionCreateComponent,
    PortfolioSectionUploadComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    RouterModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class DashboardModule { }


