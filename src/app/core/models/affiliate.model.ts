export interface CouponValidation {
  valid: boolean;
  message: string;
  discountAmount: number;
  finalAmount: number;
}