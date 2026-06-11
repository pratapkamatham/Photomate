import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CloudinaryService, UploadProgress } from '../../../../core/services/cloudinary.service';
import { MediaAssetService } from '../../../../core/services/media-asset.service';
import { GalleryService } from '../../../../core/services/gallery.service';
import { PhotographerService } from '../../../../core/services/photographer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Gallery } from '../../../../core/models/gallery.model';
import { Photographer } from '../../../../core/models/photographer.model';

export interface UploadItem {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  publicId?: string;
  secureUrl?: string;
  error?: string;
}

@Component({
  selector: 'app-gallery-upload',
  templateUrl: './gallery-upload.component.html',
  styleUrls: ['./gallery-upload.component.css']
})
export class GalleryUploadComponent implements OnInit {

  galleryId = '';
  gallery: Gallery | null = null;
  photographer: Photographer | null = null;
  uploadItems: UploadItem[] = [];
  isDragOver = false;
  isLoadingGallery = true;
  cloudinaryConfigured = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cloudinaryService: CloudinaryService,
    private mediaAssetService: MediaAssetService,
    private galleryService: GalleryService,
    private photographerService: PhotographerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.galleryId = this.route.snapshot.paramMap.get('id') || '';
    this.loadData();
  }

  loadData(): void {
    this.galleryService.getGalleryById(this.galleryId).subscribe({
      next: (gallery) => {
        this.gallery = gallery;
        this.loadPhotographerProfile();
      },
      error: () => {
        this.errorMessage = 'Gallery not found.';
        this.isLoadingGallery = false;
      }
    });
  }

  loadPhotographerProfile(): void {
    this.photographerService.getMyProfile().subscribe({
      next: (profile) => {
        this.photographer = profile;
        this.cloudinaryConfigured = !!profile?.cloudinary?.cloudName;
        this.isLoadingGallery = false;
      },
      error: () => { this.isLoadingGallery = false; }
    });
  }

  // -----------------------------------------------
  // FILE SELECTION
  // -----------------------------------------------
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  addFiles(files: File[]): void {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadItems.push({
          file,
          preview: e.target?.result as string,
          progress: 0,
          status: 'pending'
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeItem(index: number): void {
    this.uploadItems.splice(index, 1);
  }

  // -----------------------------------------------
  // UPLOAD ALL
  // -----------------------------------------------
  uploadAll(): void {
    const pending = this.uploadItems.filter(i => i.status === 'pending');
    if (pending.length === 0) return;
 
    const uid = this.authService.getCurrentUser()?.uid;
    if (!uid || !this.photographer) return;
 
    pending.forEach(item => this.uploadSingle(item, uid));
  }

  uploadSingle(item: UploadItem, uid: string): void {
 
    // FIX 5: Validate file before requesting signature
    const validation = this.cloudinaryService.validateFile(item.file);
    if (!validation.valid) {
      item.status = 'error';
      item.error = validation.error || 'Invalid file.';
      return;
    }
 
    item.status = 'uploading';
    item.progress = 0;
 
    // FIX 4: Pass galleryId only - server controls folder
    this.cloudinaryService.getUploadSignature(this.galleryId)
      .subscribe({
        next: (signatureData) => {
          this.cloudinaryService.uploadFile(item.file, signatureData)
            .subscribe({
              next: (progress: UploadProgress) => {
                item.progress = progress.progress;
 
                if (progress.done) {
                  item.status = 'done';
                  item.publicId = progress.publicId;
                  item.secureUrl = progress.secureUrl;
 
                  // Save metadata to Firestore
                  this.mediaAssetService.saveAsset({
                    galleryId:      this.galleryId,
                    photographerId: uid,
                    publicId:       progress.publicId!,
                    secureUrl:      progress.secureUrl!,
                    width:          progress.width  || 0,
                    height:         progress.height || 0
                  }).subscribe();
 
                  this.updateCoverIfNeeded(progress.secureUrl!);
                }
              },
              error: () => {
                item.status = 'error';
                item.error = 'Upload failed. Please try again.';
              }
            });
        },
        error: (err) => {
          item.status = 'error';
          item.error = err?.message || 'Could not get upload signature.';
        }
      });
  }

  updateCoverIfNeeded(secureUrl: string): void {
    if (!this.gallery?.coverImage) {
      this.galleryService.updateGallery(this.galleryId, {
        coverImage: secureUrl
      }).subscribe();
      if (this.gallery) this.gallery.coverImage = secureUrl;
    }
  }

  get pendingCount(): number {
    return this.uploadItems.filter(i => i.status === 'pending').length;
  }

  get doneCount(): number {
    return this.uploadItems.filter(i => i.status === 'done').length;
  }

  get uploadingCount(): number {
    return this.uploadItems.filter(i => i.status === 'uploading').length;
  }

  goToGalleries(): void {
    this.router.navigate(['/dashboard/galleries']);
  }

}


