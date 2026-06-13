import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AffiliateService } from '../../../core/services/affiliate.service';
import { Affiliate, AffiliateCode, Sale }
  from '../../../core/models/affiliate.model';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {

  affiliate: Affiliate | null = null;
  codes: AffiliateCode[] = [];
  recentSales: Sale[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private affiliateService: AffiliateService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (!user) return;

      this.affiliateService.getAffiliateByUid(user.uid)
        .subscribe(affiliate => {
          this.affiliate = affiliate;

          if (affiliate?.id) {
            this.affiliateService.getMyAffiliateCode(user.uid)
              .subscribe(codes => {
                this.codes = codes;
                this.isLoading = false;
              });

            this.affiliateService
              .getSalesByAffiliate(affiliate.id)
              .subscribe(sales => {
                this.recentSales = sales.slice(0, 5);
              });
          } else {
            this.isLoading = false;
          }
        });
    });
  }

  get targetProgress(): number {
    if (!this.affiliate) return 0;
    return Math.min(
      (this.affiliate.currentCount / this.affiliate.targetCount) * 100,
      100
    );
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    alert(`Code ${code} copied!`);
  }

  shareOnWhatsApp(code: AffiliateCode): void {
    const baseUrl = window.location.origin;
    let message = '';

    if (code.type === 'referral') {
      message = encodeURIComponent(
        `Hi! I'd like to introduce you to PhotoMate — ` +
        `a premium portfolio platform for photographers.\n\n` +
        `Register here: ${baseUrl}/register?ref=${code.code}\n\n` +
        `PhotoMate helps you showcase your work professionally ` +
        `and share client galleries easily.`
      );
    } else {
      message = encodeURIComponent(
        `Hi! I'd like to introduce you to PhotoMate — ` +
        `a premium portfolio platform for photographers.\n\n` +
        `Use my exclusive coupon code *${code.code}* ` +
        `to get *${code.discountPercent}% OFF* your subscription!\n\n` +
        `Register here: ${baseUrl}/register\n` +
        `Apply code at checkout: *${code.code}*`
      );
    }

    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  getReferralLink(code: AffiliateCode): string {
    return `${window.location.origin}/register?ref=${code.code}`;
  }

}
