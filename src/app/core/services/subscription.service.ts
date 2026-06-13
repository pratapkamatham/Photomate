import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, of, switchMap } from 'rxjs';
import {
  Subscription,
  PlatformSettings,
  TrialStatus
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  // -----------------------------------------------
  // CREATE TRIAL on registration
  // -----------------------------------------------
  createTrial(uid: string, trialDays: number = 7): Observable<void> {
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const ref = doc(this.firestore, `subscriptions/${uid}`);
    return from(setDoc(ref, {
      photographerId: uid,
      plan:           'trial',
      status:         'active',
      startDate:      serverTimestamp(),
      trialEndsAt:    Timestamp.fromDate(trialEndsAt),
      amount:         0,
      createdAt:      serverTimestamp()
    }));
  }
  // -----------------------------------------------
  // GET my subscription
  // -----------------------------------------------
  getMySubscription(): Observable<Subscription | null> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of(null);

    const ref = doc(this.firestore, `subscriptions/${uid}`);
    return from(getDoc(ref)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          return of({
            id: snapshot.id,
            ...snapshot.data()
          } as Subscription);
        }
        return of(null);
      })
    );
  }

  // -----------------------------------------------
  // GET trial status
  // -----------------------------------------------
  getTrialStatus(subscription: Subscription): TrialStatus {
    if (subscription.plan !== 'trial') {
      return { status: 'active', daysRemaining: 999 };
    }

    if (!subscription.trialEndsAt) {
      return { status: 'expired', daysRemaining: 0 };
    }

    const now = new Date();
    const trialEnd = subscription.trialEndsAt.toDate
      ? subscription.trialEndsAt.toDate()
      : new Date(subscription.trialEndsAt);

    const diffMs = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return { status: 'expired', daysRemaining: 0 };
    }

    if (daysRemaining <= 3) {
      return { status: 'expiring_soon', daysRemaining };
    }

    return { status: 'active', daysRemaining };
  }

  // -----------------------------------------------
  // ACTIVATE subscription (super admin only)
  // -----------------------------------------------
  activateSubscription(
    photographerId: string,
    plan: 'monthly' | 'yearly' | 'lifetime',
    amount: number,
    couponCode?: string,
    affiliateId?: string
  ): Observable<void> {
    const now = new Date();
    let endDate: Date | null = null;

    if (plan === 'monthly') {
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === 'yearly') {
      endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const ref = doc(this.firestore, `subscriptions/${photographerId}`);
    const data: any = {
      plan,
      status:    'active',
      amount,
      startDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (endDate) {
      data['endDate'] = Timestamp.fromDate(endDate);
    }
    if (couponCode) data['couponCode'] = couponCode;
    if (affiliateId) data['affiliateId'] = affiliateId;

    return from(updateDoc(ref, data));
  }

  // -----------------------------------------------
  // GET platform settings
  // -----------------------------------------------
  getPlatformSettings(): Observable<PlatformSettings | null> {
    const ref = doc(this.firestore, 'system/platform_settings');
    return from(getDoc(ref)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          return of(snapshot.data() as PlatformSettings);
        }
        return of(null);
      })
    );
  }

  // -----------------------------------------------
  // SAVE platform settings (super admin)
  // -----------------------------------------------
  savePlatformSettings(settings: PlatformSettings): Observable<void> {
    const ref = doc(this.firestore, 'system/platform_settings');
    return from(setDoc(ref, settings, { merge: true }));
  }

  // -----------------------------------------------
  // GET all subscriptions (super admin)
  // -----------------------------------------------
  getAllSubscriptions(): Observable<Subscription[]> {
    const ref = collection(this.firestore, 'subscriptions');
    return from(getDocs(ref)).pipe(
      switchMap(snapshot => {
        const subs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Subscription));
        return of(subs);
      })
    );
  }
}
