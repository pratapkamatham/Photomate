import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PhotographerService } from '../../../core/services/photographer.service';
import { GalleryService } from '../../../core/services/gallery.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Photographer } from '../../../core/models/photographer.model';
import { Gallery } from '../../../core/models/gallery.model';
 
@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit, OnDestroy {
 
  photographer: Photographer | null = null;
  galleries: Gallery[] = [];
  isLoading = true;
  notFound = false;
  slug = '';
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photographerService: PhotographerService,
    private galleryService: GalleryService,
    private themeService: ThemeService,
    private title: Title,
    private meta: Meta
  ) {}
 
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.slug = params.get('photographerSlug') || '';
      this.loadPortfolio();
    });
  }
 
  loadPortfolio(): void {
    this.isLoading = true;
    this.notFound = false;
 
    this.photographerService.getBySlug(this.slug).subscribe({
      next: (photographer) => {
        if (!photographer || !photographer.isActive) {
          this.notFound = true;
          this.isLoading = false;
          return;
        }
 
        this.photographer = photographer;
 
        // Apply photographer's custom theme
        if (photographer.theme) {
          this.themeService.applyTheme(photographer.theme);
        }
 
        // SEO meta tags
        this.title.setTitle(
          `${photographer.studioName} | Photography Portfolio`
        );
        this.meta.updateTag({
          name: 'description',
          content: photographer.bio ||
            `${photographer.studioName} - Professional Photography`
        });
 
        this.loadGalleries(photographer.id!);
      },
      error: () => {
        this.notFound = true;
        this.isLoading = false;
      }
    });
  }
 
  loadGalleries(photographerId: string): void {
    this.galleryService.getPublicGalleries(photographerId).subscribe({
      next: (galleries) => {
        this.galleries = galleries;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }
 
  goToGallery(gallery: Gallery): void {
    this.router.navigate([
      `/${this.slug}/gallery/${gallery.slug}`
    ]);
  }
 
  buildThumbnail(coverImage: string): string {
    if (!coverImage) return '';
    if (coverImage.includes('cloudinary.com')) {
      return coverImage.replace(
        '/upload/',
        '/upload/f_auto,q_auto,c_fill,w_600,h_400/'
      );
    }
    return coverImage;
  }
 
  ngOnDestroy(): void {
    // Reset to default PhotoMate theme when leaving public page
    this.themeService.resetToDefault();
    this.title.setTitle('PhotoMate');
  }
 
}