import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PhotographerService } from '../../../core/services/photographer.service';
import { GalleryService } from '../../../core/services/gallery.service';
import { MediaAssetService } from '../../../core/services/media-asset.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LeadService } from '../../../core/services/lead.service';
import { Photographer } from '../../../core/models/photographer.model';
import { Gallery, GallerySection } from '../../../core/models/gallery.model';
import { MediaAsset } from '../../../core/models/media-asset.model';

interface GallerySectionView extends GallerySection {
  assets: MediaAsset[];
}

@Component({
  selector: 'app-gallery-view',
  templateUrl: './gallery-view.component.html',
  styleUrls: ['./gallery-view.component.css']
})
export class GalleryViewComponent implements OnInit, OnDestroy {

  photographer: Photographer | null = null;
  gallery: Gallery | null = null;
  assets: MediaAsset[] = [];
  sectionViews: GallerySectionView[] = [];
  leadForm: FormGroup;
  isLoading = true;
  isSubmittingLead = false;
  leadSuccess = false;
  leadError = '';
  notFound = false;
  heroSlides: string[] = [];
  activeHeroIndex = 0;
  private heroTimer: any = null;

  lightboxOpen = false;
  lightboxIndex = 0;

  photographerSlug = '';
  gallerySlug = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private photographerService: PhotographerService,
    private galleryService: GalleryService,
    private mediaAssetService: MediaAssetService,
    private themeService: ThemeService,
    private leadService: LeadService,
    private title: Title
  ) {
    this.leadForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      email: ['', [Validators.email]],
      message: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.photographerSlug = params.get('photographerSlug') || '';
      this.gallerySlug = params.get('gallerySlug') || '';
      this.loadGallery();
    });
  }

  loadGallery(): void {
    this.isLoading = true;
    this.notFound = false;

    this.photographerService.getBySlug(this.photographerSlug)
      .subscribe({
        next: (photographer) => {
          if (!photographer || photographer.isActive === false) {
            this.notFound = true;
            this.isLoading = false;
            return;
          }

          this.photographer = photographer;

          if (photographer.theme) {
            this.themeService.applyTheme(photographer.theme);
          }

          this.galleryService.getGalleryBySlug(
            photographer.id!,
            this.gallerySlug
          ).subscribe({
            next: (gallery) => {
              if (!gallery || gallery.isPrivate === true) {
                this.notFound = true;
                this.isLoading = false;
                return;
              }

              this.gallery = gallery;
              this.title.setTitle(`${gallery.title} | ${photographer.studioName}`);
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
        this.assets = assets;
        this.sectionViews = this.buildSectionViews(assets);
        this.setupHeroSlides();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  buildSectionViews(assets: MediaAsset[]): GallerySectionView[] {
    const fallbackSections: GallerySection[] = [{
      id: this.gallery?.defaultSectionId || 'highlights',
      title: 'Highlights',
      description: 'Best moments from this event',
      sortOrder: 0
    }];

    const sections = (this.gallery?.sections?.length ? this.gallery.sections : fallbackSections)
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const views = sections.map(section => ({
      ...section,
      assets: assets.filter(asset => (asset.sectionId || 'highlights') === section.id)
    }));

    const knownIds = new Set(sections.map(section => section.id));
    const uncategorized = assets.filter(asset => !knownIds.has(asset.sectionId || 'highlights'));
    if (uncategorized.length) {
      views.push({
        id: 'other',
        title: 'More Moments',
        sortOrder: 999,
        assets: uncategorized
      });
    }

    return views.filter(view => view.assets.length > 0 || assets.length === 0);
  }

  submitLead(): void {
    if (!this.photographer || !this.gallery) return;
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }

    this.isSubmittingLead = true;
    this.leadSuccess = false;
    this.leadError = '';

    this.leadService.createLead({
      photographerId: this.photographer.id!,
      photographerSlug: this.photographerSlug,
      galleryId: this.gallery.id,
      gallerySlug: this.gallerySlug,
      source: 'gallery',
      name: this.leadForm.value.name?.trim(),
      phone: this.leadForm.value.phone?.trim(),
      email: this.leadForm.value.email?.trim(),
      message: this.leadForm.value.message?.trim()
    }).subscribe({
      next: () => {
        this.isSubmittingLead = false;
        this.leadSuccess = true;
        this.leadForm.reset();
      },
      error: (err) => {
        console.error('Gallery lead capture failed:', err);
        this.isSubmittingLead = false;
        this.leadError = 'Could not send your inquiry. Please contact the studio directly.';
      }
    });
  }

  setupHeroSlides(): void {
    const selectedHeroImages = this.gallery?.heroImages?.length
      ? this.gallery.heroImages
      : [];

    const fallbackImages = [
      this.gallery?.heroImage,
      this.gallery?.coverImage,
      ...this.assets.map(asset => asset.secureUrl)
    ];

    const urls = [
      ...selectedHeroImages,
      ...fallbackImages
    ].filter((url): url is string => !!url);

    const seen = new Set<string>();
    this.heroSlides = urls
      .filter(url => {
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      })
      .slice(0, 5)
      .map(url => this.buildHeroImageUrl(url));

    this.activeHeroIndex = 0;
    this.startHeroRotation();
  }

  startHeroRotation(): void {
    this.stopHeroRotation();
    if (this.heroSlides.length <= 1) return;

    this.heroTimer = setInterval(() => {
      this.activeHeroIndex = (this.activeHeroIndex + 1) % this.heroSlides.length;
    }, 4500);
  }

  stopHeroRotation(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }

  setActiveHero(index: number): void {
    this.activeHeroIndex = index;
    this.startHeroRotation();
  }

  buildHeroImageUrl(url: string): string {
    if (!url) return '';
    return url.includes('cloudinary.com')
      ? url.replace('/upload/', '/upload/f_auto,q_auto,w_1800/')
      : url;
  }

  get activeHeroUrl(): string {
    return this.heroSlides[this.activeHeroIndex] || this.buildHeroUrl();
  }
  buildImageUrl(asset: MediaAsset, width = 600): string {
    if (!asset.secureUrl) return '';
    return asset.secureUrl.replace(
      '/upload/',
      `/upload/f_auto,q_auto,w_${width},dpr_auto/`
    );
  }

  buildHeroUrl(): string {
    const url = this.gallery?.heroImage || this.gallery?.coverImage || this.assets[0]?.secureUrl || '';
    return url ? this.buildHeroImageUrl(url) : '';
  }

  buildFullUrl(asset: MediaAsset): string {
    if (!asset.secureUrl) return '';
    return asset.secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }

  openLightbox(asset: MediaAsset): void {
    const index = this.assets.findIndex(item => item.id === asset.id || item.secureUrl === asset.secureUrl);
    this.lightboxIndex = Math.max(index, 0);
    this.lightboxOpen = true;
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

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    switch (event.key) {
      case 'ArrowRight': this.nextImage(); break;
      case 'ArrowLeft': this.prevImage(); break;
      case 'Escape': this.closeLightbox(); break;
    }
  }

  get currentAsset(): MediaAsset {
    return this.assets[this.lightboxIndex];
  }

  get leadCaptureEnabled(): boolean {
    return this.gallery?.shareSettings?.leadCaptureEnabled !== false;
  }

  get allowDownloads(): boolean {
    return this.gallery?.shareSettings?.allowDownloads === true;
  }

  goBack(): void {
    this.router.navigate([`/${this.photographerSlug}`]);
  }

  ngOnDestroy(): void {
    this.stopHeroRotation();
    this.themeService.resetToDefault();
    document.body.style.overflow = '';
    this.title.setTitle('PhotoMate');
  }
}




