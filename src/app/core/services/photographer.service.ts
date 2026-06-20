import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable, switchMap, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Photographer } from '../models/photographer.model';

@Injectable({
  providedIn: 'root'
})
export class PhotographerService {

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private functions: Functions
  ) {}

  createProfile(data: Partial<Photographer>): Observable<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const ref = doc(this.firestore, `photographers/${uid}`);

    return from(setDoc(ref, {
      ...data,
      ownerUid: uid,
      isActive: true,
      subscriptionPlan: 'none',
      createdAt: serverTimestamp()
    }));
  }

  getMyProfile(): Observable<Photographer | null> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of(null);

    const ref = doc(this.firestore, `photographers/${uid}`);

    return from(getDoc(ref)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          return of({
            id: snapshot.id,
            ...snapshot.data()
          } as Photographer);
        }

        return of(null);
      })
    );
  }

  getAllProfiles(): Observable<Photographer[]> {
    const ref = collection(this.firestore, 'photographers');

    return from(getDocs(ref)).pipe(
      map(snapshot => snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Photographer))
        .sort((a, b) => a.studioName.localeCompare(b.studioName)))
    );
  }

  getBySlug(slug: string): Observable<Photographer | null> {
    const ref = collection(this.firestore, 'photographers');
    const q = query(ref, where('slug', '==', slug));

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];

          return of({
            id: docSnap.id,
            ...docSnap.data()
          } as Photographer);
        }

        return of(null);
      })
    );
  }

  updateProfile(data: Partial<Photographer>): Observable<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const ref = doc(this.firestore, `photographers/${uid}`);
    
    // 🚀 FIX: Use setDoc with merge: true instead of updateDoc to satisfy safety conditions
    return from(setDoc(ref, { 
      ...data,
      ownerUid: uid // Explicitly ensure ownerUid is locked into the document structural base
    }, { merge: true }));
  }

  saveCloudinaryConfig(data: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  }): Observable<any> {
    const maskedApiKey = data.apiKey.replace(/\d(?=\d{4})/g, '*');
    console.groupCollapsed('[Cloudinary Config] callable request');
    console.table({
      cloudName: data.cloudName,
      apiKey: maskedApiKey,
      apiSecretLength: data.apiSecret.length
    });
    console.groupEnd();

    const fn = httpsCallable(
      this.functions,
      'saveCloudinaryConfig'
    );

    return from(fn(data)).pipe(
      tap((result: any) => {
        console.log('[Cloudinary Config] callable success', result.data);
      }),
      map((result: any) => result.data),
      catchError((err: any) => {
        console.error('[Cloudinary Config] callable failed', {
          code: err?.code,
          message: err?.message,
          details: err?.details
        });
        return throwError(() => err);
      })
    );
  }

  isSlugAvailable(slug: string): Observable<boolean> {
    const ref = collection(this.firestore, 'photographers');
    const q = query(ref, where('slug', '==', slug));

    return from(getDocs(q)).pipe(
      switchMap(snapshot => of(snapshot.empty))
    );
  }
}
