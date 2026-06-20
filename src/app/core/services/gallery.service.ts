import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, Observable, switchMap, of } from 'rxjs';
import { Gallery, GallerySection } from '../models/gallery.model';

@Injectable({
  providedIn: 'root'
})
export class GalleryService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  private readonly defaultSection: GallerySection = {
    id: 'highlights',
    title: 'Highlights',
    description: 'Best moments from this event',
    sortOrder: 0
  };

  createGallery(data: Partial<Gallery>): Observable<string> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const sections = data.sections?.length ? data.sections : [this.defaultSection];
    const ref = collection(this.firestore, 'galleries');

    return from(addDoc(ref, {
      ...data,
      photographerId: uid,
      isPrivate: data.isPrivate ?? false,
      sections,
      defaultSectionId: data.defaultSectionId || sections[0].id,
      shareSettings: {
        allowDownloads: false,
        showBranding: true,
        leadCaptureEnabled: true,
        ctaLabel: 'Book this photographer',
        ...(data.shareSettings || {})
      },
      createdAt: serverTimestamp()
    })).pipe(
      switchMap(docRef => of(docRef.id))
    );
  }

  getMyGalleries(): Observable<Gallery[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of([]);

    const ref = collection(this.firestore, 'galleries');
    const q = query(
      ref,
      where('photographerId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const galleries = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Gallery));
        return of(galleries);
      })
    );
  }

  getGalleryById(id: string): Observable<Gallery | null> {
    const ref = doc(this.firestore, `galleries/${id}`);
    return from(getDoc(ref)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          return of({ id: snapshot.id, ...snapshot.data() } as Gallery);
        }
        return of(null);
      })
    );
  }

  getGalleryBySlug(
    photographerId: string,
    slug: string
  ): Observable<Gallery | null> {
    const ref = collection(this.firestore, 'galleries');
    const q = query(
      ref,
      where('photographerId', '==', photographerId),
      where('slug', '==', slug),
      where('isPrivate', 'in', [false, null])
    );
    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (!snapshot.empty) {
          const d = snapshot.docs[0];
          return of({ id: d.id, ...d.data() } as Gallery);
        }
        return of(null);
      })
    );
  }

  getPublicGalleries(photographerId: string): Observable<Gallery[]> {
    const ref = collection(this.firestore, 'galleries');
    const q = query(
      ref,
      where('photographerId', '==', photographerId),
      where('isPrivate', 'in', [false, null]),
      orderBy('createdAt', 'desc')
    );
    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const galleries = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Gallery));
        return of(galleries);
      })
    );
  }

  updateGallery(id: string, data: Partial<Gallery>): Observable<void> {
    const ref = doc(this.firestore, `galleries/${id}`);
    return from(updateDoc(ref, { ...data }));
  }

  deleteGallery(id: string): Observable<void> {
    const ref = doc(this.firestore, `galleries/${id}`);
    return from(deleteDoc(ref));
  }
}


