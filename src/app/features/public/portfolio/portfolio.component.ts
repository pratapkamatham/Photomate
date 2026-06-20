import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { PhotographerService } from '../../../core/services/photographer.service';
import { PortfolioSectionService } from '../../../core/services/portfolio-section.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LeadService } from '../../../core/services/lead.service';
import { Photographer } from '../../../core/models/photographer.model';
import { PortfolioAsset, PortfolioSection } from '../../../core/models/portfolio-section.model';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit, OnDestroy {
  photographer: Photographer | null = null;
  galleries: PortfolioSection[] = [];
  portfolioAssets: PortfolioAsset[] = [];
  leadForm: FormGroup;
  isLoading = true;
  isSubmittingLead = false;
  leadSuccess = false;
  leadError = '';
  notFound = false;
  slug = '';
  activeHeroIndex = 0;
  private heroTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private photographerService: PhotographerService,
    private portfolioSectionService: PortfolioSectionService,
    private themeService: ThemeService,
    private leadService: LeadService,
    private title: Title,
    private meta: Meta
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
      this.slug = params.get('photographerSlug') || '';
      this.loadPortfolio();
    });
  }

  loadPortfolio(): void {
    this.isLoading = true;
    this.notFound = false;

    this.photographerService.getBySlug(this.slug).subscribe({
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

        this.title.setTitle(`${photographer.studioName} | Portfolio`);
        this.meta.updateTag({
          name: 'description',
          content: photographer.bio || `${photographer.studioName} public portfolio and client albums`
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
    this.portfolioSectionService.getPublicSections(photographerId).subscribe({
      next: (sections) => {
        this.galleries = sections;
        const assetRequests = sections
          .filter(section => !!section.id)
          .map(section => this.portfolioSectionService.getSectionAssets(section.id!));

        if (!assetRequests.length) {
          this.portfolioAssets = [];
          this.activeHeroIndex = 0;
          this.startHeroSlideshow();
          this.isLoading = false;
          return;
        }

        forkJoin(assetRequests).subscribe({
          next: (assetGroups) => {
            this.portfolioAssets = assetGroups.flat();
            this.activeHeroIndex = 0;
            this.startHeroSlideshow();
            this.isLoading = false;
          },
          error: (assetErr) => {
            console.error('Portfolio hero assets failed:', assetErr);
            this.portfolioAssets = [];
            this.activeHeroIndex = 0;
            this.startHeroSlideshow();
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Portfolio sections failed:', err);
        this.galleries = [];
        this.portfolioAssets = [];
        this.isLoading = false;
      }
    });
  }

  goToGallery(gallery: PortfolioSection): void {
    this.router.navigate([`/${this.slug}/portfolio/${gallery.slug}`]);
  }

  scrollToSection(sectionId: string, event?: Event): void {
    event?.preventDefault();
    const target = document.getElementById(sectionId);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submitLead(): void {
    if (!this.photographer) return;
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }

    this.isSubmittingLead = true;
    this.leadSuccess = false;
    this.leadError = '';

    this.leadService.createLead({
      photographerId: this.photographer.id!,
      photographerSlug: this.slug,
      source: 'portfolio',
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
        console.error('Lead capture failed:', err);
        this.isSubmittingLead = false;
        this.leadError = 'Could not send your inquiry. Please call or email the studio directly.';
      }
    });
  }

  get studioInitials(): string {
    const name = this.photographer?.studioName || 'PhotoMate';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  get heroImages(): string[] {
    const selectedHeroImages = this.galleries.flatMap(section => [
      ...(section.heroImages || []),
      section.heroImage,
      section.coverImage
    ]);

    const uploadedSectionImages = this.portfolioAssets.map(asset => asset.secureUrl);

    const images = [
      ...selectedHeroImages,
      ...uploadedSectionImages,
      this.photographer?.coverImageUrl
    ].filter((url): url is string => !!url);

    return Array.from(new Set(images));
  }

  get heroImage(): string {
    return this.heroImages[this.activeHeroIndex] ||
      this.firstGalleryImage ||
      '';
  }

  get firstGalleryImage(): string {
    const gallery = this.galleries.find(item => this.galleryImage(item));
    return gallery ? this.galleryImage(gallery) : '';
  }

  get portfolioStats(): string {
    const count = this.galleries.length;
    return `${count} ${count === 1 ? 'section' : 'sections'}`;
  }

  galleryImage(gallery: PortfolioSection): string {
    return gallery.coverImage || gallery.heroImage || '';
  }


  buildThumbnail(coverImage: string): string {
    if (!coverImage) return '';
    if (coverImage.includes('cloudinary.com')) {
      return coverImage.replace('/upload/', '/upload/f_auto,q_auto,c_fill,w_900,h_650/');
    }
    return coverImage;
  }

  setActiveHero(index: number): void {
    this.activeHeroIndex = index;
    this.startHeroSlideshow();
  }

  private startHeroSlideshow(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }

    if (this.heroImages.length <= 1) {
      return;
    }

    this.heroTimer = setInterval(() => {
      this.activeHeroIndex = (this.activeHeroIndex + 1) % this.heroImages.length;
    }, 3000);
  }

  buildHeroImage(url: string): string {
    if (!url) return '';
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', '/upload/f_auto,q_auto,c_fill,w_2200,h_1200,g_auto/');
    }
    return url;
  }

  ngOnDestroy(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
    }
    this.themeService.resetToDefault();
    this.title.setTitle('PhotoMate');
  }
}


















