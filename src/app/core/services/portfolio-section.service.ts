import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, Observable, of, switchMap } from 'rxjs';
import { PortfolioAsset, PortfolioSection } from '../models/portfolio-section.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioSectionService {
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  createSection(data: Partial<PortfolioSection>): Observable<string> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const ref = collection(this.firestore, 'portfolioSections');
    return from(addDoc(ref, {
      ...data,
      photographerId: uid,
      isPrivate: data.isPrivate ?? false,
      createdAt: serverTimestamp()
    })).pipe(switchMap(docRef => of(docRef.id)));
  }

  getMySections(): Observable<PortfolioSection[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of([]);

    const ref = collection(this.firestore, 'portfolioSections');
    const q = query(ref, where('photographerId', '==', uid));

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const sections = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as PortfolioSection));
        sections.sort((a, b) => this.toMillis(b.createdAt) - this.toMillis(a.createdAt));
        return of(sections);
      })
    );
  }

  getPublicSections(photographerId: string): Observable<PortfolioSection[]> {
    const ref = collection(this.firestore, 'portfolioSections');
    const q = query(
      ref,
      where('photographerId', '==', photographerId),
      where('isPrivate', '==', false)
    );

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const sections = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as PortfolioSection));
        sections.sort((a, b) => this.toMillis(b.createdAt) - this.toMillis(a.createdAt));
        return of(sections);
      })
    );
  }

  getSectionById(id: string): Observable<PortfolioSection | null> {
    const ref = doc(this.firestore, `portfolioSections/${id}`);
    return from(getDoc(ref)).pipe(
      switchMap(snapshot => snapshot.exists()
        ? of({ id: snapshot.id, ...snapshot.data() } as PortfolioSection)
        : of(null)
      )
    );
  }

  getSectionBySlug(photographerId: string, slug: string): Observable<PortfolioSection | null> {
    const ref = collection(this.firestore, 'portfolioSections');
    const q = query(
      ref,
      where('photographerId', '==', photographerId),
      where('slug', '==', slug),
      where('isPrivate', '==', false)
    );

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) return of(null);
        const d = snapshot.docs[0];
        return of({ id: d.id, ...d.data() } as PortfolioSection);
      })
    );
  }

  updateSection(id: string, data: Partial<PortfolioSection>): Observable<void> {
    const ref = doc(this.firestore, `portfolioSections/${id}`);
    return from(updateDoc(ref, { ...data }));
  }

  deleteSection(id: string): Observable<void> {
    const ref = doc(this.firestore, `portfolioSections/${id}`);
    return from(deleteDoc(ref));
  }

  saveAsset(asset: Partial<PortfolioAsset>): Observable<string> {
    const ref = collection(this.firestore, 'portfolioAssets');
    return from(addDoc(ref, {
      ...asset,
      createdAt: serverTimestamp()
    })).pipe(switchMap(docRef => of(docRef.id)));
  }

  getSectionAssets(sectionId: string): Observable<PortfolioAsset[]> {
    const ref = collection(this.firestore, 'portfolioAssets');
    const q = query(ref, where('sectionId', '==', sectionId));

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const assets = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as PortfolioAsset));
        assets.sort((a, b) => this.toMillis(a.createdAt) - this.toMillis(b.createdAt));
        return of(assets);
      })
    );
  }


  getPublicAssetsForPhotographer(photographerId: string): Observable<PortfolioAsset[]> {
    const ref = collection(this.firestore, 'portfolioAssets');
    const q = query(ref, where('photographerId', '==', photographerId));

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const assets = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as PortfolioAsset));
        assets.sort((a, b) => this.toMillis(a.createdAt) - this.toMillis(b.createdAt));
        return of(assets);
      })
    );
  }
  private toMillis(value: any): number {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    return 0;
  }
}

