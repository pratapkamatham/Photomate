export interface Subscription {
  id?: string;
  photographerId: string;
  plan: 'monthly' |'quaterly'|'half-yearly'| 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'suspended';
  startDate: Date;
  endDate?: Date;
  amount: number;
  createdAt: Date;
}