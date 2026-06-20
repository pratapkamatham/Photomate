import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { CloudinaryService, UploadProgress } from 'src/app/core/services/cloudinary.service';
import { PhotographerService } from 'src/app/core/services/photographer.service';
import { PortfolioAsset, PortfolioSection } from 'src/app/core/models/portfolio-section.model';
import { PortfolioSectionService } from 'src/app/core/services/portfolio-section.service';

interface UploadItem {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'optimizing' | 'uploading' | 'done' | 'error';
  error?: string;
  optimizedSize?: number;
  wasCompressed?: boolean;
  metadataSaved?: boolean;
}

@Component({
  selector: 'app-portfolio-section-upload',
  templateUrl: './portfolio-section-upload.component.html',
  styleUrls: ['./portfolio-section-upload.component.css']
})
export class PortfolioSectionUploadComponent implements OnInit {
  sectionId = '';
  section: PortfolioSection | null = null;
  photographerSlug = '';
  isLoading = true;
  isUploading = false;
  uploadItems: UploadItem[] = [];
  assets: PortfolioAsset[] = [];
  uploadError = '';
  copyMessage = '';

  private readonly maxParallelUploads = 2;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cloudinaryService: CloudinaryService,
    private photographerService: PhotographerService,
    private sectionService: PortfolioSectionService
  ) {}

  ngOnInit(): void {
    this.sectionId = this.route.snapshot.paramMap.get('id') || '';
    this.photographerService.getMyProfile().pipe(take(1)).subscribe(profile => this.photographerSlug = profile?.slug || '');
    this.loadSection();
    this.loadAssets();
  }

  loadSection(): void {
    this.sectionService.getSectionById(this.sectionId).pipe(take(1)).subscribe({
      next: section => {
        this.section = section;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadAssets(): void {
    this.sectionService.getSectionAssets(this.sectionId).pipe(take(1)).subscribe({
      next: assets => this.assets = this.dedupeAssets(assets),
      error: err => console.error('Portfolio assets failed:', err)
    });
  }

  sectionUrl(): string {
    if (!this.photographerSlug || !this.section?.slug) return '';
    return `${window.location.origin}/${this.photographerSlug}/portfolio/${this.section.slug}`;
  }

  openSection(): void {
    const url = this.sectionUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }

  async copySectionUrl(): Promise<void> {
    const url = this.sectionUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    this.copyMessage = 'Portfolio section link copied.';
    setTimeout(() => this.copyMessage = '', 2500);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
      input.value = '';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) this.handleFiles(event.dataTransfer.files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  handleFiles(files: FileList): void {
    this.uploadError = '';
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

  uploadAll(): void {
    const pending = this.uploadItems.filter(item => item.status === 'pending');
    if (!pending.length || this.isUploading) return;

    this.isUploading = true;
    this.authService.currentUser$.pipe(take(1)).subscribe({
      next: async user => {
        if (!user) {
          this.uploadError = 'Login again to upload.';
          this.isUploading = false;
          return;
        }
        await this.uploadQueue(pending, user.uid);
        this.isUploading = false;
        this.loadAssets();
      },
      error: () => {
        this.uploadError = 'Could not verify your session.';
        this.isUploading = false;
      }
    });
  }

  private async uploadQueue(items: UploadItem[], uid: string): Promise<void> {
    for (let i = 0; i < items.length; i += this.maxParallelUploads) {
      await Promise.all(items.slice(i, i + this.maxParallelUploads).map(item => this.uploadSingle(item, uid)));
    }
  }

  private uploadSingle(item: UploadItem, uid: string): Promise<void> {
    const validation = this.cloudinaryService.validateFile(item.file);
    if (!validation.valid) {
      item.status = 'error';
      item.error = validation.error || 'Invalid file.';
      return Promise.resolve();
    }

    item.status = 'optimizing';
    item.progress = 0;

    return new Promise(resolve => {
      of(null).pipe(
        switchMap(() => this.cloudinaryService.prepareFileForUpload(item.file)),
        switchMap(prepared => {
          item.wasCompressed = prepared.compressed;
          item.optimizedSize = prepared.file.size;
          item.status = 'uploading';
          return this.cloudinaryService.getUploadSignature(`portfolio-${this.sectionId}`).pipe(
            switchMap(signature => this.cloudinaryService.uploadFile(prepared.file, signature))
          );
        }),
        catchError(err => {
          item.status = 'error';
          item.error = err?.message || 'Upload failed.';
          return of(null);
        })
      ).subscribe({
        next: (progress: UploadProgress | null) => {
          if (!progress) return;
          item.progress = progress.progress;

          if (progress.done && !item.metadataSaved) {
            item.metadataSaved = true;
            item.status = 'done';
            const asset: Partial<PortfolioAsset> = {
              sectionId: this.sectionId,
              photographerId: uid,
              publicId: progress.publicId!,
              secureUrl: progress.secureUrl!,
              width: progress.width || 0,
              height: progress.height || 0
            };
            this.sectionService.saveAsset(asset).pipe(take(1)).subscribe({
              next: id => {
                this.assets = this.dedupeAssets([...this.assets, { id, ...asset, createdAt: new Date() } as PortfolioAsset]);
                this.removeCompleted(item);
                if (!this.section?.coverImage && progress.secureUrl) {
                  this.section = { ...this.section!, coverImage: progress.secureUrl, heroImage: progress.secureUrl, heroImages: [progress.secureUrl] };
                  this.sectionService.updateSection(this.sectionId, {
                    coverImage: progress.secureUrl,
                    heroImage: progress.secureUrl,
                    heroImages: [progress.secureUrl]
                  }).pipe(take(1)).subscribe();
                }
              },
              error: err => {
                item.status = 'error';
                item.error = 'Uploaded, but metadata save failed.';
                console.error(err);
              }
            });
          }
        },
        complete: () => resolve(),
        error: () => resolve()
      });
    });
  }

  setCover(asset: PortfolioAsset, event: Event): void {
    event.stopPropagation();
    const heroImages = this.heroImagesForSection(asset.secureUrl);

    this.sectionService.updateSection(this.sectionId, {
      coverImage: asset.secureUrl,
      heroImage: asset.secureUrl,
      heroImages
    }).pipe(take(1)).subscribe({
      next: () => {
        this.section = { ...this.section!, coverImage: asset.secureUrl, heroImage: asset.secureUrl, heroImages };
        this.copyMessage = 'Section cover updated.';
        setTimeout(() => this.copyMessage = '', 2500);
      }
    });
  }

  toggleHeroImage(asset: PortfolioAsset, event: Event): void {
    event.stopPropagation();
    if (!this.section) return;

    const current = this.heroImagesForSection();
    const exists = current.includes(asset.secureUrl);
    const heroImages = exists
      ? current.filter(url => url !== asset.secureUrl)
      : [...current, asset.secureUrl];
    const fallback = heroImages[0] || this.section.coverImage || asset.secureUrl;

    this.sectionService.updateSection(this.sectionId, {
      heroImages,
      heroImage: fallback,
      coverImage: this.section.coverImage || fallback
    }).pipe(take(1)).subscribe({
      next: () => {
        this.section = {
          ...this.section!,
          heroImages,
          heroImage: fallback,
          coverImage: this.section!.coverImage || fallback
        };
        this.copyMessage = exists ? 'Removed from portfolio hero.' : 'Added to portfolio hero.';
        setTimeout(() => this.copyMessage = '', 2500);
      }
    });
  }

  isHeroImage(asset: PortfolioAsset): boolean {
    return this.heroImagesForSection().includes(asset.secureUrl);
  }

  heroImagesForSection(requiredUrl?: string): string[] {
    const images = [
      ...(this.section?.heroImages || []),
      this.section?.heroImage,
      requiredUrl
    ].filter((url): url is string => !!url);

    return Array.from(new Set(images));
  }

  buildThumb(asset: PortfolioAsset, width = 500): string {
    return asset.secureUrl.includes('cloudinary.com')
      ? asset.secureUrl.replace('/upload/', `/upload/f_auto,q_auto,c_fill,w_${width},h_${width}/`)
      : asset.secureUrl;
  }

  removeItem(index: number): void {
    const item = this.uploadItems[index];
    if (item && (item.status === 'pending' || item.status === 'error')) {
      URL.revokeObjectURL(item.preview);
      this.uploadItems.splice(index, 1);
    }
  }

  goBack(): void {
    this.uploadItems.forEach(item => URL.revokeObjectURL(item.preview));
    this.router.navigate(['/dashboard/portfolio-sections']);
  }

  private removeCompleted(item: UploadItem): void {
    const index = this.uploadItems.indexOf(item);
    if (index >= 0) {
      URL.revokeObjectURL(item.preview);
      this.uploadItems.splice(index, 1);
    }
  }

  private dedupeAssets(assets: PortfolioAsset[]): PortfolioAsset[] {
    const seen = new Set<string>();
    return assets.filter(asset => {
      const key = asset.publicId || asset.secureUrl || asset.id || '';
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

