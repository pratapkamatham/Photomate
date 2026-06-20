import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Affiliate } from 'src/app/core/models/affiliate.model';
import { User, UserRole } from 'src/app/core/models/user.model';
import { AffiliateService } from 'src/app/core/services/affiliate.service';

@Component({
  selector: 'app-affiliates-list',
  templateUrl: './affiliates-list.component.html',
  styleUrls: ['./affiliates-list.component.css']
})
export class AffiliatesListComponent implements OnInit {
  affiliates: Affiliate[] = [];
  affiliateAccounts: User[] = [];
  affiliateForm!: FormGroup;
  userForm!: FormGroup;
  isLoading = true;
  isLoadingAffiliateAccounts = true;
  isSaving = false;
  isCreatingUser = false;
  errorMessage = '';
  successMessage = '';
  createdCredentials: { name: string; email: string; password: string; role: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private affiliateService: AffiliateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.affiliateForm = this.fb.group({
      ownerUid: ['', Validators.required],
      accountId: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      commissionRate: [20, [Validators.required, Validators.min(0)]],
      targetCount: [10, [Validators.required, Validators.min(0)]]
    });
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['affiliate', Validators.required]
    });
    this.loadAffiliates();
    this.loadAffiliateAccounts();
  }

  loadAffiliateAccounts(): void {
    this.isLoadingAffiliateAccounts = true;
    this.affiliateService.getUsersByRole('affiliate').subscribe({
      next: (accounts: User[]) => {
        this.affiliateAccounts = accounts;
        this.isLoadingAffiliateAccounts = false;
      },
      error: (err: unknown) => {
        console.error('Affiliate accounts failed:', err);
        this.errorMessage = 'Could not load affiliate accounts.';
        this.isLoadingAffiliateAccounts = false;
      }
    });
  }

  selectAccount(): void {
    const uid = this.affiliateForm.get('accountId')?.value;
    const account = this.affiliateAccounts.find(item => item.uid === uid);
    if (!account) return;

    const existingAffiliate = this.affiliates.find(item => item.ownerUid === account.uid);
    this.affiliateForm.patchValue({
      ownerUid: account.uid,
      name: account.name || existingAffiliate?.name || account.email,
      email: account.email,
      phone: account.phone || existingAffiliate?.phone || ''
    });
  }

  createUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isCreatingUser = true;
    this.errorMessage = '';
    this.createdCredentials = null;
    const value = this.userForm.value;

    this.affiliateService.createPlatformUser({
      name: value.name.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      role: value.role as UserRole
    }).subscribe({
      next: result => {
        this.isCreatingUser = false;
        this.createdCredentials = {
          name: value.name,
          email: value.email,
          password: result.temporaryPassword,
          role: result.role === 'super-admin' ? 'Admin' : result.role
        };
        this.userForm.reset({ role: 'affiliate' });
        this.loadAffiliateAccounts();
      },
      error: err => {
        console.error('User creation failed:', err);
        this.isCreatingUser = false;
        this.errorMessage = err?.message || 'Could not create the user.';
      }
    });
  }

  loadAffiliates(): void {
    this.isLoading = true;
    this.affiliateService.getAllAffiliates().subscribe({
      next: data => {
        this.affiliates = data;
        this.isLoading = false;
      },
      error: err => {
        console.error('Affiliates failed:', err);
        this.errorMessage = 'Could not load affiliates.';
        this.isLoading = false;
      }
    });
  }

  saveAffiliate(): void {
    if (this.affiliateForm.invalid) {
      this.affiliateForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const value = this.affiliateForm.value;

    this.affiliateService.createAffiliateProfile(
      value.ownerUid,
      value.name,
      value.email,
      value.phone,
      Number(value.commissionRate),
      Number(value.targetCount)
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Affiliate profile saved. Open details to assign coupon or referral codes.';
        this.affiliateForm.reset({ accountId: '', commissionRate: 20, targetCount: 10 });
        this.loadAffiliates();
      },
      error: err => {
        console.error('Affiliate save failed:', err);
        this.isSaving = false;
        this.errorMessage = 'Could not save affiliate. Check the selected account and admin permissions.';
      }
    });
  }

  openAffiliate(affiliate: Affiliate): void {
    if (affiliate.id) this.router.navigate(['/admin/affiliates', affiliate.id]);
  }

  toggleAffiliate(affiliate: Affiliate, event: Event): void {
    event.stopPropagation();
    if (!affiliate.id) return;
    const next = !affiliate.isActive;
    this.affiliateService.toggleAffiliate(affiliate.id, next).subscribe({
      next: () => affiliate.isActive = next,
      error: () => alert('Could not update affiliate status.')
    });
  }
}