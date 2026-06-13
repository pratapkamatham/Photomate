import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PhotographerService } from '../../../core/services/photographer.service';
import { GalleryService } from '../../../core/services/gallery.service';
import { MediaAssetService } from '../../../core/services/media-asset.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Photographer } from '../../../core/models/photographer.model';
import { Gallery } from '../../../core/models/gallery.model';
import { MediaAsset } from '../../../core/models/media-asset.model';
 
@Component({
  selector: 'app-gallery-view',
  templateUrl: './gallery-view.component.html',
  styleUrls: ['./gallery-view.component.css']
})
export class GalleryViewComponent implements OnInit, OnDestroy {
 
  photographer: Photographer | null = null;
  gallery: Gallery | null = null;
  assets: MediaAsset[] = [];
  isLoading = true;
  notFound = false;
 
  // Lightbox
  lightboxOpen = false;
  lightboxIndex = 0;
 
  photographerSlug = '';
  gallerySlug = '';
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photographerService: PhotographerService,
    private galleryService: GalleryService,
    private mediaAssetService: MediaAssetService,
    private themeService: ThemeService,
    private title: Title
  ) {}
 
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.photographerSlug = params.get('photographerSlug') || '';
      this.gallerySlug      = params.get('gallerySlug') || '';
      this.loadGallery();
    });
  }
 
  loadGallery(): void {
    this.isLoading = true;
    this.notFound  = false;
 
    this.photographerService.getBySlug(this.photographerSlug)
      .subscribe({
        next: (photographer) => {
          if (!photographer || !photographer.isActive) {
            this.notFound = true;
            this.isLoading = false;
            return;
          }
 
          this.photographer = photographer;
 
          // Apply photographer theme
          if (photographer.theme) {
            this.themeService.applyTheme(photographer.theme);
          }
 
          this.galleryService.getGalleryBySlug(
            photographer.id!,
            this.gallerySlug
          ).subscribe({
            next: (gallery) => {
              if (!gallery) {
                this.notFound = true;
                this.isLoading = false;
                return;
              }
 
              this.gallery = gallery;
              this.title.setTitle(
                `${gallery.title} | ${photographer.studioName}`
              );
              this.loadAssets(gallery.id!);
            },
            error: () => {
              this.notFound = true;
              this.isLoading = false;
            }
          });
        },
        error: () => {
          this.notFound = true;
          this.isLoading = false;
        }
      });
  }
 
  loadAssets(galleryId: string): void {
    this.mediaAssetService.getGalleryAssets(galleryId).subscribe({
      next: (assets) => {
        this.assets    = assets;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }
 
  // -----------------------------------------------
  // Build optimized Cloudinary URLs
  // -----------------------------------------------
  buildImageUrl(asset: MediaAsset, width = 600): string {
    if (!asset.secureUrl) return '';
    return asset.secureUrl.replace(
      '/upload/',
      `/upload/f_auto,q_auto,w_${width},dpr_auto/`
    );
  }
 
  buildFullUrl(asset: MediaAsset): string {
    if (!asset.secureUrl) return '';
    return asset.secureUrl.replace(
      '/upload/',
      '/upload/f_auto,q_auto/'
    );
  }
 
  // -----------------------------------------------
  // LIGHTBOX
  // -----------------------------------------------
  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen  = true;
    document.body.style.overflow = 'hidden';
  }
 
  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }
 
  prevImage(): void {
    this.lightboxIndex =
      (this.lightboxIndex - 1 + this.assets.length) %
      this.assets.length;
  }
 
  nextImage(): void {
    this.lightboxIndex =
      (this.lightboxIndex + 1) % this.assets.length;
  }
 
  // Keyboard navigation
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    switch (event.key) {
      case 'ArrowRight': this.nextImage(); break;
      case 'ArrowLeft':  this.prevImage(); break;
      case 'Escape':     this.closeLightbox(); break;
    }
  }
 
  get currentAsset(): MediaAsset {
    return this.assets[this.lightboxIndex];
  }
 
  goBack(): void {
    this.router.navigate([`/${this.photographerSlug}`]);
  }
 
  ngOnDestroy(): void {
    this.themeService.resetToDefault();
    document.body.style.overflow = '';
    this.title.setTitle('PhotoMate');
  }
 
}