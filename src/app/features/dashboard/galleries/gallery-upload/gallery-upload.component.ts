import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CloudinaryService, UploadProgress } from '../../../../core/services/cloudinary.service';
import { GalleryService } from '../../../../core/services/gallery.service';
import { MediaAssetService } from '../../../../core/services/media-asset.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PhotographerService } from '../../../../core/services/photographer.service';
import { MediaAsset } from '../../../../core/models/media-asset.model';
import { take, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface UploadItem {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'optimizing' | 'uploading' | 'done' | 'error';
  error?: string;
  publicId?: string;
  secureUrl?: string;
  optimizedSize?: number;
  wasCompressed?: boolean;
  metadataSaved?: boolean;
}

@Component({
  selector: 'app-gallery-upload',
  templateUrl: './gallery-upload.component.html',
  styleUrls: ['./gallery-upload.component.css']
})
export class GalleryUploadComponent implements OnInit {

  galleryId = '';
  gallery: any = null;
  photographerSlug = '';
  isLoadingGallery = true;
  isLoadingAssets = true;
  cloudinaryConfigured = true;

  uploadItems: UploadItem[] = [];
  uploadedAssets: MediaAsset[] = [];
  isDragOver = false;
  isUploading = false;
  uploadError = '';
  copyMessage = '';
  totalQueuedCount = 0;
  sessionUploadedCount = 0;
  uploadedDisplayLimit = 120;

  private readonly maxParallelUploads = 2;
  private readonly queuePreviewLimit = 60;
  private readonly uploadedPageSize = 120;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cloudinaryService: CloudinaryService,
    private galleryService: GalleryService,
    private mediaAssetService: MediaAssetService,
    private authService: AuthService,
    private photographerService: PhotographerService
  ) {}

  ngOnInit(): void {
    this.galleryId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPhotographer();
    this.loadGalleryDetails();
    this.loadUploadedAssets();
  }

  loadPhotographer(): void {
    this.photographerService.getMyProfile().pipe(take(1)).subscribe(profile => {
      this.photographerSlug = profile?.slug || '';
    });
  }

  loadGalleryDetails(): void {
    this.galleryService.getGalleryById(this.galleryId).subscribe({
      next: (gallery: any) => {
        this.gallery = gallery;
        this.backfillGalleryShareFields(gallery);
        this.isLoadingGallery = false;
      },
      error: () => {
        this.isLoadingGallery = false;
      }
    });
  }

  private backfillGalleryShareFields(gallery: any): void {
    if (!gallery?.id) return;

    const update: any = {};
    if (gallery.isPrivate === undefined || gallery.isPrivate === null) {
      update.isPrivate = false;
      gallery.isPrivate = false;
    }
    if (!gallery.sections?.length) {
      update.sections = [{
        id: 'highlights',
        title: 'Highlights',
        description: 'Best moments from this event',
        sortOrder: 0
      }];
      update.defaultSectionId = 'highlights';
      gallery.sections = update.sections;
      gallery.defaultSectionId = 'highlights';
    }
    if (!gallery.shareSettings) {
      update.shareSettings = {
        allowDownloads: false,
        showBranding: true,
        leadCaptureEnabled: true,
        ctaLabel: 'Book this photographer'
      };
      gallery.shareSettings = update.shareSettings;
    }

    if (Object.keys(update).length) {
      this.galleryService.updateGallery(gallery.id, update).pipe(take(1)).subscribe({
        error: err => console.error('Failed to backfill gallery sharing fields:', err)
      });
    }
  }

  loadUploadedAssets(): void {
    this.isLoadingAssets = true;
    this.mediaAssetService.getGalleryAssets(this.galleryId).pipe(take(1)).subscribe({
      next: assets => {
        this.uploadedAssets = this.dedupeAssets(assets);
        this.isLoadingAssets = false;
      },
      error: err => {
        console.error('Failed to load uploaded assets:', err);
        this.isLoadingAssets = false;
      }
    });
  }

  publicGalleryUrl(): string {
    if (!this.photographerSlug || !this.gallery?.slug) return '';
    return `${window.location.origin}/${this.photographerSlug}/gallery/${this.gallery.slug}`;
  }

  openPublicGallery(): void {
    const url = this.publicGalleryUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }

  async copyPublicGalleryUrl(): Promise<void> {
    const url = this.publicGalleryUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    this.copyMessage = 'Public album link copied.';
    setTimeout(() => this.copyMessage = '', 2500);
  }

  private dedupeAssets(assets: MediaAsset[]): MediaAsset[] {
    const seen = new Set<string>();
    return assets.filter(asset => {
      const key = asset.publicId || asset.secureUrl || asset.id || '';
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  get selectedHeroImages(): string[] {
    return this.gallery?.heroImages || [];
  }

  isHeroAsset(asset: MediaAsset): boolean {
    return !!asset.secureUrl && (
      this.selectedHeroImages.includes(asset.secureUrl) ||
      this.gallery?.heroImage === asset.secureUrl ||
      (!this.gallery?.heroImage && this.gallery?.coverImage === asset.secureUrl)
    );
  }

  canAddHeroImage(asset: MediaAsset): boolean {
    return !!asset.secureUrl &&
      !this.selectedHeroImages.includes(asset.secureUrl) &&
      this.selectedHeroImages.length < 5;
  }

  addHeroImage(asset: MediaAsset, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.canAddHeroImage(asset)) return;

    const heroImages = [...this.selectedHeroImages, asset.secureUrl];
    this.updateHeroImages(heroImages, asset.secureUrl);
  }

  removeHeroImage(asset: MediaAsset, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!asset.secureUrl) return;

    const heroImages = this.selectedHeroImages.filter(url => url !== asset.secureUrl);
    this.updateHeroImages(heroImages, heroImages[0] || this.gallery?.coverImage || '');
  }

  private updateHeroImages(heroImages: string[], primaryHeroImage: string): void {
    this.galleryService.updateGallery(this.galleryId, {
      heroImages,
      heroImage: primaryHeroImage || null
    } as any).pipe(take(1)).subscribe({
      next: () => {
        this.gallery = {
          ...this.gallery,
          heroImages,
          heroImage: primaryHeroImage || ''
        };
        this.copyMessage = `Hero images updated (${heroImages.length}/5).`;
        setTimeout(() => this.copyMessage = '', 2500);
      },
      error: err => {
        console.error('Failed to update hero images:', err);
        this.copyMessage = 'Could not update hero images.';
        setTimeout(() => this.copyMessage = '', 2500);
      }
    });
  }

  setHeroImage(asset: MediaAsset, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!asset.secureUrl) return;

    const heroImages = [
      asset.secureUrl,
      ...this.selectedHeroImages.filter(url => url !== asset.secureUrl)
    ].slice(0, 5);

    this.galleryService.updateGallery(this.galleryId, {
      heroImages,
      heroImage: asset.secureUrl,
      coverImage: this.gallery?.coverImage || asset.secureUrl
    }).pipe(take(1)).subscribe({
      next: () => {
        this.gallery = {
          ...this.gallery,
          heroImages,
          heroImage: asset.secureUrl,
          coverImage: this.gallery?.coverImage || asset.secureUrl
        };
        this.copyMessage = `Primary hero updated (${heroImages.length}/5).`;
        setTimeout(() => this.copyMessage = '', 2500);
      },
      error: err => {
        console.error('Failed to set hero image:', err);
        this.copyMessage = 'Could not update hero image.';
        setTimeout(() => this.copyMessage = '', 2500);
      }
    });
  }

  buildThumb(asset: MediaAsset, width = 500): string {
    if (!asset.secureUrl) return '';
    return asset.secureUrl.includes('cloudinary.com')
      ? asset.secureUrl.replace('/upload/', `/upload/f_auto,q_auto,c_fill,w_${width},h_${width}/`)
      : asset.secureUrl;
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
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
      input.value = '';
    }
  }

  handleFiles(files: FileList): void {
    this.uploadError = '';
    this.sessionUploadedCount = 0;
    this.totalQueuedCount += files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.uploadItems.push({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending'
      });
    }
  }

  removeItem(index: number): void {
    const item = this.visibleUploadItems[index];
    const actualIndex = this.uploadItems.indexOf(item);
    if (actualIndex >= 0 && (item.status === 'pending' || item.status === 'error')) {
      URL.revokeObjectURL(item.preview);
      this.uploadItems.splice(actualIndex, 1);
      this.totalQueuedCount = Math.max(this.totalQueuedCount - 1, this.uploadItems.length);
    }
  }

  clearCompletedQueue(): void {
    this.uploadItems
      .filter(item => item.status === 'done')
      .forEach(item => URL.revokeObjectURL(item.preview));
    this.uploadItems = this.uploadItems.filter(item => item.status !== 'done');
  }

  get doneCount(): number {
    return this.sessionUploadedCount;
  }

  get failedCount(): number {
    return this.uploadItems.filter(item => item.status === 'error').length;
  }

  get uploadingCount(): number {
    return this.uploadItems.filter(item => item.status === 'uploading' || item.status === 'optimizing').length;
  }

  get pendingCount(): number {
    return this.uploadItems.filter(item => item.status === 'pending').length;
  }

  get activeQueueCount(): number {
    return this.uploadItems.length;
  }

  get visibleUploadItems(): UploadItem[] {
    const priority = this.uploadItems.filter(item => item.status !== 'pending');
    const pending = this.uploadItems.filter(item => item.status === 'pending');
    return [...priority, ...pending].slice(0, this.queuePreviewLimit);
  }

  get hiddenQueueCount(): number {
    return Math.max(this.uploadItems.length - this.visibleUploadItems.length, 0);
  }

  get visibleUploadedAssets(): MediaAsset[] {
    return this.uploadedAssets.slice(0, this.uploadedDisplayLimit);
  }

  get hasMoreUploadedAssets(): boolean {
    return this.uploadedAssets.length > this.uploadedDisplayLimit;
  }

  showMoreUploadedAssets(): void {
    this.uploadedDisplayLimit += this.uploadedPageSize;
  }

  uploadAll(): void {
    const pending = this.uploadItems.filter(i => i.status === 'pending');
    if (pending.length === 0 || this.isUploading) return;

    this.isUploading = true;
    this.uploadError = '';

    this.authService.currentUser$
      .pipe(take(1))
      .subscribe({
        next: async (user: any) => {
          if (!user) {
            this.isUploading = false;
            this.uploadError = 'You must be logged in to upload photos.';
            return;
          }

          await this.uploadQueue(pending, user.uid);
          this.isUploading = false;
          this.loadUploadedAssets();
        },
        error: () => {
          this.isUploading = false;
          this.uploadError = 'Could not verify your login session.';
        }
      });
  }

  private async uploadQueue(items: UploadItem[], uid: string): Promise<void> {
    for (let i = 0; i < items.length; i += this.maxParallelUploads) {
      const batch = items.slice(i, i + this.maxParallelUploads);
      await Promise.all(batch.map(item => this.uploadSingle(item, uid)));
    }
  }

  uploadSingle(item: UploadItem, uid: string): Promise<void> {
    const validation = this.cloudinaryService.validateFile(item.file);
    if (!validation.valid) {
      item.status = 'error';
      item.error = validation.error || 'Invalid file.';
      return Promise.resolve();
    }

    item.status = 'optimizing';
    item.progress = 0;
    item.error = '';

    return new Promise(resolve => {
      of(null)
        .pipe(
          switchMap(() => this.cloudinaryService.prepareFileForUpload(item.file)),
          switchMap(prepared => {
            item.wasCompressed = prepared.compressed;
            item.optimizedSize = prepared.file.size;
            item.status = 'uploading';

            return this.cloudinaryService.getUploadSignature(this.galleryId).pipe(
              switchMap((signatureData: any) => {
                return this.cloudinaryService.uploadFile(prepared.file, signatureData);
              })
            );
          }),
          catchError((err: any) => {
            console.error('Pipeline error encountered:', err);
            item.status = 'error';
            item.error =
              err?.message ||
              err?.error?.message ||
              'Server error configuration or invalid signature.';
            return of(null);
          })
        )
        .subscribe({
          next: (progress: UploadProgress | null) => {
            if (!progress) return;

            item.progress = progress.progress;

            if (progress.done && !item.metadataSaved) {
              item.metadataSaved = true;
              item.status = 'done';
              item.publicId = progress.publicId;
              item.secureUrl = progress.secureUrl;

              const newAsset: Partial<MediaAsset> = {
                galleryId: this.galleryId,
                photographerId: uid,
                publicId: progress.publicId!,
                secureUrl: progress.secureUrl!,
                width: progress.width || 0,
                height: progress.height || 0,
                sectionId: this.gallery?.defaultSectionId || this.gallery?.sections?.[0]?.id || 'highlights',
                sectionTitle: this.gallery?.sections?.[0]?.title || 'Highlights'
              };

              this.mediaAssetService.saveAsset(newAsset).pipe(take(1)).subscribe({
                next: assetId => {
                  this.sessionUploadedCount += 1;
                  this.uploadedAssets = this.dedupeAssets([
                    ...this.uploadedAssets,
                    { id: assetId, ...newAsset, createdAt: new Date() } as MediaAsset
                  ]);
                  this.removeCompletedItem(item);

                  if (!this.gallery?.coverImage && progress.secureUrl) {
                    this.gallery.coverImage = progress.secureUrl;
                    this.gallery.heroImage = this.gallery.heroImage || progress.secureUrl;
                    this.galleryService.updateGallery(this.galleryId, {
                      coverImage: progress.secureUrl,
                      heroImage: this.gallery.heroImage
                    }).pipe(take(1)).subscribe({
                      error: err => console.error('Failed to update gallery cover:', err)
                    });
                  }
                },
                error: err => {
                  item.status = 'error';
                  item.error = 'Uploaded to Cloudinary, but metadata save failed.';
                  console.error('Failed to save asset metadata:', err);
                }
              });
            }
          },
          error: () => {
            item.status = 'error';
            item.error = 'Upload execution rejected.';
            resolve();
          },
          complete: () => {
            if (item.status === 'uploading' || item.status === 'optimizing') {
              item.status = 'error';
              item.error = 'Upload stopped before Cloudinary returned a file URL.';
            }
            resolve();
          }
        });
    });
  }

  private removeCompletedItem(item: UploadItem): void {
    const index = this.uploadItems.indexOf(item);
    if (index >= 0) {
      URL.revokeObjectURL(item.preview);
      this.uploadItems.splice(index, 1);
    }
  }

  trackByFileName(index: number, item: UploadItem): string {
    return `${item.file.name}-${item.file.size}-${index}`;
  }

  trackByAssetId(index: number, asset: MediaAsset): string {
    return asset.id || asset.secureUrl || `${index}`;
  }

  goToGalleries(): void {
    this.uploadItems.forEach(item => URL.revokeObjectURL(item.preview));
    this.router.navigate(['/dashboard/galleries']);
  }
}

