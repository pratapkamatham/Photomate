import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Photomate';
  showGlobalFooter = true;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateFooterVisibility(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateFooterVisibility(event.urlAfterRedirects || event.url);
      });
  }

  private updateFooterVisibility(url: string): void {
    this.showGlobalFooter =
      !url.startsWith('/dashboard') &&
      !this.isPublicPortfolioRoute(url);
  }

  private isPublicPortfolioRoute(url: string): boolean {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const firstSegment = cleanUrl.split('/').filter(Boolean)[0] || '';
    const fixedRoutes = ['auth', 'admin', 'affiliate-portal', 'upgrade', 'expired'];
    return !!firstSegment && !fixedRoutes.includes(firstSegment);
  }
}
