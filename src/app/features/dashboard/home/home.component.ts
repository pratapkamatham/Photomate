import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
 
  photographerEmail = '';
 
  stats = [
    { label: 'Total Galleries', value: '0', icon: '◫' },
    { label: 'Total Photos',    value: '0', icon: '⬡' },
    { label: 'Shared Links',    value: '0', icon: '⇗' },
    { label: 'Plan',            value: 'Free', icon: '★' },
  ];
 
  constructor(private authService: AuthService) {}
 
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.photographerEmail = user.email || '';
      }
    });
  }
 
}
 
