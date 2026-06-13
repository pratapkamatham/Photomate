import { Component,OnInit,Output,EventEmitter } from '@angular/core';
import {Router} from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import {SubscriptionService} from 'src/app/core/services/subscription.service';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent {
@Output() closed = new EventEmitter<void>();

showPopup = false;
daysRemaining = 0;

constructor(
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (!user) return;
      this.subscriptionService.getMySubscription().subscribe({
        next: (subscription) => {
          if (!subscription) return;
          const { status, daysRemaining } = this.subscriptionService.getTrialStatus(subscription);
          if (status === 'expiring_soon') {
            this.daysRemaining = daysRemaining;
            this.showPopup = true;
          }
        }
      });
    });
  
  }
  close(): void {
    this.showPopup = false;
    this.closed.emit();
  }

  upgrade(): void {
    this.close();
    this.router.navigate(['/upgrade']);
  }
}
