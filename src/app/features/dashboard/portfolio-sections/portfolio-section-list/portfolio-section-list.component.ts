import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortfolioSection } from 'src/app/core/models/portfolio-section.model';
import { PhotographerService } from 'src/app/core/services/photographer.service';
import { PortfolioSectionService } from 'src/app/core/services/portfolio-section.service';

@Component({
  selector: 'app-portfolio-section-list',
  templateUrl: './portfolio-section-list.component.html',
  styleUrls: ['./portfolio-section-list.component.css']
})
export class PortfolioSectionListComponent implements OnInit {
  sections: PortfolioSection[] = [];
  photographerSlug = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private sectionService: PortfolioSectionService,
    private photographerService: PhotographerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.photographerService.getMyProfile().subscribe(profile => {
      this.photographerSlug = profile?.slug || '';
    });
    this.loadSections();
  }

  loadSections(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.sectionService.getMySections().subscribe({
      next: sections => {
        this.sections = sections;
        this.isLoading = false;
      },
      error: err => {
        console.error('Portfolio sections failed:', err);
        this.errorMessage = 'Could not load portfolio sections.';
        this.isLoading = false;
      }
    });
  }

  createSection(): void {
    this.router.navigate(['/dashboard/portfolio-sections/create']);
  }

  upload(section: PortfolioSection): void {
    this.router.navigate([`/dashboard/portfolio-sections/${section.id}/upload`]);
  }

  portfolioUrl(): string {
    return this.photographerSlug ? `${window.location.origin}/${this.photographerSlug}` : '';
  }

  sectionUrl(section: PortfolioSection): string {
    if (!this.photographerSlug) return '';
    return `${window.location.origin}/${this.photographerSlug}/portfolio/${section.slug}`;
  }

  openPortfolio(event: Event): void {
    event.stopPropagation();
    const url = this.portfolioUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }

  openSection(section: PortfolioSection, event: Event): void {
    event.stopPropagation();
    const url = this.sectionUrl(section);
    if (url) window.open(url, '_blank', 'noopener');
  }

  async copySection(section: PortfolioSection, event: Event): Promise<void> {
    event.stopPropagation();
    const url = this.sectionUrl(section);
    if (url) await navigator.clipboard.writeText(url);
  }

  delete(section: PortfolioSection, event: Event): void {
    event.stopPropagation();
    if (!section.id || !confirm(`Delete portfolio section "${section.title}"?`)) return;
    this.sectionService.deleteSection(section.id).subscribe({
      next: () => this.sections = this.sections.filter(item => item.id !== section.id),
      error: () => alert('Could not delete portfolio section.')
    });
  }
}
