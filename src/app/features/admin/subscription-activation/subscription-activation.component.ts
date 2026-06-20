import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Subscription } from '../../../core/models/subscription.model';
import { Affiliate, AffiliateCode } from 'src/app/core/models/affiliate.model';
import { AffiliateService } from 'src/app/core/services/affiliate.service';

@Component({
  selector: 'app-subscription-activation',
  templateUrl: './subscription-activation.component.html',
  styleUrls: ['./subscription-activation.component.css']
})
export class SubscriptionActivationComponent implements OnInit {
  activationForm!: FormGroup;
  subscriptions: Subscription[] = [];
  identifiedAffiliate: Affiliate | null = null;
  identifiedCode: AffiliateCode | null = null;
  isLoading = true;
  isSubmitting = false;
  isCheckingCode = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService,
    private affiliateService: AffiliateService
  ) {}

  ngOnInit(): void {
    this.activationForm = this.fb.group({
      photographerId: ['', Validators.required],
      plan: ['monthly', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      couponCode: [''],
      affiliateId: ['']
    });
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.subscriptionService.getAllSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  lookupCode(): void {
    const code = this.activationForm.value.couponCode?.trim();
    this.identifiedAffiliate = null;
    this.identifiedCode = null;
    if (!code) return;

    this.isCheckingCode = true;
    this.affiliateService.getActiveCode(code).subscribe({
      next: result => {
        this.isCheckingCode = false;
        if (!result) {
          this.errorMessage = 'No active affiliate code found.';
          return;
        }
        this.errorMessage = '';
        this.identifiedAffiliate = result.affiliate;
        this.identifiedCode = result.affiliateCode;
        this.activationForm.patchValue({ affiliateId: result.affiliate.id });
      },
      error: () => {
        this.isCheckingCode = false;
        this.errorMessage = 'Could not look up affiliate code.';
      }
    });
  }

  onActivate(): void {
    if (this.activationForm.invalid) {
      this.activationForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';
    const v = this.activationForm.value;

    const activate = (affiliate?: Affiliate | null, code?: AffiliateCode | null) => {
      this.subscriptionService.activateSubscription(
        v.photographerId,
        v.plan,
        Number(v.amount),
        v.couponCode || undefined,
        affiliate?.id || v.affiliateId || undefined
      ).subscribe({
        next: () => {
          if (affiliate && code) {
            const commissionAmount = Math.round((Number(v.amount) * affiliate.commissionRate) / 100);
            this.affiliateService.recordSale({
              affiliateId: affiliate.id!,
              affiliateCodeId: code.id!,
              code: code.code,
              photographerId: v.photographerId,
              originalAmount: Number(v.amount),
              discountPercent: code.discountPercent || 0,
              discountAmount: 0,
              finalAmount: Number(v.amount),
              commissionRate: affiliate.commissionRate,
              commissionAmount,
              plan: v.plan
            }).subscribe({
              next: () => this.afterActivation(v.photographerId, true),
              error: err => {
                console.error('Sale attribution failed:', err);
                this.afterActivation(v.photographerId, false);
              }
            });
          } else {
            this.afterActivation(v.photographerId, false);
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.errorMessage = 'Failed to activate the plan manually. Please check data entries.';
        }
      });
    };

    const codeValue = v.couponCode?.trim();
    if (codeValue && (!this.identifiedAffiliate || this.identifiedCode?.code !== codeValue.toUpperCase())) {
      this.affiliateService.getActiveCode(codeValue).subscribe({
        next: result => activate(result?.affiliate || null, result?.affiliateCode || null),
        error: () => activate(null, null)
      });
      return;
    }

    activate(this.identifiedAffiliate, this.identifiedCode);
  }

  private afterActivation(photographerId: string, saleRecorded: boolean): void {
    this.isSubmitting = false;
    this.successMessage = saleRecorded
      ? `Plan activated for ${photographerId}. Affiliate sale recorded.`
      : `Plan activated for ${photographerId}.`;
    this.activationForm.patchValue({ photographerId: '', amount: 0, couponCode: '', affiliateId: '' });
    this.identifiedAffiliate = null;
    this.identifiedCode = null;
    this.loadSubscriptions();
  }
}
