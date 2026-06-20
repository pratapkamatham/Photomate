import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Affiliate, AffiliateCode, Sale } from 'src/app/core/models/affiliate.model';
import { AffiliateService } from 'src/app/core/services/affiliate.service';

@Component({
  selector: 'app-affiliate-detail',
  templateUrl: './affiliate-detail.component.html',
  styleUrls: ['./affiliate-detail.component.css']
})
export class AffiliateDetailComponent implements OnInit {
  affiliateId = '';
  affiliate: Affiliate | null = null;
  codes: AffiliateCode[] = [];
  sales: Sale[] = [];
  codeForm!: FormGroup;
  isLoading = true;
  isSavingCode = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private affiliateService: AffiliateService
  ) {}

  ngOnInit(): void {
    this.affiliateId = this.route.snapshot.paramMap.get('id') || '';
    this.codeForm = this.fb.group({
      code: ['', Validators.required],
      type: ['coupon', Validators.required],
      discountPercent: [10, [Validators.required, Validators.min(0)]]
    });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.affiliateService.getAffiliateByUid(this.affiliateId).subscribe({
      next: affiliate => {
        this.affiliate = affiliate;
        this.loadCodes();
        this.loadSales();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadCodes(): void {
    this.affiliateService.getCodesByAffiliateId(this.affiliateId).subscribe(codes => this.codes = codes);
  }

  loadSales(): void {
    this.affiliateService.getSalesByAffiliate(this.affiliateId).subscribe(sales => this.sales = sales);
  }

  addCode(): void {
    if (this.codeForm.invalid || !this.affiliate) {
      this.codeForm.markAllAsTouched();
      return;
    }
    this.isSavingCode = true;
    const v = this.codeForm.value;
    this.affiliateService.addCodeToAffiliate(
      this.affiliateId,
      this.affiliate.ownerUid,
      v.code,
      v.type,
      Number(v.discountPercent)
    ).subscribe({
      next: () => {
        this.isSavingCode = false;
        this.message = 'Code assigned.';
        this.codeForm.reset({ type: 'coupon', discountPercent: 10 });
        this.loadCodes();
      },
      error: () => {
        this.isSavingCode = false;
        this.message = 'Could not assign code.';
      }
    });
  }

  toggleCode(code: AffiliateCode): void {
    if (!code.id) return;
    this.affiliateService.toggleCode(code.id, !code.isActive).subscribe({
      next: () => code.isActive = !code.isActive
    });
  }

  deleteCode(code: AffiliateCode): void {
    if (!code.id || !confirm(`Delete code ${code.code}?`)) return;
    this.affiliateService.deleteCode(code.id).subscribe({
      next: () => this.codes = this.codes.filter(item => item.id !== code.id)
    });
  }

  markPaid(): void {
    if (!this.affiliate?.id || !this.affiliate.pendingPayout) return;
    this.affiliateService.markPayoutPaid(this.affiliate.id, this.affiliate.pendingPayout).subscribe({
      next: () => this.load()
    });
  }
}
