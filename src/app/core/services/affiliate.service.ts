import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CouponValidation } from '../models/affiliate.model';

@Injectable({
  providedIn: 'root'
})
export class AffiliateService {

  constructor(private firestore: Firestore) {}

  /**
   * Validates a coupon code against Firestore rules and returns the discount structure.
   * @param couponCode The entered code (e.g., 'SAHA_20')
   * @param originalAmount The standard price of the selected plan
   */
  validateCoupon(couponCode: string, originalAmount: number): Observable<CouponValidation> {
    if (!couponCode || !couponCode.trim()) {
      return of({
        valid: false,
        message: 'Coupon code cannot be empty.',
        discountAmount: 0,
        finalAmount: originalAmount
      });
    }

    // Convert to lowercase to ensure consistency regardless of user input casing
    const cleanedCode = couponCode.trim().toLowerCase();
    const couponRef = doc(this.firestore, `coupons/${cleanedCode}`);

    return from(getDoc(couponRef)).pipe(
      map(snapshot => {
        if (!snapshot.exists()) {
          return {
            valid: false,
            message: 'Invalid coupon code.',
            discountAmount: 0,
            finalAmount: originalAmount
          };
        }

        const data = snapshot.data();
        const now = new Date();
        
        // 1. Check Expiry Date if it exists
        if (data['expiresAt']) {
          const expiryDate = data['expiresAt'].toDate ? data['expiresAt'].toDate() : new Date(data['expiresAt']);
          if (now > expiryDate) {
            return {
              valid: false,
              message: 'This coupon code has expired.',
              discountAmount: 0,
              finalAmount: originalAmount
            };
          }
        }

        // 2. Verify Active State flag
        if (data['isActive'] === false) {
          return {
            valid: false,
            message: 'This coupon is no longer active.',
            discountAmount: 0,
            finalAmount: originalAmount
          };
        }

        // 3. Compute calculations safely based on discount type (percentage vs flat rate)
        let discount = 0;
        if (data['type'] === 'percentage') {
          const percent = data['value'] || 0; // e.g. 20
          discount = Math.round(originalAmount * (percent / 100));
        } else if (data['type'] === 'flat') {
          discount = data['value'] || 0; // e.g. 500 INR
        }

        // Prevent negative final numbers just in case a coupon discount value is too high
        const finalAmount = Math.max(0, originalAmount - discount);

        return {
          valid: true,
          message: data['description'] || 'Coupon applied successfully!',
          discountAmount: discount,
          finalAmount: finalAmount
        };
      }),
      catchError(error => {
        console.error('Error validating coupon:', error);
        return of({
          valid: false,
          message: 'Unable to validate coupon due to a connection issue.',
          discountAmount: 0,
          finalAmount: originalAmount
        });
      })
    );
  }
}