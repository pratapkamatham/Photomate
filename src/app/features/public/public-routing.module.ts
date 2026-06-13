import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GalleryViewComponent } from './gallery-view/gallery-view.component';
import { PortfolioComponent } from './portfolio/portfolio.component';

const routes: Routes = [{
    // Public gallery view MUST come before portfolio
    // to avoid :photographerSlug catching 'gallery'
    path: ':photographerSlug/gallery/:gallerySlug',
    component: GalleryViewComponent
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
