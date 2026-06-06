import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Gallery } from 'src/app/core/models/gallery.model';
import { GalleryService } from 'src/app/core/services/gallery.service';

@Component({
  selector: 'app-galleries-list',
  templateUrl: './galleries-list.component.html',
  styleUrls: ['./galleries-list.component.css']
})
export class GalleriesListComponent implements OnInit {
 
  galleries: Gallery[] = [];
  isLoading = true;
  errorMessage = '';
 
  constructor(
    private galleryService: GalleryService,
    private router: Router
  ) {}
 
  ngOnInit(): void {
    this.loadGalleries();
  }
 
  loadGalleries(): void {
    this.isLoading = true;
    this.galleryService.getMyGalleries().subscribe({
      next: (galleries) => {
        this.galleries = galleries;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load galleries.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
 
  createGallery(): void {
    this.router.navigate(['/dashboard/galleries/create']);
  }
 
  uploadPhotos(galleryId: string): void {
    this.router.navigate([`/dashboard/galleries/${galleryId}/upload`]);
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
