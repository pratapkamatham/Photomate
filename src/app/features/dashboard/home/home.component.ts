import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { GalleryService } from 'src/app/core/services/gallery.service';
import { MediaAssetService } from 'src/app/core/services/media-asset.service';
import { PhotographerService } from 'src/app/core/services/photographer.service';

interface DashboardStat {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  photographerEmail = '';
  photographerSlug = '';
  isLoading = true;
  errorMessage = '';

  totalGalleries = 0;
  totalPhotos = 0;
  sharedLinks = 0;
  plan = 'Free';
  cloudinaryConnected = false;
  brandingConfigured = false;

  stats: DashboardStat[] = this.buildStats();

  constructor(
    private authService: AuthService,
    private galleryService: GalleryService,
    private mediaAssetService: MediaAssetService,
    private photographerService: PhotographerService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.currentUser$
      .pipe(take(1))
      .subscribe({
        next: user => {
          if (!user) {
            this.isLoading = false;
            this.errorMessage = 'Please login again to load dashboard stats.';
            return;
          }

          this.photographerEmail = user.email || '';

          forkJoin({
            profile: this.photographerService.getMyProfile().pipe(catchError(() => of(null))),
            galleries: this.galleryService.getMyGalleries().pipe(catchError(err => {
              console.error('Dashboard Total Galleries query failed:', err);
              return of([]);
            })),
            assets: this.mediaAssetService.getPhotographerAssets(user.uid).pipe(catchError(err => {
              console.error('Dashboard media query failed:', err);
              return of([]);
            }))
          }).subscribe({
            next: ({ profile, galleries, assets }) => {
              this.photographerSlug = profile?.slug || '';
              this.totalGalleries = galleries.length;
              this.totalPhotos = assets.length;
              this.sharedLinks = galleries.length;
              this.plan = this.formatPlan(profile?.subscriptionPlan);
              this.cloudinaryConnected = !!profile?.cloudinary?.cloudName;
              this.brandingConfigured = !!profile?.theme || !!profile?.studioName;
              this.stats = this.buildStats();
              this.isLoading = false;
            },
            error: err => {
              console.error('Dashboard load failed:', err);
              this.isLoading = false;
              this.errorMessage = 'Could not load dashboard stats.';
            }
          });
        },
        error: err => {
          console.error('Dashboard auth load failed:', err);
          this.isLoading = false;
          this.errorMessage = 'Could not verify your session.';
        }
      });
  }

  portfolioUrl(): string {
    return this.photographerSlug ? `${window.location.origin}/${this.photographerSlug}` : '';
  }

  openPortfolio(): void {
    const url = this.portfolioUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }

  async copyPortfolioLink(): Promise<void> {
    const url = this.portfolioUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
  }

  private buildStats(): DashboardStat[] {
    return [
      { label: 'Total Galleries', value: this.totalGalleries.toString(), icon: 'P' },
      { label: 'Total Photos', value: this.totalPhotos.toString(), icon: 'I' },
      { label: 'Shared Links', value: this.sharedLinks.toString(), icon: 'S' },
      { label: 'Plan', value: this.plan, icon: '*' }
    ];
  }

  private formatPlan(plan?: string): string {
    if (!plan || plan === 'none') return 'Free';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  }
}

