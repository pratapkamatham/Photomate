import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AffiliateService } from '../../../core/services/affiliate.service';
import { Affiliate } from '../../../core/models/affiliate.model';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {

  isSidebarOpen = true;
  affiliate: Affiliate | null = null;

  navItems = [
    { label: 'Overview',  icon: '⊞', route: '/affiliate-portal' },
    { label: 'My Codes',  icon: '◈', route: '/affiliate-portal/codes' },
    { label: 'My Sales',  icon: '★', route: '/affiliate-portal/sales' },
  ];

  constructor(
    private authService: AuthService,
    private affiliateService: AffiliateService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.affiliateService.getAffiliateByUid(user.uid)
          .subscribe(affiliate => {
            this.affiliate = affiliate;
          });
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

}
