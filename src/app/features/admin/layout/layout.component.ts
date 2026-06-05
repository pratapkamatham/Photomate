import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class AdminLayoutComponent implements OnInit{
  isSidebarOpen =true;
  adminEmail='';

  navItems=[
       { label: 'Overview',       icon: '⊞', route: '/admin' },
    { label: 'Photographers',  icon: '◫', route: '/admin/photographers' },
    { label: 'Subscriptions',  icon: '★', route: '/admin/subscriptions' },
  ];
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user=>{
      if(user)
        this.adminEmail=user.email ||'';
    });
  }
toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
 
  logout(): void {
    this.authService.logout().subscribe();
  }
}
