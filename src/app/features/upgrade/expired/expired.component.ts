import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';
import { PlatformSettings } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-expired',
  templateUrl: './expired.component.html',
  styleUrls: ['./expired.component.css']
})
export class ExpiredComponent implements OnInit {

  settings: PlatformSettings | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptionService.getPlatformSettings().subscribe({
      next: (settings) => { this.settings = settings; }
    });
  }

  goToUpgrade(): void {
    this.router.navigate(['/upgrade']);
  }

  openWhatsApp(): void {
    if (!this.settings?.whatsappNumber) return;
    const msg = encodeURIComponent('Hi, my PhotoMate trial has expired. I would like to upgrade.');
    window.open(`https://wa.me/${this.settings.whatsappNumber}?text=${msg}`, '_blank');
  }

  openEmail(): void {
    if (!this.settings?.contactEmail) return;
    window.open(`mailto:${this.settings.contactEmail}?subject=PhotoMate Trial Expired - Upgrade Request`, '_blank');
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}