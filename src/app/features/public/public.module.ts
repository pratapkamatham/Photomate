import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicRoutingModule } from './public-routing.module';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { GalleryViewComponent } from './gallery-view/gallery-view.component';


@NgModule({
  declarations: [
    PortfolioComponent,
    GalleryViewComponent
  ],
  imports: [
    CommonModule,
    PublicRoutingModule
  ]
})
export class PublicModule { }
