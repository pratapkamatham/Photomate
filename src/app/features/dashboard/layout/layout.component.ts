import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class DashboardLayoutComponent implements OnInit{
  
  isSidebarOpen =true;
  photographerEmail='';

  navItems=[    
    { label: 'Overview',         icon: '⊞', route: '/dashboard' },
    { label: 'Galleries',        icon: '◫', route: '/dashboard/galleries' },
    { label: 'Cloudinary',       icon: '☁', route: '/dashboard/cloudinary' },
    { label: 'Branding',         icon: '◈', route: '/dashboard/branding' },
    { label: 'Settings',         icon: '⚙', route: '/dashboard/settings' },
  ]
  
  constructor(
    private authService:AuthService,
    private router:Router
  ){}
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user=>{
      if(user){
        this.photographerEmail=user.email || '';
      }
    });
  }
toggleSidebar():void{
  this.isSidebarOpen= !this.isSidebarOpen;
}
logOut():void{
  this.authService.logout().subscribe();
}
}
