import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicRoutingModule } from './public-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { GalleryViewComponent } from './gallery-view/gallery-view.component';


@NgModule({
  declarations: [
    PortfolioComponent,
    GalleryViewComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    PublicRoutingModule
  ]
})
export class PublicModule { }
