import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  isSidebarOpen = true;
  adminEmail = '';

  navItems = [
    { label: 'Overview', icon: 'O', route: '/admin' },
    { label: 'Photographers', icon: 'P', route: '/admin/photographers' },
    { label: 'Subscriptions', icon: 'S', route: '/admin/subscriptions' },
    { label: 'Activate', icon: 'A', route: '/admin/activate' },
    { label: 'Settings', icon: 'G', route: '/admin/settings' },
    { label: 'Affiliates', icon: 'F', route: '/admin/affiliates' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.adminEmail = user?.email || '';
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
