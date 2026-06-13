import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AffiliateService } from
  '../../../core/services/affiliate.service';
import { Affiliate, Sale } from
  '../../../core/models/affiliate.model';

@Component({
  selector: 'app-my-sales',
  templateUrl: './my-sales.component.html',
  styleUrls: ['./my-sales.component.css']
})
export class MySalesComponent implements OnInit {

  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  affiliate: Affiliate | null = null;
  isLoading = true;
  selectedMonth = '';
  availableMonths: string[] = [];

  constructor(
    private authService: AuthService,
    private affiliateService: AffiliateService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${
      String(now.getMonth() + 1).padStart(2, '0')
    }`;

    this.authService.currentUser$.subscribe(user => {
      if (!user) return;

      this.affiliateService.getAffiliateByUid(user.uid)
        .subscribe(affiliate => {
          this.affiliate = affiliate;
          if (!affiliate?.id) {
            this.isLoading = false;
            return;
          }

          this.affiliateService
            .getSalesByAffiliate(affiliate.id)
            .subscribe({
              next: (sales) => {
                this.sales = sales;
                this.extractMonths();
                this.filterByMonth();
                this.isLoading = false;
              },
              error: () => { this.isLoading = false; }
            });
        });
    });
  }

  extractMonths(): void {
    const months = [...new Set(this.sales.map(s => s.month))];
    this.availableMonths = months.sort().reverse();
  }

  filterByMonth(): void {
    if (!this.selectedMonth) {
      this.filteredSales = this.sales;
    } else {
      this.filteredSales = this.sales.filter(
        s => s.month === this.selectedMonth
      );
    }
  }

  get monthTotal(): number {
    return this.filteredSales.reduce(
      (sum, s) => sum + s.finalAmount, 0
    );
  }

  get monthCommission(): number {
    return this.filteredSales.reduce(
      (sum, s) => sum + s.commissionAmount, 0
    );
  }

}

