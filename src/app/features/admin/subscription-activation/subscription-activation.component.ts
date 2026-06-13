import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Subscription } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-subscription-activation',
  templateUrl: './subscription-activation.component.html',
  styleUrls: ['./subscription-activation.component.css']
})
export class SubscriptionActivationComponent implements OnInit {
  activationForm!: FormGroup;
  subscriptions: Subscription[] = [];
  isLoading = true;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService
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

  onActivate(): void {
    if (this.activationForm.invalid) {
      this.activationForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const v = this.activationForm.value;

    this.subscriptionService.activateSubscription(
      v.photographerId,
      v.plan,
      v.amount,
      v.couponCode || undefined,
      v.affiliateId || undefined
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = `Plan successfully activated for user ID ${v.photographerId}!`;
        this.activationForm.patchValue({ photographerId: '', amount: 0, couponCode: '', affiliateId: '' });
        this.loadSubscriptions();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Failed to activate the plan manually. Please check data entries.';
      }
    });
  }
}