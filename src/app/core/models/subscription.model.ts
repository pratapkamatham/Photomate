export interface Subscription {
  id?: string;
  photographerId: string;
  plan: 'trial' | 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'suspended';
  startDate: any;
  endDate?: any;
  trialEndsAt?: any;
  amount: number;
  couponCode?: string;
  affiliateId?: string;
  createdAt: any;
}
export interface PlatformSettings {
  contactEmail: string;
  whatsappNumber: string;
  trialDays: number;
  platformName: string;
  pricing: {
    monthly:  PricingPlan;
    yearly:   PricingPlan;
    lifetime: PricingPlan;
  };
}

export interface PricingPlan {
  amount: number;
  instamojoLink: string;
  label: string;
  description: string;
}

export interface TrialStatus {
  status: 'active' | 'expiring_soon' | 'expired';
  daysRemaining: number;
}