import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CloudinaryService, UploadProgress } from '../../../../core/services/cloudinary.service';
import { GalleryService } from '../../../../core/services/gallery.service';
import { MediaAssetService } from '../../../../core/services/media-asset.service';
import { AuthService } from '../../../../core/services/auth.service';
import { take } from 'rxjs/operators'; // STEP 1: Imported take operator

interface UploadItem {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  publicId?: string;
  secureUrl?: string;
}

@Component({
  selector: 'app-gallery-upload',
  templateUrl: './gallery-upload.component.html',
  styleUrls: ['./gallery-upload.component.css']
})
export class GalleryUploadComponent implements OnInit {

  galleryId = '';
  gallery: any = null;
  isLoadingGallery = true;
  cloudinaryConfigured = true;
  photographer: any = null;

  uploadItems: UploadItem[] = [];
  isDragOver = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cloudinaryService: CloudinaryService,
    private galleryService: GalleryService,
    private mediaAssetService: MediaAssetService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.galleryId = this.route.snapshot.paramMap.get('id') || '';
    this.loadGalleryDetails();
  }

  loadGalleryDetails(): void {
    this.galleryService.getGalleryById(this.galleryId).subscribe({
      next: (gallery: any) => {
        this.gallery = gallery;
        this.isLoadingGallery = false;
      },
      error: () => {
        this.isLoadingGallery = false;
      }
    });
  }

  // --- Drag & Drop Handlers ---
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
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  /**
   * Performance Boost: Using URL.createObjectURL for lightning fast previews 
   * and drastically low browser memory footprint.
   */
  handleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.uploadItems.push({
        file: file,
        preview: URL.createObjectURL(file), // Replaced FileReader with Object URL
        progress: 0,
        status: 'pending'
      });
    }
  }

  removeItem(index: number): void {
    if (this.uploadItems[index].status === 'pending') {
      // Clean up the Object URL from memory before removing the item
      URL.revokeObjectURL(this.uploadItems[index].preview);
      this.uploadItems.splice(index, 1);
    }
  }

  // --- Exact Fix: Added Template Counter Getters ---
  get doneCount(): number {
    return this.uploadItems.filter(item => item.status === 'done').length;
  }

  get uploadingCount(): number {
    return this.uploadItems.filter(item => item.status === 'uploading').length;
  }

  get pendingCount(): number {
    return this.uploadItems.filter(item => item.status === 'pending').length;
  }

  // --- Upload Logic ---
  uploadAll(): void {
    const pending = this.uploadItems.filter(i => i.status === 'pending');
    if (pending.length === 0) return;

    // STEP 2 & 3: Replaced manual subscription with pipe(take(1)) and removed ngOnDestroy
    this.authService.currentUser$
      .pipe(take(1))
      .subscribe((user: any) => {
        if (!user) return;
        pending.forEach(item => this.uploadSingle(item, user.uid));
      });
  }

  uploadSingle(item: UploadItem, uid: string): void {
    const validation = this.cloudinaryService.validateFile(item.file);
    if (!validation.valid) {
      item.status = 'error';
      item.error = validation.error || 'Invalid file.';
      return;
    }

    item.status = 'uploading';
    item.progress = 0;

    this.cloudinaryService.getUploadSignature(this.galleryId)
      .subscribe({
        next: (signatureData: any) => {
          this.cloudinaryService.uploadFile(item.file, signatureData)
            .subscribe({
              next: (progress: UploadProgress) => {
                item.progress = progress.progress;

                if (progress.done) {
                  item.status = 'done';
                  item.publicId = progress.publicId;
                  item.secureUrl = progress.secureUrl;

                  this.mediaAssetService.saveAsset({
                    galleryId:      this.galleryId,
                    photographerId: uid,
                    publicId:       progress.publicId!,
                    secureUrl:      progress.secureUrl!,
                    width:          progress.width  || 0,
                    height:         progress.height || 0
                  }).subscribe();
                }
              },
              error: () => {
                item.status = 'error';
                item.error = 'Upload failed. Please try again.';
              }
            });
        },
        error: (err: any) => {
          item.status = 'error';
          item.error = err?.message || 'Could not get upload signature.';
        }
      });
  }

  goToGalleries(): void {
    // Optional: Revoke all object URLs to completely free up browser memory upon navigation
    this.uploadItems.forEach(item => URL.revokeObjectURL(item.preview));
    this.router.navigate(['/dashboard/galleries']);
  }
}