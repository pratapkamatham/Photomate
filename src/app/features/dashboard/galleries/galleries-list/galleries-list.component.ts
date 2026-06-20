import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Gallery } from 'src/app/core/models/gallery.model';
import { GalleryService } from 'src/app/core/services/gallery.service';
import { PhotographerService } from 'src/app/core/services/photographer.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-galleries-list',
  templateUrl: './galleries-list.component.html',
  styleUrls: ['./galleries-list.component.css']
})
export class GalleriesListComponent implements OnInit {

  galleries: Gallery[] = [];
  photographerSlug = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private galleryService: GalleryService,
    private photographerService: PhotographerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.photographerService.getMyProfile().subscribe(profile => {
      this.photographerSlug = profile?.slug || '';
    });
    this.loadGalleries();
  }

  loadGalleries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.galleryService.getMyGalleries()
      .pipe(
        catchError((err) => {
          console.error('Gallery query error captured:', err);
          this.errorMessage = err?.message?.includes('index')
            ? 'Database setup in progress. Deploy the required Firestore index, then refresh.'
            : 'Failed to load galleries. Please try again.';
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (galleries) => {
          this.galleries = galleries;
          this.isLoading = false;
        }
      });
  }

  createGallery(): void {
    this.router.navigate(['/dashboard/galleries/create']);
  }

  uploadPhotos(galleryId: string): void {
    this.router.navigate([`/dashboard/galleries/${galleryId}/upload`]);
  }

  portfolioUrl(): string {
    if (!this.photographerSlug) return '';
    return `${window.location.origin}/${this.photographerSlug}`;
  }

  openPortfolio(event: Event): void {
    event.stopPropagation();
    const url = this.portfolioUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }

  async copyPortfolioUrl(event: Event): Promise<void> {
    event.stopPropagation();
    const url = this.portfolioUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
  }

  publicGalleryUrl(gallery: Gallery): string {
    if (!this.photographerSlug) return '';
    return `${window.location.origin}/${this.photographerSlug}/gallery/${gallery.slug}`;
  }

  openPublicGallery(gallery: Gallery, event: Event): void {
    event.stopPropagation();
    const url = this.publicGalleryUrl(gallery);
    if (url) window.open(url, '_blank', 'noopener');
  }

  async copyPublicGalleryUrl(gallery: Gallery, event: Event): Promise<void> {
    event.stopPropagation();
    const url = this.publicGalleryUrl(gallery);
    if (!url) return;
    await navigator.clipboard.writeText(url);
  }

  deleteGallery(gallery: Gallery, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete "${gallery.title}"? This cannot be undone.`)) return;

    this.galleryService.deleteGallery(gallery.id!).subscribe({
      next: () => {
        this.galleries = this.galleries.filter(g => g.id !== gallery.id);
      },
      error: () => {
        alert('Failed to delete gallery.');
      }
    });
  }
}

