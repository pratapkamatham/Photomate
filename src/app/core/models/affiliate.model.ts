export interface Affiliate {
  id?: string;
  ownerUid: string;
  name: string;
  email: string;
  phone: string;
  commissionRate: number;
  targetCount: number;
  currentCount: number;
  totalEarnings: number;
  pendingPayout: number;
  isActive: boolean;
  createdAt?: any;
}

export interface AffiliateCode {
  id?: string;
  affiliateId: string;
  ownerUid: string;
  code: string;
  type: 'coupon' | 'referral';
  discountPercent: number;
  usageCount: number;
  isActive: boolean;
  createdAt?: any;
}

export interface Sale {
  id?: string;
  affiliateId: string;
  affiliateCodeId: string;
  code: string;
  photographerId: string;
  originalAmount: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'pending' | 'paid';
  month: string;
  paidAt?: any;
  createdAt?: any;
}

export interface CouponValidation {
  valid: boolean;
  affiliate?: Affiliate;
  affiliateCode?: AffiliateCode;
  discountPercent?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}

