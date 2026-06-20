import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicRoutingModule } from './public-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { PortfolioSectionViewComponent } from './portfolio-section-view/portfolio-section-view.component';
import { GalleryViewComponent } from './gallery-view/gallery-view.component';

@NgModule({
  declarations: [
    PortfolioComponent,
    GalleryViewComponent,
    PortfolioSectionViewComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModule,
    PublicRoutingModule
  ]
})
export class PublicModule { }


