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
import { Gallery } from '../models/gallery.model';

@Injectable({
  providedIn: 'root'
})
export class GalleryService {

   constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}
 
  // -----------------------------------------------
  // CREATE gallery
  // -----------------------------------------------
  createGallery(data: Partial<Gallery>): Observable<string> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
 
    const ref = collection(this.firestore, 'galleries');
    return from(addDoc(ref, {
      ...data,
      photographerId: uid,
      createdAt: serverTimestamp()
    })).pipe(
      switchMap(docRef => of(docRef.id))
    );
  }
 
  // -----------------------------------------------
  // GET all galleries for current photographer
  // -----------------------------------------------
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
 
  // -----------------------------------------------
  // GET single gallery by ID
  // -----------------------------------------------
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
 
  // -----------------------------------------------
  // GET gallery by slug (public view)
  // -----------------------------------------------
  getGalleryBySlug(
    photographerId: string,
    slug: string
  ): Observable<Gallery | null> {
    const ref = collection(this.firestore, 'galleries');
    const q = query(
      ref,
      where('photographerId', '==', photographerId),
      where('slug', '==', slug)
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
 
  // -----------------------------------------------
  // UPDATE gallery
  // -----------------------------------------------
  updateGallery(id: string, data: Partial<Gallery>): Observable<void> {
    const ref = doc(this.firestore, `galleries/${id}`);
    return from(updateDoc(ref, { ...data }));
  }
 
  // -----------------------------------------------
  // DELETE gallery
  // -----------------------------------------------
  deleteGallery(id: string): Observable<void> {
    const ref = doc(this.firestore, `galleries/${id}`);
    return from(deleteDoc(ref));
  }
}
