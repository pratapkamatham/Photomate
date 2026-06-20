import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {

  isSidebarOpen = true;
  photographerEmail = '';

  navItems = [
    { label: 'Overview', icon: 'O', route: '/dashboard' },
    { label: 'Galleries', icon: 'G', route: '/dashboard/galleries' },
    { label: 'Portfolio Sections', icon: 'P', route: '/dashboard/portfolio-sections' },
    { label: 'Cloudinary', icon: 'C', route: '/dashboard/cloudinary' },
    { label: 'Branding', icon: 'B', route: '/dashboard/branding' },
    { label: 'Leads', icon: 'L', route: '/dashboard/leads' },
    { label: 'Settings', icon: 'S', route: '/dashboard/settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.photographerEmail = user.email || '';
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logOut(): void {
    this.authService.logout().subscribe();
  }
}

