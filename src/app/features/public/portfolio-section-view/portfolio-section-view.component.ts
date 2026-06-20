import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Photographer } from 'src/app/core/models/photographer.model';
import { PortfolioAsset, PortfolioSection } from 'src/app/core/models/portfolio-section.model';
import { PhotographerService } from 'src/app/core/services/photographer.service';
import { PortfolioSectionService } from 'src/app/core/services/portfolio-section.service';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-portfolio-section-view',
  templateUrl: './portfolio-section-view.component.html',
  styleUrls: ['./portfolio-section-view.component.css']
})
export class PortfolioSectionViewComponent implements OnInit {
  photographer: Photographer | null = null;
  section: PortfolioSection | null = null;
  assets: PortfolioAsset[] = [];
  photographerSlug = '';
  sectionSlug = '';
  isLoading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photographerService: PhotographerService,
    private sectionService: PortfolioSectionService,
    private themeService: ThemeService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.photographerSlug = this.route.snapshot.paramMap.get('photographerSlug') || '';
    this.sectionSlug = this.route.snapshot.paramMap.get('sectionSlug') || '';
    this.load();
  }

  load(): void {
    this.photographerService.getBySlug(this.photographerSlug).subscribe({
      next: photographer => {
        if (!photographer || photographer.isActive === false) {
          this.notFound = true;
          this.isLoading = false;
          return;
        }
        this.photographer = photographer;
        if (photographer.theme) this.themeService.applyTheme(photographer.theme);

        this.sectionService.getSectionBySlug(photographer.id!, this.sectionSlug).subscribe({
          next: section => {
            if (!section) {
              this.notFound = true;
              this.isLoading = false;
              return;
            }
            this.section = section;
            this.title.setTitle(`${section.title} | ${photographer.studioName}`);
            this.sectionService.getSectionAssets(section.id!).subscribe({
              next: assets => {
                this.assets = assets;
                this.isLoading = false;
              },
              error: () => this.isLoading = false
            });
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

  backToPortfolio(): void {
    this.router.navigate([`/${this.photographerSlug}`]);
  }

  buildImage(asset: PortfolioAsset): string {
    return asset.secureUrl.includes('cloudinary.com')
      ? asset.secureUrl.replace('/upload/', '/upload/f_auto,q_auto,w_1400/')
      : asset.secureUrl;
  }
}
