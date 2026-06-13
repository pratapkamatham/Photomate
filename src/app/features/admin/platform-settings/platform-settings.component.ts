import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PlatformSettings } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-platform-settings',
  templateUrl: './platform-settings.component.html',
  styleUrls: ['./platform-settings.component.css']
})
export class PlatformSettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      platformName: ['PhotoMate', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      whatsappNumber: ['', Validators.required],
      trialDays: [7, [Validators.required, Validators.min(1)]],
      monthlyAmount: [0, Validators.required],
      monthlyLink: [''],
      yearlyAmount: [0, Validators.required],
      yearlyLink: [''],
      lifetimeAmount: [0, Validators.required],
      lifetimeLink: ['']
    });
    this.loadSettings();
  }

  loadSettings(): void {
    this.subscriptionService.getPlatformSettings().subscribe({
      next: (settings) => {
        this.isLoading = false;
        if (settings) {
          this.settingsForm.patchValue({
            platformName: settings.platformName,
            contactEmail: settings.contactEmail,
            whatsappNumber: settings.whatsappNumber,
            trialDays: settings.trialDays,
            monthlyAmount: settings.pricing.monthly.amount,
            monthlyLink: settings.pricing.monthly.instamojoLink,
            yearlyAmount: settings.pricing.yearly.amount,
            yearlyLink: settings.pricing.yearly.instamojoLink,
            lifetimeAmount: settings.pricing.lifetime.amount,
            lifetimeLink: settings.pricing.lifetime.instamojoLink
          });
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    const v = this.settingsForm.value;

    const settings: PlatformSettings = {
      platformName: v.platformName,
      contactEmail: v.contactEmail,
      whatsappNumber: v.whatsappNumber,
      trialDays: v.trialDays,
      pricing: {
        monthly: { amount: v.monthlyAmount, instamojoLink: v.monthlyLink, label: 'Monthly', description: 'Billed every month' },
        yearly: { amount: v.yearlyAmount, instamojoLink: v.yearlyLink, label: 'Yearly', description: 'Billed once a year' },
        lifetime: { amount: v.lifetimeAmount, instamojoLink: v.lifetimeLink, label: 'Lifetime', description: 'One time payment' }
      }
    };

    this.subscriptionService.savePlatformSettings(settings).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Platform settings saved!';
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Failed to save. Try again.';
      }
    });
  }
}