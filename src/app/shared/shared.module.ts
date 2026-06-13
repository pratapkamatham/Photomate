import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { ImageCardComponent } from './components/image-card/image-card.component';
import { LightboxComponent } from './components/lightbox/lightbox.component';
import { LoaderComponent } from './components/loader/loader.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { CloudinaryUrlPipe } from './pipes/cloudinary-url.pipe';
import { LazyImageDirective } from './directives/lazy-image.directive';
import { PopupComponent } from './components/trial/popup/popup.component';



@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    ImageCardComponent,
    LightboxComponent,
    LoaderComponent,
    NotFoundComponent,
    CloudinaryUrlPipe,
    LazyImageDirective,
    PopupComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports:[
    NavbarComponent,
    FooterComponent,
    ImageCardComponent,
    LightboxComponent,
    LoaderComponent,
    NotFoundComponent,
    CloudinaryUrlPipe,
    LazyImageDirective
  ]
})
export class SharedModule { }
