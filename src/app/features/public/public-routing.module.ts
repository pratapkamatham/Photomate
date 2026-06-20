import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GalleryViewComponent } from './gallery-view/gallery-view.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { PortfolioSectionViewComponent } from './portfolio-section-view/portfolio-section-view.component';

const routes: Routes = [{
    // Public gallery view MUST come before portfolio
    // to avoid :photographerSlug catching 'gallery'
    path: ':photographerSlug/gallery/:gallerySlug',
    component: GalleryViewComponent
  },
  {
    path: ':photographerSlug/portfolio/:sectionSlug',
    component: PortfolioSectionViewComponent
  },
  {
    path: ':photographerSlug',
    component: PortfolioComponent
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }

