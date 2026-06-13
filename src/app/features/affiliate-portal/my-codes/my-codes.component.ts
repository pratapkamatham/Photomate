import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AffiliateService } from
  '../../../core/services/affiliate.service';
import { AffiliateCode } from '../../../core/models/affiliate.model';

@Component({
  selector: 'app-my-codes',
  templateUrl: './my-codes.component.html',
  styleUrls: ['./my-codes.component.css']
})
export class MyCodesComponent implements OnInit {

  codes: AffiliateCode[] = [];
  isLoading = true;
  copiedCode = '';

  constructor(
    private authService: AuthService,
    private affiliateService: AffiliateService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (!user) return;
      this.affiliateService.getMyAffiliateCode(user.uid)
        .subscribe({
          next: (codes) => {
            this.codes = codes;
            this.isLoading = false;
          },
          error: () => { this.isLoading = false; }
        });
    });
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.copiedCode = code;
    setTimeout(() => this.copiedCode = '', 2000);
  }

  copyLink(code: AffiliateCode): void {
    const link = `${window.location.origin}/register?ref=${code.code}`;
    navigator.clipboard.writeText(link);
    this.copiedCode = code.code + '_link';
    setTimeout(() => this.copiedCode = '', 2000);
  }

  shareOnWhatsApp(code: AffiliateCode): void {
    const baseUrl = window.location.origin;
    let message = '';

    if (code.type === 'referral') {
      message = encodeURIComponent(
        `Hi! Join PhotoMate — premium portfolio platform ` +
        `for photographers.\n\n` +
        `Register: ${baseUrl}/register?ref=${code.code}`
      );
    } else {
      message = encodeURIComponent(
        `Hi! Join PhotoMate and get ` +
        `*${code.discountPercent}% OFF* ` +
        `with my exclusive code: *${code.code}*\n\n` +
        `Register: ${baseUrl}/register\n` +
        `Apply code: *${code.code}*`
      );
    }

    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

}
