import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from '@angular/fire/firestore';
import {
  Auth,
  createUserWithEmailAndPassword
} from '@angular/fire/auth';
import { Observable, from, of, switchMap } from 'rxjs';
import {
  Affiliate,
  AffiliateCode,
  Sale,
  CouponValidation
} from '../models/affiliate.model';

@Injectable({
  providedIn: 'root'
})
export class AffiliateService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  // -----------------------------------------------
  // CREATE AFFILIATE USER (admin only)
  // Creates Firebase Auth + Firestore docs
  // -----------------------------------------------
  createAffiliateUser(
    name: string,
    email: string,
    password: string,
    phone: string,
    commissionRate: number,
    targetCount: number
  ): Observable<string> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      switchMap(credential => {
        const uid = credential.user.uid;

        // Create user role doc
        const userRef = doc(this.firestore, `users/${uid}`);
        return from(setDoc(userRef, {
          uid,
          email,
          role: 'affiliate',
          createdAt: serverTimestamp()
        })).pipe(
          switchMap(() => {
            // Create affiliate profile
            const affiliateRef = doc(
              this.firestore, `affiliates/${uid}`
            );
            return from(setDoc(affiliateRef, {
              ownerUid: uid,
              name,
              email,
              phone,
              commissionRate,
              targetCount,
              currentCount: 0,
              totalEarnings: 0,
              pendingPayout: 0,
              isActive: true,
              createdAt: serverTimestamp()
            })).pipe(
              switchMap(() => of(uid))
            );
          })
        );
      })
    );
  }

  // -----------------------------------------------
  // GET AFFILIATE BY UID
  // -----------------------------------------------
  getAffiliateByUid(uid: string): Observable<Affiliate | null> {
    const ref = doc(this.firestore, `affiliates/${uid}`);
    return from(getDoc(ref)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          return of({ id: snapshot.id, ...snapshot.data() } as Affiliate);
        }
        return of(null);
      })
    );
  }

  // -----------------------------------------------
  // GET ALL AFFILIATES (admin)
  // -----------------------------------------------
  getAllAffiliates(): Observable<Affiliate[]> {
    const ref = collection(this.firestore, 'affiliates');
    const q = query(ref, orderBy('createdAt', 'desc'));
    return from(getDocs(q)).pipe(
      switchMap(snapshot => of(
        snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Affiliate))
      ))
    );
  }

  // -----------------------------------------------
  // ADD CODE TO AFFILIATE (admin)
  // -----------------------------------------------
  addCodeToAffiliate(
    affiliateId: string,
    ownerUid: string,
    code: string,
    type: 'coupon' | 'referral',
    discountPercent: number
  ): Observable<string> {
    const ref = collection(this.firestore, 'affiliate_codes');
    return from(addDoc(ref, {
      affiliateId,
      ownerUid,
      code: code.toUpperCase(),
      type,
      discountPercent: type === 'referral' ? 0 : discountPercent,
      usageCount: 0,
      isActive: true,
      createdAt: serverTimestamp()
    })).pipe(
      switchMap(docRef => of(docRef.id))
    );
  }

  // -----------------------------------------------
  // GET CODES FOR AFFILIATE (by ownerUid)
  // Used in affiliate portal - only own codes
  // -----------------------------------------------
  getMyAffiliateCode(ownerUid: string): Observable<AffiliateCode[]> {
    const ref = collection(this.firestore, 'affiliate_codes');
    const q = query(
      ref,
      where('ownerUid', '==', ownerUid),
      where('isActive', '==', true),
      orderBy('createdAt', 'asc')
    );
    return from(getDocs(q)).pipe(
      switchMap(snapshot => of(
        snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as AffiliateCode))
      ))
    );
  }

  // -----------------------------------------------
  // GET CODES BY AFFILIATE ID (admin)
  // -----------------------------------------------
  getCodesByAffiliateId(
    affiliateId: string
  ): Observable<AffiliateCode[]> {
    const ref = collection(this.firestore, 'affiliate_codes');
    const q = query(
      ref,
      where('affiliateId', '==', affiliateId),
      orderBy('createdAt', 'asc')
    );
    return from(getDocs(q)).pipe(
      switchMap(snapshot => of(
        snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as AffiliateCode))
      ))
    );
  }

  // -----------------------------------------------
  // TOGGLE CODE STATUS (admin)
  // -----------------------------------------------
  toggleCode(codeId: string, isActive: boolean): Observable<void> {
    const ref = doc(this.firestore, `affiliate_codes/${codeId}`);
    return from(updateDoc(ref, { isActive }));
  }

  // -----------------------------------------------
  // DELETE CODE (admin)
  // -----------------------------------------------
  deleteCode(codeId: string): Observable<void> {
    const ref = doc(this.firestore, `affiliate_codes/${codeId}`);
    return from(deleteDoc(ref));
  }

  // -----------------------------------------------
  // VALIDATE COUPON CODE (upgrade page)
  // -----------------------------------------------
  validateCoupon(
    code: string,
    originalAmount: number
  ): Observable<CouponValidation> {
    const ref = collection(this.firestore, 'affiliate_codes');
    const q = query(
      ref,
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true)
    );

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) {
          return of({
            valid: false,
            message: 'Invalid or expired coupon code.'
          });
        }

        const affiliateCode = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as AffiliateCode;

        // Get affiliate details
        const affiliateRef = doc(
          this.firestore,
          `affiliates/${affiliateCode.affiliateId}`
        );

        return from(getDoc(affiliateRef)).pipe(
          switchMap(affiliateSnap => {
            if (!affiliateSnap.exists()) {
              return of({ valid: false, message: 'Invalid code.' });
            }

            const affiliate = {
              id: affiliateSnap.id,
              ...affiliateSnap.data()
            } as Affiliate;

            const discountAmount = Math.round(
              (originalAmount * affiliateCode.discountPercent) / 100
            );
            const finalAmount = originalAmount - discountAmount;

            return of({
              valid: true,
              affiliate,
              affiliateCode,
              discountPercent: affiliateCode.discountPercent,
              discountAmount,
              finalAmount,
              message: affiliateCode.type === 'referral'
                ? 'Referral code applied!'
                : `${affiliateCode.discountPercent}% discount applied!`
            });
          })
        );
      })
    );
  }

  // -----------------------------------------------
  // RECORD SALE (on admin subscription activation)
  // -----------------------------------------------
  recordSale(sale: Partial<Sale>): Observable<string> {
    const now = new Date();
    const month = `${now.getFullYear()}-${
      String(now.getMonth() + 1).padStart(2, '0')
    }`;

    const ref = collection(this.firestore, 'sales');
    return from(addDoc(ref, {
      ...sale,
      month,
      status: 'pending',
      createdAt: serverTimestamp()
    })).pipe(
      switchMap(docRef => {
        // Update affiliate stats
        if (sale.affiliateId) {
          const affiliateRef = doc(
            this.firestore,
            `affiliates/${sale.affiliateId}`
          );
          updateDoc(affiliateRef, {
            currentCount: increment(1),
            totalEarnings: increment(sale.commissionAmount || 0),
            pendingPayout: increment(sale.commissionAmount || 0)
          });
        }

        // Update code usage count
        if (sale.affiliateCodeId) {
          const codeRef = doc(
            this.firestore,
            `affiliate_codes/${sale.affiliateCodeId}`
          );
          updateDoc(codeRef, {
            usageCount: increment(1)
          });
        }

        return of(docRef.id);
      })
    );
  }

  // -----------------------------------------------
  // GET SALES BY AFFILIATE
  // -----------------------------------------------
  getSalesByAffiliate(affiliateId: string): Observable<Sale[]> {
    const ref = collection(this.firestore, 'sales');
    const q = query(
      ref,
      where('affiliateId', '==', affiliateId),
      orderBy('createdAt', 'desc')
    );
    return from(getDocs(q)).pipe(
      switchMap(snapshot => of(
        snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Sale))
      ))
    );
  }

  // -----------------------------------------------
  // MARK PAYOUT PAID (admin)
  // -----------------------------------------------
  markPayoutPaid(
    affiliateId: string,
    amount: number
  ): Observable<void> {
    const ref = doc(this.firestore, `affiliates/${affiliateId}`);
    return from(updateDoc(ref, {
      pendingPayout: 0,
      lastPaidAt: serverTimestamp(),
      lastPaidAmount: amount
    }));
  }

  // -----------------------------------------------
  // TOGGLE AFFILIATE STATUS (admin)
  // -----------------------------------------------
  toggleAffiliate(
    id: string,
    isActive: boolean
  ): Observable<void> {
    const ref = doc(this.firestore, `affiliates/${id}`);
    return from(updateDoc(ref, { isActive }));
  }

  // -----------------------------------------------
  // UPDATE AFFILIATE (admin)
  // -----------------------------------------------
  updateAffiliate(
    id: string,
    data: Partial<Affiliate>
  ): Observable<void> {
    const ref = doc(this.firestore, `affiliates/${id}`);
    return from(updateDoc(ref, { ...data }));
  }

}
