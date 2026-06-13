import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AffiliateService } from '../../../core/services/affiliate.service';
import { PlatformSettings } from '../../../core/models/subscription.model';
import { CouponValidation } from '../../../core/models/affiliate.model';

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit {

  settings: PlatformSettings | null = null;
  isLoading      = true;
  selectedPlan   = '';
  selectedAmount = 0;
  referralCode   = '';

  couponCode       = '';
  couponValidation: CouponValidation | null = null;
  isValidating     = false;

  constructor(
    private subscriptionService: SubscriptionService,
    private affiliateService: AffiliateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['ref']) this.referralCode = params['ref'];
    });

    this.subscriptionService.getPlatformSettings().subscribe({
      next: (settings) => {
        this.settings  = settings;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  selectPlan(plan: string, amount: number): void {
    this.selectedPlan    = plan;
    this.selectedAmount  = amount;
    this.couponValidation = null;
    this.couponCode      = '';
  }

  validateCoupon(): void {
    if (!this.couponCode.trim()) return;
    if (!this.selectedAmount) {
      alert('Please select a plan first.');
      return;
    }

    this.isValidating = true;
    this.affiliateService.validateCoupon(
      this.couponCode,
      this.selectedAmount
    ).subscribe({
      next: (result) => {
        this.couponValidation = result;
        this.isValidating     = false;
      },
      error: () => { this.isValidating = false; }
    });
  }

  getFinalAmount(): number {
    if (this.couponValidation?.valid && this.couponValidation.finalAmount != null) {
      return this.couponValidation.finalAmount;
    }
    return this.selectedAmount;
  }

  openPaymentLink(): void {
    if (!this.settings || !this.selectedPlan) return;
    const plan = this.settings.pricing[
      this.selectedPlan as 'monthly' | 'yearly' | 'lifetime'
    ];
    if (!plan.instamojoLink) {
      alert('Payment link not set up yet. Please contact support.');
      return;
    }
    window.open(plan.instamojoLink, '_blank');
  }

  openWhatsApp(): void {
    if (!this.settings?.whatsappNumber) return;
    const couponInfo = this.couponCode
      ? `Coupon: ${this.couponCode}`
      : this.referralCode
        ? `Referred by: ${this.referralCode}`
        : '';
    const msg = encodeURIComponent(
      `Hi! I want to upgrade my PhotoMate subscription.\n` +
      `Plan: ${this.selectedPlan || 'Not selected'}\n` +
      `Amount: ₹${this.getFinalAmount()}\n` +
      `${couponInfo}`
    );
    window.open(
      `https://wa.me/${this.settings.whatsappNumber}?text=${msg}`,
      '_blank'
    );
  }

  openEmail(): void {
    if (!this.settings?.contactEmail) return;
    window.open(
      `mailto:${this.settings.contactEmail}?subject=PhotoMate Subscription Upgrade`,
      '_blank'
    );
  }
}